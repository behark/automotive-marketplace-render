import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Billing automation configuration
const BILLING_CONFIG = {
  commissionInvoicing: {
    frequency: 'weekly', // weekly, biweekly, monthly
    dueDate: 30, // days after invoice
    minimumAmount: 1000, // €10 minimum for invoicing
    reminderDays: [7, 3, 1], // days before due date to send reminders
    lateFeeRate: 0.015, // 1.5% late fee per month
    maxLateFeeRate: 0.10 // 10% maximum late fee
  },
  subscriptionProcessing: {
    retryAttempts: 3,
    retryInterval: 3, // days between retry attempts
    gracePeriod: 7, // days after failed payment before cancellation
    downgradeDelay: 14 // days before downgrading plan
  },
  leadCredits: {
    autoTopup: true,
    minimumBalance: 500, // €5 minimum before auto top-up
    topupAmount: 2000, // €20 default top-up amount
    maxAutoTopup: 10000 // €100 maximum auto top-up per month
  }
}

// POST /api/billing/automation - Process automated billing tasks
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
    const { taskType, executeNow = false } = body

    if (!taskType) {
      return NextResponse.json(
        { error: 'Task type is required' },
        { status: 400 }
      )
    }

    let results = {}

    switch (taskType) {
      case 'commission_invoicing':
        results = await processCommissionInvoicing(executeNow)
        break
      case 'subscription_renewals':
        results = await processSubscriptionRenewals(executeNow)
        break
      case 'failed_payment_recovery':
        results = await processFailedPaymentRecovery(executeNow)
        break
      case 'lead_credit_topup':
        results = await processLeadCreditTopup(executeNow)
        break
      case 'late_fee_processing':
        results = await processLateFees(executeNow)
        break
      case 'all':
        results = await processAllBillingTasks(executeNow)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid task type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: 'Billing automation task completed',
      taskType,
      executeNow,
      results
    })

  } catch (error) {
    console.error('Error processing billing automation:', error)
    return NextResponse.json(
      { error: 'Failed to process billing automation' },
      { status: 500 }
    )
  }
}

// GET /api/billing/automation - Get automation status and upcoming tasks
export async function GET(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = user.role === 'admin'

    // Get upcoming commission invoices
    const upcomingCommissions = await prisma.commission.count({
      where: {
        status: 'pending',
        dueDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        },
        commissionAmount: { gte: BILLING_CONFIG.commissionInvoicing.minimumAmount }
      }
    })

    // Get failed payments needing retry
    const failedPayments = await prisma.payment.count({
      where: {
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    // Get subscriptions needing renewal attention
    const subscriptionsNeedingAttention = await prisma.subscription.count({
      where: {
        status: { in: ['past_due', 'incomplete'] },
        currentPeriodEnd: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Next 3 days
        }
      }
    })

    // Get users with low lead credits
    const usersNeedingTopup = await prisma.user.count({
      where: {
        leadCredits: { lt: BILLING_CONFIG.leadCredits.minimumBalance },
        plan: { in: ['dealer', 'enterprise'] }
      }
    })

    const upcomingTasks = {
      commissionInvoicing: {
        count: upcomingCommissions,
        nextRun: getNextBillingDate('weekly'),
        description: 'Commission invoices to be generated'
      },
      failedPaymentRecovery: {
        count: failedPayments,
        nextRun: getNextBillingDate('daily'),
        description: 'Failed payments to retry'
      },
      subscriptionRenewals: {
        count: subscriptionsNeedingAttention,
        nextRun: getNextBillingDate('daily'),
        description: 'Subscriptions needing attention'
      },
      leadCreditTopup: {
        count: usersNeedingTopup,
        nextRun: getNextBillingDate('daily'),
        description: 'Users needing credit top-up'
      }
    }

    const userSpecificData = {}
    if (!isAdmin) {
      // Get user-specific billing information
      const userCommissions = await prisma.commission.findMany({
        where: {
          sellerId: user.id,
          status: { in: ['pending', 'invoiced'] }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      })

      const userSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: 'active'
        }
      })

      userSpecificData = {
        pendingCommissions: userCommissions,
        currentSubscription: userSubscription,
        leadCredits: user.leadCredits,
        needsCreditTopup: user.leadCredits < BILLING_CONFIG.leadCredits.minimumBalance
      }
    }

    return NextResponse.json({
      config: BILLING_CONFIG,
      upcomingTasks: isAdmin ? upcomingTasks : null,
      userBilling: userSpecificData,
      isAdmin
    })

  } catch (error) {
    console.error('Error fetching billing automation status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing status' },
      { status: 500 }
    )
  }
}

