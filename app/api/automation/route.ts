import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { automationMaster, AutomationType } from '@/lib/automation'

// GET /api/automation - Get automation system status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Only allow admin users to access automation status
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'status':
        const status = await automationMaster.getSystemStatus()
        return NextResponse.json({
          success: true,
          data: status
        })

      case 'analytics':
        const analytics = await automationMaster.getAnalyticsDashboard()
        return NextResponse.json({
          success: true,
          data: analytics
        })

      case 'health':
        const health = await automationMaster.healthCheck()
        return NextResponse.json({
          success: true,
          data: health
        })

      default:
        const defaultStatus = await automationMaster.getSystemStatus()
        return NextResponse.json({
          success: true,
          data: defaultStatus
        })
    }

  } catch (error) {
    console.error('Automation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get automation status',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// POST /api/automation - Trigger automation or manage system
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Only allow admin users to manage automation
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, type, data, options } = body

    switch (action) {
      case 'trigger':
        if (!type) {
          return NextResponse.json(
            { error: 'Automation type is required' },
            { status: 400 }
          )
        }

        const result = await automationMaster.triggerAutomation(type as AutomationType, options)
        return NextResponse.json({
          success: true,
          data: result
        })

      case 'queue_job':
        if (!type || !data) {
          return NextResponse.json(
            { error: 'Job type and data are required' },
            { status: 400 }
          )
        }

        const jobId = await automationMaster.queuePriorityJob(type, data, data.userId)
        return NextResponse.json({
          success: true,
          data: { jobId }
        })

      case 'send_notification':
        const { userId, notificationType, template, notificationData } = data

        if (!userId || !notificationType || !template) {
          return NextResponse.json(
            { error: 'userId, notificationType, and template are required' },
            { status: 400 }
          )
        }

        const sent = await automationMaster.sendImmediateNotification(
          userId,
          notificationType,
          template,
          notificationData
        )

        return NextResponse.json({
          success: true,
          data: { sent }
        })

      case 'initialize':
        await automationMaster.initialize()
        return NextResponse.json({
          success: true,
          message: 'Automation system initialized'
        })

      case 'shutdown':
        await automationMaster.shutdown()
        return NextResponse.json({
          success: true,
          message: 'Automation system shutdown'
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Automation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute automation action',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT /api/automation - Update automation settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Only allow admin users to update automation settings
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskName, enabled, schedule } = body

    if (!taskName || enabled === undefined) {
      return NextResponse.json(
        { error: 'taskName and enabled status are required' },
        { status: 400 }
      )
    }

    // This would update task settings in the scheduler
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: `Task ${taskName} ${enabled ? 'enabled' : 'disabled'}`
    })

  } catch (error) {
    console.error('Automation settings update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update automation settings',
        details: error.message
      },
      { status: 500 }
    )
  }
}