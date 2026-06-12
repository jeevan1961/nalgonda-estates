// app/property/[id]/page.js
import PropertyClient from './PropertyClient';
import { connectMongo } from '@/lib/mongodb';
import Property from '@/models/Property';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  // Default fallback values
  let title = "Nalgonda Estates — Premium Land, Plots & Homes";
  let desc = "Hyper-local real estate listings in and around Nalgonda.";
  let imageUrl = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200";
  let videoUrl = null;

  try {
    await connectMongo();
    const property = await Property.findOne({ id: id }).lean();

    if (property) {
      // 1. Safely extract Title
      let propTitle = 'Premium Property';
      if (typeof property.title === 'string' && property.title.trim() !== '') {
        propTitle = property.title;
      } else if (property.title && typeof property.title.en === 'string') {
        propTitle = property.title.en;
      }
      title = `${propTitle} | Nalgonda Estates`;
      
      // 2. Safely extract Description
      if (typeof property.description === 'string' && property.description.trim() !== '') {
        desc = property.description;
      } else if (property.description && typeof property.description.en === 'string' && property.description.en.trim() !== '') {
        desc = property.description.en;
      }
      
      // 3. Safely extract Media (Images/Videos)
      const mediaArray = (property.media && property.media.length > 0) ? property.media : property.images;

      if (mediaArray && Array.isArray(mediaArray) && mediaArray.length > 0) {
        const firstMedia = mediaArray[0];
        let extractedMediaUrl = '';
        let extractedThumbnail = '';
        let isVideo = false;
        
        // Handle both string arrays and object arrays from your database
        if (typeof firstMedia === 'string') {
          extractedMediaUrl = firstMedia;
        } else if (firstMedia && typeof firstMedia.url === 'string') {
          extractedMediaUrl = firstMedia.url;
          extractedThumbnail = firstMedia.thumbnailUrl || '';
          if (firstMedia.mediaType === 'video') isVideo = true;
        }

        // Check extension as a fallback
        const isVideoExt = /\.(mp4|webm|ogg)$/i.test(extractedMediaUrl.split('?')[0]);
        if (isVideoExt) isVideo = true;

        if (isVideo) {
          videoUrl = extractedMediaUrl;

          // Ensure og:image receives a valid image URL for the thumbnail, not the raw video
          if (extractedThumbnail && extractedThumbnail.startsWith('http')) {
            imageUrl = extractedThumbnail;
          } else if (extractedMediaUrl.includes('cloudinary.com') && extractedMediaUrl.includes('/video/upload/')) {
            // Convert Cloudinary video URL to jpg for the thumbnail
            imageUrl = extractedMediaUrl.replace(/\.(mp4|webm|ogg)$/i, '.jpg');
          }
          // If no thumbnail is available, imageUrl stays the default site image (safe fallback)
        } else {
          // It's an image
          if (extractedMediaUrl && extractedMediaUrl.startsWith('http')) {
            imageUrl = extractedMediaUrl;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching property for metadata:", error);
  }

  const metadata = {
    title: title,
    description: desc,
    openGraph: {
      title: title,
      description: desc,
      url: `https://nalgonda-estates.vercel.app/property/${id}`,
      siteName: 'Nalgonda Estates',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: videoUrl ? 'video.other' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: desc,
      images: [imageUrl],
    },
  };

  // Inject specific video tags if property media is a video
  if (videoUrl) {
    metadata.openGraph.videos = [
      {
        url: videoUrl,
      }
    ];
  }

  return metadata;
}

export default function Page({ params }) {
  return <PropertyClient params={params} />;
}
