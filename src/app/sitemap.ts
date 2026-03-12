import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fstivo.com';
  const supabase = await createServerClient();

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/features',
    '/pricing',
    '/contact',
    '/events',
    '/blog',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic events
  const { data: events } = await supabase
    .from('events')
    .select('id, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1000);

  const eventPages = (events || []).map(event => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages];
}
