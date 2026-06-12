'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Heart, Phone, MessageSquare, Share2, MapPin, 
  Home, Sprout, LandPlot, ChevronLeft, ChevronRight, Flame, 
  Maximize2, Ruler, IndianRupee, BedDouble, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLang } from '@/lib/LanguageContext';
import { usePropertyStore, useSaved } from '@/lib/usePropertyStore';
import { LOCATIONS, AGENT, formatINR } from '@/lib/properties';
import { toast } from 'sonner';

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 [...]
    </svg>
  );
}

// Glassmorphism update to FeatureCard
function FeatureCard({ icon, label, value }) {
  return (
    <div className="bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl p-4 flex flex-col justify-center transition-colors hover:bg-white/70 hover:border-emerald-200">
      <div className="flex items-center gap-2 text-slate-600 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold text-slate-900 truncate" title={value}>{value}</div>
    </div>
  );
}

// Media Renderer Component - Handles both images and videos
function MediaRenderer({ src, alt, isVideo, className = '', onClick = null }) {
  if (isVideo) {
    return (
      <video 
        src={src} 
        className={className}
        onClick={onClick}
        controls
        autoPlay={false}
        loop={false}
        muted={false}
        playsInline
      />
    );
  }
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onClick={onClick}
    />
  );
}

