'use client';

// Supported media formats
export const MEDIA_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  videos: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
};

export const MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
};

// Detect if file is image or video
export function getMediaType(file) {
  if (!file || !file.type) return null;
  
  const mimeType = file.type.toLowerCase();
  
  if (MIME_TYPES.images.includes(mimeType)) {
    return 'image';
  }
  if (MIME_TYPES.videos.includes(mimeType)) {
    return 'video';
  }
  
  // Fallback: check file extension
  const ext = file.name?.split('.').pop()?.toLowerCase();
  if (MEDIA_TYPES.images.includes(ext)) return 'image';
  if (MEDIA_TYPES.videos.includes(ext)) return 'video';
  
  return null;
}

// Validate file before upload
export function validateMediaFile(file) {
  if (!file) throw new Error('No file provided');
  
  const mediaType = getMediaType(file);
  if (!mediaType) {
    throw new Error('Unsupported file format. Supported: ' + 
      [...MEDIA_TYPES.images, ...MEDIA_TYPES.videos].join(', '));
  }
  
  // Max file size: 500 MB for production testing
  const MAX_BYTES = 500 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large. Max size: 500 MB`);
  }
  
  return mediaType;
}

// For images: compress to base64 for frontend preview/storage
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });
}

function dataUrlByteSize(dataUrl) {
  const commaIdx = dataUrl.indexOf(',');
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

const MAX_DIMENSION = 1600;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB after Base64 decoding

export async function fileToCompressedBase64(file) {
  if (!file) throw new Error('No file provided');
  
  const mediaType = validateMediaFile(file);
  
  // Videos: return as-is (no compression on client)
  if (mediaType === 'video') {
    return null; // Videos uploaded directly, not as base64
  }
  
  // Images: compress
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Only image files are supported for compression');
  }

  const originalDataUrl = await readAsDataURL(file);
  const img = await loadImage(originalDataUrl);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.85;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (dataUrlByteSize(result) > MAX_BYTES && quality > 0.3) {
    quality -= 0.1;
    result = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrlByteSize(result) > MAX_BYTES) {
    const c2 = document.createElement('canvas');
    c2.width = Math.round(width * 0.75);
    c2.height = Math.round(height * 0.75);
    const ctx2 = c2.getContext('2d');
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, c2.width, c2.height);
    ctx2.drawImage(img, 0, 0, c2.width, c2.height);
    result = c2.toDataURL('image/jpeg', 0.6);
  }

  return result;
}

// Process multiple files
export async function filesToCompressedBase64(files) {
  const arr = Array.from(files || []);
  const results = [];
  for (const f of arr) {
    try {
      const result = await fileToCompressedBase64(f);
      if (result) results.push(result); // Only images return base64
    } catch (e) {
      console.warn('Skipping file', f?.name, e);
    }
  }
  return results;
}