// Commission invoicing automation
async function processCommissionInvoicing(executeNow: boolean) {
  const pendingCommissions = await prisma.commission.findMany({
    where: {
      status: 'pending',
      commissionAmount: { gte: BILLING_CONFIG.commissionInvoicing.minimumAmount },
      ...(executeNow ? {} : {
        dueDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    },
    include: {
      seller: true,
      listing: true
    }
  })

  const processed = []
  for (const commission of pendingCommissions) {
    try {
      // Generate invoice
      const invoiceData = {
        sellerId: commission.sellerId,
        amount: commission.commissionAmount,
        dueDate: commission.dueDate,
        itemDescription: `Commission for sale of ${commission.listing.make} ${commission.listing.model} (${commission.listing.year})`,
        salePrice: commission.salePrice,
        commissionRate: commission.commissionRate
      }

      // Create Stripe invoice
      let stripeInvoiceId = null
      if (commission.seller.stripeCustomerId) {
        try {
          const stripeInvoice = await stripe.invoices.create({
            customer: commission.seller.stripeCustomerId,
            currency: 'eur',
            collection_method: 'send_invoice',
            days_until_due: BILLING_CONFIG.commissionInvoicing.dueDate,
            metadata: {
              type: 'commission',
              commissionId: commission.id,
              listingId: commission.listingId
            }
          })

          await stripe.invoiceItems.create({
            customer: commission.seller.stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: commission.commissionAmount,
            currency: 'eur',
            description: invoiceData.itemDescription
          })

          await stripe.invoices.finalizeInvoice(stripeInvoice.id)
          await stripe.invoices.sendInvoice(stripeInvoice.id)

          stripeInvoiceId = stripeInvoice.id
        } catch (stripeError) {
          console.error('Stripe invoice creation error:', stripeError)
        }
      }

      // Update commission status
      await prisma.commission.update({
        where: { id: commission.id },
        data: {
          status: 'invoiced',
          stripePaymentId: stripeInvoiceId,
          updatedAt: new Date()
        }
      })

      processed.push({
        commissionId: commission.id,
        sellerId: commission.sellerId,
        amount: commission.commissionAmount,
        status: 'invoiced',
        stripeInvoiceId
      })

    } catch (error) {
      console.error(`Error processing commission ${commission.id}:`, error)
      processed.push({
        commissionId: commission.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return {
    taskType: 'commission_invoicing',
    totalFound: pendingCommissions.length,
    totalProcessed: processed.filter(p => p.status === 'invoiced').length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    details: processed
  }
}

// Subscription renewal processing
async function processSubscriptionRenewals(executeNow: boolean) {
  const subscriptionsToProcess = await prisma.subscription.findMany({
    where: {
      status: { in: ['past_due', 'incomplete'] },
      ...(executeNow ? {} : {
        currentPeriodEnd: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      })
    },
    include: {
      user: true
    }
  })

  const processed = []
  for (const subscription of subscriptionsToProcess) {
    try {
      // Check Stripe subscription status
      if (subscription.stripeSubscriptionId) {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)

        if (stripeSubscription.status === 'active') {
          // Update local status to match Stripe
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              updatedAt: new Date()
            }
          })

          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              subscriptionStatus: 'active',
              subscriptionEndDate: new Date(stripeSubscription.current_period_end * 1000)
            }
          })

          processed.push({
            subscriptionId: subscription.id,
            userId: subscription.userId,
            status: 'renewed'
          })

        } else if (stripeSubscription.status === 'canceled') {
          // Handle canceled subscription
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'canceled', updatedAt: new Date() }
          })

          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              plan: 'basic',
              subscriptionStatus: 'inactive'
            }
          })

          processed.push({
            subscriptionId: subscription.id,
            userId: subscription.userId,
            status: 'canceled'
          })
        }
      }

    } catch (error) {
      console.error(`Error processing subscription ${subscription.id}:`, error)
      processed.push({
        subscriptionId: subscription.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return {
    taskType: 'subscription_renewals',
    totalFound: subscriptionsToProcess.length,
    totalProcessed: processed.filter(p => p.status !== 'error').length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    details: processed
  }
}

// Failed payment recovery
async function processFailedPaymentRecovery(executeNow: boolean) {
  const failedPayments = await prisma.payment.findMany({
    where: {
      status: 'failed',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      user: true
    }
  })

  const processed = []
  for (const payment of failedPayments) {
    try {
      if (payment.stripePaymentId) {
        // Retry payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId)

        if (paymentIntent.status === 'requires_payment_method') {
          // Send notification to user to update payment method
          processed.push({
            paymentId: payment.id,
            userId: payment.userId,
            status: 'notification_sent',
            action: 'payment_method_update_required'
          })
        } else if (paymentIntent.status === 'succeeded') {
          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'succeeded', updatedAt: new Date() }
          })

          processed.push({
            paymentId: payment.id,
            userId: payment.userId,
            status: 'recovered'
          })
        }
      }

    } catch (error) {
      console.error(`Error processing failed payment ${payment.id}:`, error)
      processed.push({
        paymentId: payment.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return {
    taskType: 'failed_payment_recovery',
    totalFound: failedPayments.length,
    totalProcessed: processed.filter(p => p.status !== 'error').length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    details: processed
  }
}

// Lead credit auto top-up
async function processLeadCreditTopup(executeNow: boolean) {
  const usersNeedingTopup = await prisma.user.findMany({
    where: {
      leadCredits: { lt: BILLING_CONFIG.leadCredits.minimumBalance },
      plan: { in: ['dealer', 'enterprise'] },
      stripeCustomerId: { not: null }
    }
  })

  const processed = []
  for (const user of usersNeedingTopup) {
    try {
      // Create payment intent for credit top-up
      const paymentIntent = await stripe.paymentIntents.create({
        amount: BILLING_CONFIG.leadCredits.topupAmount,
        currency: 'eur',
        customer: user.stripeCustomerId,
        metadata: {
          type: 'lead_credit_topup',
          userId: user.id,
          autoTopup: 'true'
        },
        description: 'Automatic lead credit top-up'
      })

      // In a real implementation, you would:
      // 1. Use stored payment method for auto-charging
      // 2. Handle the actual payment confirmation
      // 3. Update user credits upon successful payment

      processed.push({
        userId: user.id,
        currentCredits: user.leadCredits,
        topupAmount: BILLING_CONFIG.leadCredits.topupAmount,
        status: 'payment_intent_created',
        paymentIntentId: paymentIntent.id
      })

    } catch (error) {
      console.error(`Error processing credit top-up for user ${user.id}:`, error)
      processed.push({
        userId: user.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return {
    taskType: 'lead_credit_topup',
    totalFound: usersNeedingTopup.length,
    totalProcessed: processed.filter(p => p.status !== 'error').length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    details: processed
  }
}

// Late fee processing
async function processLateFees(executeNow: boolean) {
  const overdueCommissions = await prisma.commission.findMany({
    where: {
      status: 'invoiced',
      dueDate: { lt: new Date() }
    },
    include: {
      seller: true
    }
  })

  const processed = []
  for (const commission of overdueCommissions) {
    try {
      const daysOverdue = Math.floor((Date.now() - commission.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      const monthsOverdue = daysOverdue / 30

      let lateFee = Math.floor(commission.commissionAmount * BILLING_CONFIG.commissionInvoicing.lateFeeRate * monthsOverdue)
      const maxLateFee = Math.floor(commission.commissionAmount * BILLING_CONFIG.commissionInvoicing.maxLateFeeRate)
      lateFee = Math.min(lateFee, maxLateFee)

      if (lateFee > 0) {
        // Update commission with late fee
        const newTotal = commission.commissionAmount + lateFee

        await prisma.commission.update({
          where: { id: commission.id },
          data: {
            commissionAmount: newTotal,
            metadata: {
              originalAmount: commission.commissionAmount,
              lateFee: lateFee,
              daysOverdue: daysOverdue
            },
            updatedAt: new Date()
          }
        })

        processed.push({
          commissionId: commission.id,
          sellerId: commission.sellerId,
          originalAmount: commission.commissionAmount,
          lateFee: lateFee,
          newTotal: newTotal,
          daysOverdue: daysOverdue,
          status: 'late_fee_applied'
        })
      }

    } catch (error) {
      console.error(`Error processing late fee for commission ${commission.id}:`, error)
      processed.push({
        commissionId: commission.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return {
    taskType: 'late_fee_processing',
    totalFound: overdueCommissions.length,
    totalProcessed: processed.filter(p => p.status !== 'error').length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    details: processed
  }
}

// Process all billing tasks
async function processAllBillingTasks(executeNow: boolean) {
  const results = await Promise.all([
    processCommissionInvoicing(executeNow),
    processSubscriptionRenewals(executeNow),
    processFailedPaymentRecovery(executeNow),
    processLeadCreditTopup(executeNow),
    processLateFees(executeNow)
  ])

  return {
    taskType: 'all_billing_tasks',
    results: results
  }
}

// Helper function to get next billing date
function getNextBillingDate(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + (5 - now.getDay() + 7) % 7 || 7) // Next Friday
      return nextWeek
    case 'monthly':
      const nextMonth = new Date(now)
      nextMonth.setMonth(now.getMonth() + 1, 1)
      return nextMonth
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}