export default function PropertyDetailsPage({ params }) {
  const { id } = params;
  const { t, tField } = useLang();
  const { properties, loaded } = usePropertyStore();
  const { saved, toggle, isSaved } = useSaved();
  
  const [idx, setIdx] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const p = properties.find((x) => x.id === id);
  
  if (!p) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-black/20 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-md">Property Not Found</h2>
        <Link href="/"><Button className="rounded-xl shadow-md bg-white text-slate-900 hover:bg-slate-100">Return to Home</Button></Link>
      </div>
    );
  }

  const title = tField(p.title);
  const desc = tField(p.description);
  const localityLabel = p.type === 'agriculture' ? tField(p, 'village') : tField(p, 'colony');
  
  // Support both new media format and legacy images format
  let mediaItems = [];
  if (p.media && Array.isArray(p.media) && p.media.length > 0) {
    mediaItems = p.media.map(m => 
      typeof m === 'string' 
        ? { url: m, mediaType: 'image' } 
        : m
    );
  } else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    mediaItems = p.images.map(img => 
      typeof img === 'string'
        ? { url: img, mediaType: 'image' }
        : img
    );
  }
  
  if (mediaItems.length === 0) {
    mediaItems = [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', mediaType: 'image' }];
  }

  const isBookmarked = isSaved(p.id);
  const currentMedia = mediaItems[idx];
  const isCurrentVideo = currentMedia?.mediaType === 'video';
  const currentSrc = currentMedia?.url || mediaItems[0]?.url;

  const getShareText = () => {
    let areaText = '';
    if (p.type === 'agriculture') areaText = `${p.areaAcres || 0} acres`;
    else if (p.type === 'plot') areaText = `${p.areaSqYards || 0} sq.yd`;
    else if (p.type === 'house') areaText = `${p.plotArea || 0} sq.yd plot / ${p.builtUpArea || 0} sqft`;

    return `*${title}*\n📍 Place: ${localityLabel}, ${p.location}\n📐 Area: ${areaText}\n💰 Cost: ${formatINR(p.totalPrice)}`;
  };

  const propertyUrl = typeof window !== 'undefined' ? window.location.href : '';

  const onCall = () => { window.location.href = `tel:${AGENT.phone}`; };
  const onSMS = () => { window.location.href = `sms:${AGENT.phone}?body=${encodeURIComponent(getShareText() + '\n\n🔗 Link: ' + propertyUrl)}`; };
  const onWhats = () => { window.open(`https://wa.me/${AGENT.whatsapp}?text=${encodeURIComponent(getShareText() + '\n\n🔗 Link: ' + propertyUrl)}`, '_blank'); };

  const onShare = async () => {
    const shareText = getShareText();
    const fullText = `${shareText}\n\n🔗 Link: ${propertyUrl}`;

    if (typeof window !== 'undefined' && window.median && window.median.share) {
      window.median.share.sharePage({ url: propertyUrl, text: shareText });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: propertyUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Link copied to clipboard!');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  return (
    // Removed solid background (bg-slate-50) from root container
    <div className="min-h-screen sm:py-8 pb-28">
      
      {/* Main Container - Added glassmorphism classes */}
      <main className="max-w-4xl mx-auto bg-white/85 backdrop-blur-2xl sm:rounded-[2rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden relative">
        
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md border border-white/30 transition-all shadow-md">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => toggle(p.id)} className="bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md border border-white/30 transition-all shadow-md">
            <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Hero Media Section - Supports both images and videos */}
        <div className="relative w-full h-[40vh] sm:h-[55vh] bg-black/20 group cursor-pointer" onClick={() => setIsFullScreen(true)}>
          <MediaRenderer 
            src={currentSrc}
            alt={title}
            isVideo={isCurrentVideo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            {p.hotDeal && <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg text-sm px-3 py-1.5 rounded-lg"><Flame className="w-4 h-4 mr-1.5" />{t('featured')}</Badge>}
            {p.sold && <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg text-sm px-3 py-1.5 rounded-lg">{t('sold')}</Badge>}
          </div>

          <div className="absolute bottom-6 right-6 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
            <Maximize2 className="w-4 h-4" /> {t('viewDetails')} ({idx + 1}/{mediaItems.length})
          </div>

          {mediaItems.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + mediaItems.length) % mediaItems.length); }} className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2.5 rounded-full transition-all z-10 shadow-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % mediaItems.length); }} className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2.5 rounded-full transition-all z-10 shadow-lg">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300/50 pb-8 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-emerald-100/80 backdrop-blur-sm text-emerald-800 border-emerald-200 rounded-md px-2.5 py-1">
                  {p.type === 'agriculture' && <><Sprout className="w-3.5 h-3.5 mr-1" />{t('agriculture')}</>}
                  {p.type === 'plot' && <><LandPlot className="w-3.5 h-3.5 mr-1" />{t('plot')}</>}
                  {p.type === 'house' && <><Home className="w-3.5 h-3.5 mr-1" />{t('house')}</>}
                </Badge>
                <span className="text-slate-600 font-medium text-sm flex items-center"><MapPin className="w-4 h-4 mr-1 text-slate-500" /> {localityLabel}, {p.location}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight drop-shadow-sm">{title}</h1>
            </div>
            
            <div className="md:text-right bg-emerald-50/50 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-none border-emerald-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Asking Price</p>
              <div className="text-4xl font-extrabold text-emerald-700 tracking-tight drop-shadow-sm">{formatINR(p.totalPrice)}</div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">Property Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {p.type === 'agriculture' && (
              <>
                <FeatureCard icon={<Ruler className="w-4 h-4" />} label={t('totalArea')} value={`${p.areaAcres} ${t('acres')}`} />
                <FeatureCard icon={<IndianRupee className="w-4 h-4" />} label={t('costPerAcre')} value={formatINR(p.pricePerAcre)} />
              </>
            )}
            {p.type === 'plot' && (
              <>
                <FeatureCard icon={<Ruler className="w-4 h-4" />} label={t('totalArea')} value={`${p.areaSqYards} ${t('sqYards')}`} />
                <FeatureCard icon={<IndianRupee className="w-4 h-4" />} label={t('costPerSqYard')} value={formatINR(p.pricePerSqYard)} />
              </>
            )}
            {p.type === 'house' && (
              <>
                <FeatureCard icon={<BedDouble className="w-4 h-4" />} label={t('bedrooms')} value={`${p.bedrooms || '-'} ${t('bhk')}`} />
                <FeatureCard icon={<LandPlot className="w-4 h-4" />} label={t('plotArea')} value={`${p.plotArea} ${t('sqYards')}`} />
                <FeatureCard icon={<Home className="w-4 h-4" />} label={t('builtUpArea')} value={`${p.builtUpArea} ${t('sqft')}`} />
              </>
            )}
          </div>

          {desc && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
              {/* Glass description box */}
              <div className="prose prose-slate max-w-none text-slate-800 font-medium leading-relaxed bg-white/40 backdrop-blur-lg p-6 rounded-3xl border border-white/50 whitespace-pre-wrap shadow-sm">
                {desc}
              </div>
            </div>
          )}

          {/* Media Gallery - Show thumbnails of all media */}
          {mediaItems.length > 1 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t('mediaFile')} Gallery</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {mediaItems.map((item, i) => {
                  const itemIsVideo = item?.mediaType === 'video';
                  const itemSrc = item?.url;
                  return (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        i === idx 
                          ? 'border-emerald-600 shadow-lg' 
                          : 'border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {itemIsVideo ? (
                        <video 
                          src={itemSrc}
                          className="w-full h-16 object-cover bg-black"
                        />
                      ) : (
                        <img 
                          src={itemSrc}
                          alt={`thumbnail-${i}`}
                          className="w-full h-16 object-cover"
                        />
                      )}
                      {itemIsVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="text-white text-xl">▶</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar - Glassmorphism Update */}
        <div className="fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto bg-white/80 sm:bg-transparent backdrop-blur-xl border-t border-white/30 sm:border-t-0 p-4 sm:p-6 sm:px-10 z-40 sm:border-t sm:bg-white/50">
          <div className="flex gap-2 sm:gap-4 max-w-4xl mx-auto">
            <Button onClick={onCall} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-14 rounded-2xl shadow-[0_8px_16px_rgba(22,163,74,0.2)] transition-all hover:-translate-y-0.5 border-0">
              <Phone className="w-5 h-5 mr-2" />
              <span className="font-semibold text-base">{t('call')}</span>
            </Button>
            <Button onClick={onSMS} variant="outline" className="flex-1 border-blue-200/50 text-blue-800 hover:bg-blue-50/80 h-14 rounded-2xl transition-all hover:-translate-y-0.5 bg-white/60 backdrop-blur-md">
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="font-semibold text-base hidden sm:inline">{t('sms')}</span>
            </Button>
            <Button onClick={onWhats} variant="outline" className="flex-1 border-emerald-200/50 text-emerald-800 hover:bg-emerald-50/80 h-14 rounded-2xl transition-all hover:-translate-y-0.5 bg-white/60 backdrop-blur-md">
              <WhatsAppIcon className="w-5 h-5 sm:mr-2" />
              <span className="font-semibold text-base hidden sm:inline">{t('whatsapp')}</span>
            </Button>
            <Button onClick={onShare} variant="outline" className="flex-1 border-purple-200/50 text-purple-800 hover:bg-purple-50/80 h-14 rounded-2xl transition-all hover:-translate-y-0.5 bg-white/60 backdrop-blur-md">
              <Share2 className="w-5 h-5 sm:mr-2" />
              <span className="font-semibold text-base hidden sm:inline">{t('share')}</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Full Screen Media Viewer Modal - Supports images and videos */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-lg" onClick={() => setIsFullScreen(false)}>
          <button onClick={() => setIsFullScreen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-50">
            <X className="w-6 h-6" />
          </button>
          
          <MediaRenderer 
            src={currentSrc}
            alt="Fullscreen"
            isVideo={isCurrentVideo}
            className="w-full h-full object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          
          {mediaItems.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + mediaItems.length) % mediaItems.length); }} className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-20">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % mediaItems.length); }} className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-20">
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-black/50 px-5 py-3 rounded-full border border-white/10 backdrop-blur-md">
                {mediaItems.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }} className={`h-2.5 rounded-full transition-all ${i === idx ? 'bg-white w-8' : 'bg-white/40 w-2.5 hover:bg-white/60'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
