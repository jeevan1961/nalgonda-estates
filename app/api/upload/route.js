import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req) {
  // Ensure only authenticated admins can request an upload signature
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'nalgonda_estates';

    // Generate a secure signature using your Cloudinary Secret
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    // Return the required credentials so the frontend can upload directly
    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (err) {
    console.error('Cloudinary signature error:', err);
    return NextResponse.json(
      { error: 'Failed to generate signature' }, 
      { status: 500 }
    );
  }
}
