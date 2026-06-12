import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs'; // ensure Node runtime (Buffer + cloudinary)

// Configurable limits (in bytes): 500 MB for production testing
const MAX_FILE_SIZE = process.env.MAX_UPLOAD_SIZE || (500 * 1024 * 1024);

// Supported MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(req) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  let formData;
  try {
    formData = await req.formData();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const files = formData.getAll('files');
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'nalgonda_estates';

  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        if (!file || typeof file === 'string') return null;

        // Validate MIME type
        if (!ALLOWED_TYPES.includes(file.type)) {
          console.warn(`Skipping file ${file.name}: unsupported MIME type ${file.type}`);
          return null;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping file ${file.name}: exceeds max size ${MAX_FILE_SIZE}`);
          return null;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine media type
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

        return await new Promise((resolve, reject) => {
          const uploadOptions = {
            folder,
            // For videos: use video resource_type
            resource_type: isVideo ? 'video' : 'image',
          };

          // Video-specific settings
          if (isVideo) {
            uploadOptions.eager = [
              { width: 300, height: 300, crop: 'fill', quality: 'auto' },
            ]; // Generate thumbnail
          } else {
            // Image-specific transformations
            uploadOptions.transformation = [
              { width: 1600, height: 1600, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ];
          }

          const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (err, result) => {
              if (err) return reject(err);
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                mediaType: isVideo ? 'video' : 'image',
                mimeType: file.type,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                duration: result.duration, // video duration in seconds
              });
            }
          );
          stream.end(buffer);
        });
      })
    );

    return NextResponse.json({ images: uploaded.filter(Boolean) });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed', detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
