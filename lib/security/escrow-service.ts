import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'
import crypto from 'crypto'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * Escrow Transaction Service for High-Value Vehicle Sales
 * Provides secure payment holding for Albanian automotive marketplace
 */
export class EscrowService {
  private static readonly ESCROW_FEE_PERCENTAGE = 0.025 // 2.5% escrow fee
  private static readonly MINIMUM_ESCROW_AMOUNT = 15000 * 100 // €15,000 in cents

  /**
   * Create escrow transaction for high-value vehicle
   */
  static async createEscrowTransaction(
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: string = 'EUR'
  ): Promise<{ success: boolean; escrowId?: string; error?: string }> {
    try {
      // Validate minimum amount
      if (amount < this.MINIMUM_ESCROW_AMOUNT) {
        return {
          success: false,
          error: `Shërbimet e escrow janë vetëm për automjete mbi €${this.MINIMUM_ESCROW_AMOUNT / 100}`
        }
      }

      // Check if listing exists and belongs to seller
      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId: sellerId,
          status: 'active'
        }
      })

      if (!listing) {
        return { success: false, error: 'Shpallja nuk u gjet ose nuk është aktive' }
      }

      // Calculate escrow fee
      const escrowFee = Math.round(amount * this.ESCROW_FEE_PERCENTAGE)

      // Set deadlines
      const fundingDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      const releaseDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

      // Default release conditions
      const releaseConditions = [
        'Buyer confirms vehicle inspection completed',
        'All required documents provided',
        'No disputes raised within inspection period'
      ]

      // Generate unique release code
      const releaseCode = crypto.randomBytes(6).toString('hex').toUpperCase()

      // Create escrow transaction
      const escrow = await prisma.escrowTransaction.create({
        data: {
          listingId,
          buyerId,
          sellerId,
          amount,
          currency,
          escrowFee,
          releaseConditions,
          fundingDeadline,
          releaseDeadline,
          releaseCode
        }
      })

      // Create initial log entry
      await this.createEscrowLog(
        escrow.id,
        'escrow_created',
        'Escrow transaction created',
        null
      )

      return { success: true, escrowId: escrow.id }
    } catch (error) {
      console.error('Escrow creation failed:', error)
      return { success: false, error: 'Krijimi i escrow dështoi' }
    }
  }

  /**
   * Fund escrow transaction
   */
  static async fundEscrow(
    escrowId: string,
    buyerId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    try {
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId }
      })

      if (!escrow) {
        return { success: false, error: 'Escrow nuk u gjet' }
      }

      if (escrow.buyerId !== buyerId) {
        return { success: false, error: 'Vetëm blerësi mund të financojë escrow' }
      }

      if (escrow.status !== 'initiated') {
        return { success: false, error: 'Escrow nuk është në gjendje të duhur për financim' }
      }

      if (new Date() > escrow.fundingDeadline) {
        return { success: false, error: 'Afati për financim ka skaduar' }
      }

      // Calculate total amount (escrow amount + fee)
      const totalAmount = escrow.amount + escrow.escrowFee

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: escrow.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        description: `Escrow payment for listing ${escrow.listingId}`,
        metadata: {
          escrowId: escrow.id,
          type: 'escrow_funding'
        }
      })

      if (paymentIntent.status === 'succeeded') {
        // Update escrow status
        await prisma.escrowTransaction.update({
          where: { id: escrowId },
          data: {
            status: 'funded',
            stripePaymentIntentId: paymentIntent.id
          }
        })

        await this.createEscrowLog(
          escrowId,
          'escrow_funded',
          'Escrow successfully funded by buyer',
          buyerId
        )

        // Notify seller that escrow is funded
        await this.notifyEscrowFunded(escrow.sellerId, escrowId)

        return { success: true, paymentIntentId: paymentIntent.id }
      } else {
        return { success: false, error: 'Pagesa nuk u përfundua me sukses' }
      }
    } catch (error) {
      console.error('Escrow funding failed:', error)
      return { success: false, error: 'Financimi i escrow dështoi' }
    }
  }

  /**
   * Release escrow funds to seller
   */
  static async releaseEscrow(
    escrowId: string,
    userId: string,
    releaseCode?: string,
    isAutoRelease: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId },
        include: {
          listing: true,
          buyer: true,
          seller: true
        }
      })

      if (!escrow) {
        return { success: false, error: 'Escrow nuk u gjet' }
      }

      if (escrow.status !== 'funded') {
        return { success: false, error: 'Escrow nuk është i financuar' }
      }

      // Validate permissions
      if (!isAutoRelease) {
        if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
          return { success: false, error: 'Nuk keni të drejtë të lironi këtë escrow' }
        }

        // If seller tries to release, they need the release code
        if (userId === escrow.sellerId && releaseCode !== escrow.releaseCode) {
          return { success: false, error: 'Kodi i lirimit është i gabuar' }
        }
      }

      // Check if disputed
      if (escrow.isDisputed) {
        return { success: false, error: 'Escrow është në mosmarrëveshje dhe nuk mund të lirohet' }
      }

      // Transfer funds to seller
      const transferResult = await this.transferFundsToSeller(escrow)
      if (!transferResult.success) {
        return { success: false, error: transferResult.error }
      }

      // Update escrow status
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: 'released',
          completedAt: new Date(),
          stripeTransferId: transferResult.transferId
        }
      })

      // Mark listing as sold
      await prisma.listing.update({
        where: { id: escrow.listingId },
        data: {
          status: 'sold',
          soldPrice: escrow.amount,
          soldDate: new Date()
        }
      })

      await this.createEscrowLog(
        escrowId,
        'escrow_released',
        isAutoRelease ? 'Escrow auto-released after deadline' : 'Escrow released',
        isAutoRelease ? null : userId
      )

      return { success: true }
    } catch (error) {
      console.error('Escrow release failed:', error)
      return { success: false, error: 'Lirimi i escrow dështoi' }
    }
  }

  /**
   * Open dispute for escrow transaction
   */
  static async openDispute(
    escrowId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId }
      })

      if (!escrow) {
        return { success: false, error: 'Escrow nuk u gjet' }
      }

      if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
        return { success: false, error: 'Nuk keni të drejtë të hapni mosmarrëveshje' }
      }

      if (escrow.status !== 'funded') {
        return { success: false, error: 'Escrow duhet të jetë i financuar për të hapur mosmarrëveshje' }
      }

      if (escrow.isDisputed) {
        return { success: false, error: 'Mosmarrëveshja është hapur tashmë' }
      }

      // Open dispute
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          isDisputed: true,
          disputeReason: reason,
          disputeOpenedAt: new Date()
        }
      })

      await this.createEscrowLog(
        escrowId,
        'dispute_opened',
        `Dispute opened: ${reason}`,
        userId
      )

      // Notify admin for mediation
      await this.notifyAdminDispute(escrowId, reason)

      return { success: true }
    } catch (error) {
      console.error('Dispute opening failed:', error)
      return { success: false, error: 'Hapja e mosmarrëveshjes dështoi' }
    }
  }

  /**
   * Resolve dispute (admin only)
   */
  static async resolveDispute(
    escrowId: string,
    adminId: string,
    resolution: 'release_to_seller' | 'refund_to_buyer' | 'partial_refund',
    resolutionNotes: string,
    refundAmount?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId }
      })

      if (!escrow) {
        return { success: false, error: 'Escrow nuk u gjet' }
      }

      if (!escrow.isDisputed) {
        return { success: false, error: 'Nuk ka mosmarrëveshje për të zgjidhur' }
      }

      let success = false
      let transferId: string | undefined

      switch (resolution) {
        case 'release_to_seller':
          const sellerTransfer = await this.transferFundsToSeller(escrow)
          success = sellerTransfer.success
          transferId = sellerTransfer.transferId
          break

        case 'refund_to_buyer':
          const buyerRefund = await this.refundToBuyer(escrow)
          success = buyerRefund.success
          transferId = buyerRefund.refundId
          break

        case 'partial_refund':
          if (!refundAmount) {
            return { success: false, error: 'Shuma e kthimit nuk është specifikuar' }
          }
          const partialResult = await this.processPartialRefund(escrow, refundAmount)
          success = partialResult.success
          transferId = partialResult.transferId
          break
      }

      if (!success) {
        return { success: false, error: 'Zgjidhja e mosmarrëveshjes dështoi' }
      }

      // Update escrow
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          disputeResolution: resolution,
          disputeResolvedAt: new Date(),
          arbitratorId: adminId,
          status: 'completed',
          completedAt: new Date(),
          stripeTransferId: transferId
        }
      })

      await this.createEscrowLog(
        escrowId,
        'dispute_resolved',
        `Dispute resolved: ${resolution} - ${resolutionNotes}`,
        adminId
      )

      return { success: true }
    } catch (error) {
      console.error('Dispute resolution failed:', error)
      return { success: false, error: 'Zgjidhja e mosmarrëveshjes dështoi' }
    }
  }

  /**
   * Transfer funds to seller
   */
  private static async transferFundsToSeller(escrow: any): Promise<{
    success: boolean
    transferId?: string
    error?: string
  }> {
    try {
      // In production, get seller's Stripe account or bank details
      // For demo, we'll simulate the transfer

      const netAmount = escrow.amount // Escrow fee is kept by platform

      // Create Stripe transfer (placeholder)
      const transfer = await stripe.transfers.create({
        amount: netAmount,
        currency: escrow.currency.toLowerCase(),
        destination: 'acct_seller_stripe_account', // Seller's connected account
        description: `Vehicle sale payment for listing ${escrow.listingId}`
      })

      return { success: true, transferId: transfer.id }
    } catch (error) {
      console.error('Transfer to seller failed:', error)
      return { success: false, error: 'Transferimi tek shitësi dështoi' }
    }
  }

  /**
   * Refund to buyer
   */
  private static async refundToBuyer(escrow: any): Promise<{
    success: boolean
    refundId?: string
    error?: string
  }> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: escrow.stripePaymentIntentId,
        amount: escrow.amount + escrow.escrowFee, // Full refund including fee
        reason: 'requested_by_customer'
      })

      return { success: true, refundId: refund.id }
    } catch (error) {
      console.error('Refund to buyer failed:', error)
      return { success: false, error: 'Kthimi tek blerësi dështoi' }
    }
  }

  /**
   * Process partial refund
   */
  private static async processPartialRefund(escrow: any, refundAmount: number): Promise<{
    success: boolean
    transferId?: string
    error?: string
  }> {
    try {
      // Refund partial amount to buyer
      await stripe.refunds.create({
        payment_intent: escrow.stripePaymentIntentId,
        amount: refundAmount
      })

      // Transfer remaining amount to seller
      const sellerAmount = escrow.amount - refundAmount
      const transfer = await stripe.transfers.create({
        amount: sellerAmount,
        currency: escrow.currency.toLowerCase(),
        destination: 'acct_seller_stripe_account',
        description: `Partial payment for listing ${escrow.listingId}`
      })

      return { success: true, transferId: transfer.id }
    } catch (error) {
      console.error('Partial refund failed:', error)
      return { success: false, error: 'Kthimi i pjesshëm dështoi' }
    }
  }

  /**
   * Create escrow log entry
   */
  private static async createEscrowLog(
    escrowId: string,
    action: string,
    description: string,
    performedById: string | null,
    metadata?: any
  ): Promise<void> {
    await prisma.escrowLog.create({
      data: {
        escrowId,
        action,
        description,
        performedById,
        metadata
      }
    })
  }

  /**
   * Auto-release escrow after deadline
   */
  static async processAutoReleases(): Promise<void> {
    const now = new Date()

    const expiredEscrows = await prisma.escrowTransaction.findMany({
      where: {
        status: 'funded',
        isDisputed: false,
        releaseDeadline: { lt: now }
      }
    })

    for (const escrow of expiredEscrows) {
      await this.releaseEscrow(escrow.id, '', undefined, true)
    }
  }

  /**
   * Get escrow status
   */
  static async getEscrowStatus(escrowId: string): Promise<any> {
    return await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          select: { title: true, price: true }
        },
        buyer: {
          select: { name: true, email: true }
        },
        seller: {
          select: { name: true, email: true }
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  /**
   * Notification helpers (placeholder)
   */
  private static async notifyEscrowFunded(sellerId: string, escrowId: string): Promise<void> {
    console.log(`Notifying seller ${sellerId} that escrow ${escrowId} is funded`)
  }

  private static async notifyAdminDispute(escrowId: string, reason: string): Promise<void> {
    console.log(`Admin notification: Dispute opened for escrow ${escrowId} - ${reason}`)
  }
}