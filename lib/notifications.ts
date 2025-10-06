// Helper function to trigger notifications (use this in other API routes)
export async function sendNotification(type: string, userId: string, data: any = {}) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
      },
      body: JSON.stringify({
        type,
        userId,
        data
      })
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}