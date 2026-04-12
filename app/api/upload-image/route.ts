import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getServerSession } from '@/lib/auth'
import { Readable } from 'stream'

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

const ALLOWED_CLOUDINARY_FOLDERS = ['events', 'news', 'gallery'] as const
type CloudinaryFolder = (typeof ALLOWED_CLOUDINARY_FOLDERS)[number]

function parseFolder(formData: FormData): CloudinaryFolder {
  const raw = formData.get('folder')
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (s && (ALLOWED_CLOUDINARY_FOLDERS as readonly string[]).includes(s)) {
    return s as CloudinaryFolder
  }
  return 'events'
}

/**
 * Convert buffer to stream for Cloudinary upload
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please set CLOUDINARY_URL environment variable.' },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const cloudinaryFolder = parseFolder(formData)
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Convert buffer to stream
    const stream = bufferToStream(buffer)

    // Upload to Cloudinary with AVIF conversion
    return new Promise<NextResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: cloudinaryFolder,
          format: 'avif', // Convert to AVIF format for optimized storage
          quality: 'auto', // Automatic quality optimization
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            resolve(
              NextResponse.json(
                { error: 'Failed to upload image to Cloudinary' },
                { status: 500 }
              )
            )
            return
          }

          if (!result || !result.secure_url) {
            resolve(
              NextResponse.json(
                { error: 'Upload succeeded but no URL was returned' },
                { status: 500 }
              )
            )
            return
          }

          resolve(
            NextResponse.json({
              secure_url: result.secure_url,
              public_id: result.public_id,
            })
          )
        }
      )

      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error processing image upload:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during image upload' },
      { status: 500 }
    )
  }
}
