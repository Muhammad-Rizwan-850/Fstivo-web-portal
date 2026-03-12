'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface AdCardProps {
  placementSlug: string;
  className?: string;
  onImpression?: () => void;
  onClick?: () => void;
}

export function AdCard({ placementSlug, className, onImpression, onClick }: AdCardProps) {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState(false);

  useEffect(() => {
    loadAd();
  }, [placementSlug]);

  useEffect(() => {
    if (ad && !impressionTracked) {
      trackImpression();
    }
  }, [ad, impressionTracked]);

  async function loadAd() {
    try {
      const response = await fetch(`/api/ads/serve?placement=${placementSlug}`);
      if (response.ok) {
        const data = await response.json();
        setAd(data.ad);
      }
    } catch (error) {
      logger.error('Error loading ad:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackImpression() {
    if (!ad) return;

    try {
      await fetch(ad.tracking_params.impression_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: window.location.href,
          referrer: document.referrer
        })
      });
      setImpressionTracked(true);
      onImpression?.();
    } catch (error) {
      logger.error('Error tracking impression:', error);
    }
  }

  function handleClick() {
    onClick?.();
    if (ad?.tracking_params.click_url) {
      window.location.href = ad.tracking_params.click_url;
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
        <div className="h-full w-full" />
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  const { creative } = ad;

  return (
    <div
      className={`relative cursor-pointer hover:opacity-90 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {creative.type === 'image' && (
        <div className="relative w-full h-full">
          <Image
            src={creative.content.image_url}
            alt={creative.name}
            fill
            className="object-cover rounded"
          />
          {creative.cta_text && (
            <div className="absolute bottom-4 right-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                {creative.cta_text}
              </button>
            </div>
          )}
        </div>
      )}

      {creative.type === 'text' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {creative.content.headline && (
            <h3 className="text-xl font-bold mb-2">{creative.content.headline}</h3>
          )}
          {creative.content.description && (
            <p className="text-gray-600 mb-4">{creative.content.description}</p>
          )}
          {creative.cta_text && (
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
              {creative.cta_text}
            </button>
          )}
        </div>
      )}

      {creative.type === 'html' && (
        <div
          dangerouslySetInnerHTML={{ __html: creative.content.html_code }}
          className="w-full h-full"
        />
      )}

      <div className="absolute top-2 right-2">
        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded">
          Sponsored
        </span>
      </div>
    </div>
  );
}
