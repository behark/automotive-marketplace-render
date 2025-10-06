import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export const dynamic = 'force-dynamic'

// POST /api/upload - Upload images
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const uploadedFiles: string[] = []

    // Process each file in the form data
    for (const [key, value] of formData.entries()) {
      // Check if the value is a file-like object
      if (value && typeof value === 'object' && 'name' in value && 'size' in value && 'arrayBuffer' in value) {
        const file = value as any // Type assertion for file-like object

        if (file.size === 0) continue

        // Validate file type
        if (!file.type || !file.type.startsWith('image/')) {
          return NextResponse.json(
            { error: `Invalid file type: ${file.type || 'unknown'}. Only images are allowed.` },
            { status: 400 }
          )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `File too large: ${file.name}. Maximum size is 5MB.` },
            { status: 400 }
          )
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const extension = file.name.split('.').pop() || 'jpg'
        const filename = `${timestamp}-${randomString}.${extension}`

        try {
          // Create uploads directory if it doesn't exist
          const uploadsDir = join(process.cwd(), 'public', 'uploads')
          if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true })
          }

          // Convert file to buffer and save
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const filepath = join(uploadsDir, filename)

          await writeFile(filepath, buffer)

          // Add to uploaded files list
          uploadedFiles.push(`/uploads/${filename}`)

          console.log(`Successfully uploaded: ${filename}`)

        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError)
          return NextResponse.json(
            { error: `Failed to save file: ${file.name}` },
            { status: 500 }
          )
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid image files found in the request' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      count: uploadedFiles.length
    })

  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}

// GET /api/upload - Get upload status/info
export async function GET() {
  return NextResponse.json({
    maxFileSize: '5MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 10,
    uploadsEnabled: true
  })
}