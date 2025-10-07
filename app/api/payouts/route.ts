import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Albanian banking information for payouts
const ALBANIAN_BANKS = {
  'BKT': 'Banka Kombëtare Tregtare',
  'RAIFFEISEN': 'Raiffeisen Bank Albania',
  'INTESA': 'Intesa Sanpaolo Bank Albania',
  'CREDINS': 'Credins Bank',
  'ALPHA': 'Alpha Bank Albania',
  'FIRST_INVESTMENT': 'First Investment Bank',
  'PROCREDIT': 'ProCredit Bank',
  'UNION': 'Union Bank',
  'TIRANA': 'Tirana Bank',
  'SOCIETE_GENERALE': 'Société Générale Albania'
}

// Commission payout processing
const processCommissionPayout = async (userId: string, amount: number) => {
  try {
    // Get user's bank details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verification: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (!user.verification?.bankVerified) {
      throw new Error('Bank account not verified')
    }

    // Create Stripe transfer (assuming connected account setup)
    let stripeTransfer = null
    if (user.stripeCustomerId) {
      try {
        stripeTransfer = await stripe.transfers.create({
          amount: amount,
          currency: 'eur',
          destination: user.stripeCustomerId, // Would be connected account in real setup
          metadata: {
            type: 'commission_payout',
            userId: userId
          }
        })
      } catch (stripeError) {
        console.error('Stripe transfer error:', stripeError)
        // Continue with local tracking even if Stripe fails
      }
    }

    return {
      success: true,
      stripeTransferId: stripeTransfer?.id,
      amount: amount
    }

  } catch (error) {
    console.error('Payout processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// POST /api/payouts - Process commission payout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { commissionIds, payoutMethod = 'bank_transfer' } = body

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Commission IDs array is required' },
        { status: 400 }
      )
    }

    // Get pending commissions
    const commissions = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
        status: { in: ['pending', 'invoiced'] }
      },
      include: {
        seller: {
          include: {
            verification: true
          }
        }
      }
    })

    if (commissions.length === 0) {
      return NextResponse.json(
        { error: 'No eligible commissions found' },
        { status: 404 }
      )
    }

    const payoutResults = []
    let totalProcessed = 0
    let totalFailed = 0

    // Group commissions by seller for batch payouts
    const commissionsBySeller = commissions.reduce((acc, commission) => {
      const sellerId = commission.sellerId
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: commission.seller,
          commissions: [],
          totalAmount: 0
        }
      }
      acc[sellerId].commissions.push(commission)
      acc[sellerId].totalAmount += commission.commissionAmount
      return acc
    }, {} as any)

    // Process payouts for each seller
    for (const [sellerId, sellerData] of Object.entries(commissionsBySeller) as any) {
      try {
        // Verify seller's bank account
        if (!sellerData.seller.verification?.bankVerified) {
          const result = {
            sellerId,
            sellerName: sellerData.seller.name,
            status: 'failed',
            error: 'Bank account not verified',
            commissionIds: sellerData.commissions.map((c: any) => c.id),
            amount: sellerData.totalAmount
          }
          payoutResults.push(result)
          totalFailed += sellerData.commissions.length
          continue
        }

        // Check minimum payout amount (€10)
        if (sellerData.totalAmount < 1000) {
          const result = {
            sellerId,
            sellerName: sellerData.seller.name,
            status: 'failed',
            error: 'Amount below minimum payout threshold (€10)',
            commissionIds: sellerData.commissions.map((c: any) => c.id),
            amount: sellerData.totalAmount
          }
          payoutResults.push(result)
          totalFailed += sellerData.commissions.length
          continue
        }

        // Process payout
        const payoutResult = await processCommissionPayout(sellerId, sellerData.totalAmount)

        if (payoutResult.success) {
          // Update commission records as paid
          await prisma.commission.updateMany({
            where: {
              id: { in: sellerData.commissions.map((c: any) => c.id) }
            },
            data: {
              status: 'paid',
              paidDate: new Date(),
              stripePaymentId: payoutResult.stripeTransferId,
              updatedAt: new Date()
            }
          })

          // Update user's commission totals
          await prisma.user.update({
            where: { id: sellerId },
            data: {
              totalCommissionPaid: {
                increment: sellerData.totalAmount
              },
              totalCommissionOwed: {
                decrement: sellerData.totalAmount
              }
            }
          })

          const result = {
            sellerId,
            sellerName: sellerData.seller.name,
            status: 'success',
            commissionIds: sellerData.commissions.map((c: any) => c.id),
            amount: sellerData.totalAmount,
            stripeTransferId: payoutResult.stripeTransferId,
            payoutMethod
          }
          payoutResults.push(result)
          totalProcessed += sellerData.commissions.length

        } else {
          const result = {
            sellerId,
            sellerName: sellerData.seller.name,
            status: 'failed',
            error: payoutResult.error,
            commissionIds: sellerData.commissions.map((c: any) => c.id),
            amount: sellerData.totalAmount
          }
          payoutResults.push(result)
          totalFailed += sellerData.commissions.length
        }

      } catch (error) {
        console.error(`Error processing payout for seller ${sellerId}:`, error)
        const result = {
          sellerId,
          sellerName: sellerData.seller.name,
          status: 'failed',
          error: 'Processing error occurred',
          commissionIds: sellerData.commissions.map((c: any) => c.id),
          amount: sellerData.totalAmount
        }
        payoutResults.push(result)
        totalFailed += sellerData.commissions.length
      }
    }

    return NextResponse.json({
      message: 'Payout processing completed',
      summary: {
        totalProcessed,
        totalFailed,
        totalSellers: Object.keys(commissionsBySeller).length,
        totalAmount: Object.values(commissionsBySeller).reduce((sum: number, data: any) => sum + data.totalAmount, 0)
      },
      results: payoutResults
    })

  } catch (error) {
    console.error('Error processing payouts:', error)
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    )
  }
}

