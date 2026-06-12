'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Carousel({ media, alt }) {
  const [idx, setIdx] = useState(0);
  
  // Support both new media format and legacy images format
  let items = [];
  if (Array.isArray(media)) {
    items = media.map(m => 
      typeof m === 'string' ? { url: m, mediaType: 'image' } : m
    );
  }
  
  if (items.length === 0) {
    items = [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', mediaType: 'image' }];
  }
  
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx + 1) % items.length); };
  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx - 1 + items.length) % items.length); };
  
  const current = items[idx];
  const isVideo = current?.mediaType === 'video';
  
  return (
    <div className="relative w-full h-40 sm:h-48 bg-slate-200 overflow-hidden group">
      {isVideo ? (
        <video 
          src={current.url} 
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          controls
        />
      ) : (
        <img src={current.url} alt={alt} className="w-full h-full object-cover transition-opacity duration-300" loading="lazy" />
      )}
      {items.length > 1 && (
        <>
          <button aria-label="prev" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ChevronLeft className="w-4 h-4 text-slate-900" />
          </button>
          <button aria-label="next" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ChevronRight className="w-4 h-4 text-slate-900" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
            {items.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i===idx?'bg-white':'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Carousel;