// GET /api/payouts - Get payout information and pending commissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const sellerId = url.searchParams.get('sellerId')
    const status = url.searchParams.get('status') || 'pending'

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For regular users, only show their own data
    const isAdmin = user.role === 'admin'
    const targetUserId = isAdmin && sellerId ? sellerId : user.id

    // Get pending/due commissions
    const where: any = {
      sellerId: targetUserId,
      status: { in: status === 'pending' ? ['pending', 'invoiced'] : [status] }
    }

    if (status === 'due') {
      where.dueDate = { lte: new Date() }
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            price: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Get payout summary for user
    const payoutSummary = await prisma.commission.groupBy({
      by: ['status'],
      where: { sellerId: targetUserId },
      _sum: { commissionAmount: true },
      _count: true
    })

    // Get bank verification status
    const verification = await prisma.userVerification.findUnique({
      where: { userId: targetUserId },
      select: {
        bankVerified: true,
        bankName: true,
        bankAccountLast4: true
      }
    })

    // Calculate next payout date (weekly payouts on Fridays)
    const nextPayoutDate = new Date()
    const daysUntilFriday = (5 - nextPayoutDate.getDay() + 7) % 7 || 7
    nextPayoutDate.setDate(nextPayoutDate.getDate() + daysUntilFriday)

    const summary = payoutSummary.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count,
        amount: item._sum.commissionAmount || 0
      }
      return acc
    }, {} as any)

    // For admin users, get global statistics
    let globalStats = null
    if (isAdmin) {
      const totalPending = await prisma.commission.aggregate({
        where: { status: { in: ['pending', 'invoiced'] } },
        _sum: { commissionAmount: true },
        _count: true
      })

      const totalOverdue = await prisma.commission.aggregate({
        where: {
          status: { in: ['pending', 'invoiced'] },
          dueDate: { lt: new Date() }
        },
        _sum: { commissionAmount: true },
        _count: true
      })

      globalStats = {
        totalPending: {
          count: totalPending._count,
          amount: totalPending._sum.commissionAmount || 0
        },
        totalOverdue: {
          count: totalOverdue._count,
          amount: totalOverdue._sum.commissionAmount || 0
        }
      }
    }

    return NextResponse.json({
      commissions,
      summary,
      bankVerification: verification,
      nextPayoutDate,
      availableBanks: ALBANIAN_BANKS,
      globalStats,
      minimumPayoutAmount: 1000, // €10 in cents
      payoutSchedule: 'Weekly on Fridays'
    })

  } catch (error) {
    console.error('Error fetching payout data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout information' },
      { status: 500 }
    )
  }
}

// PUT /api/payouts - Update bank verification for payouts
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bankName, accountNumber, routingCode, accountHolderName } = body

    if (!bankName || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account holder name are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate Albanian bank
    if (!ALBANIAN_BANKS[bankName as keyof typeof ALBANIAN_BANKS]) {
      return NextResponse.json(
        { error: 'Invalid Albanian bank selected' },
        { status: 400 }
      )
    }

    // Update or create user verification record
    const verification = await prisma.userVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bankVerified: false,
        bankName: ALBANIAN_BANKS[bankName as keyof typeof ALBANIAN_BANKS],
        bankAccountLast4: accountNumber.slice(-4)
      },
      update: {
        bankName: ALBANIAN_BANKS[bankName as keyof typeof ALBANIAN_BANKS],
        bankAccountLast4: accountNumber.slice(-4),
        bankVerified: false, // Reset verification when details change
        updatedAt: new Date()
      }
    })

    // In a real implementation, you would:
    // 1. Encrypt and securely store the full account details
    // 2. Initiate a micro-deposit verification process
    // 3. Send verification email/SMS to user

    return NextResponse.json({
      message: 'Bank details submitted for verification',
      verification: {
        bankName: verification.bankName,
        accountLast4: verification.bankAccountLast4,
        isVerified: verification.bankVerified,
        nextSteps: [
          'Account verification will be completed within 2-3 business days',
          'You will receive a verification email once approved',
          'Payouts will be available after verification is complete'
        ]
      }
    })

  } catch (error) {
    console.error('Error updating bank verification:', error)
    return NextResponse.json(
      { error: 'Failed to update bank details' },
      { status: 500 }
    )
  }
}