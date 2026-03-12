import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventGrid } from '@/components/features/events/event-grid';
import { CategoryHero } from '@/components/features/events/category-hero';

const CATEGORIES: Record<string, { name: string; icon: string; description: string }> = {
  conference: { name: 'Conferences', icon: '🎤', description: 'Professional conferences and seminars' },
  concert: { name: 'Concerts', icon: '🎵', description: 'Live music performances and concerts' },
  workshop: { name: 'Workshops', icon: '🎓', description: 'Interactive learning workshops and training' },
  sports: { name: 'Sports', icon: '⚽', description: 'Sports events and competitions' },
  exhibition: { name: 'Exhibitions', icon: '🎨', description: 'Art exhibitions and displays' },
  networking: { name: 'Networking', icon: '🤝', description: 'Professional networking events' },
  charity: { name: 'Charity', icon: '❤️', description: 'Charity events and fundraisers' },
  festival: { name: 'Festivals', icon: '🎉', description: 'Festivals and cultural celebrations' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES[slug];
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} Events | FSTIVO`,
    description: `Discover amazing ${category.name.toLowerCase()} events in Pakistan`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORIES[slug];

  if (!category) {
    notFound();
  }

  const supabase = createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, banner_url, start_date, location, category')
    .eq('category', slug)
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  return (
    <div className="min-h-screen">
      <CategoryHero category={category} />

      <div className="container mx-auto px-4 py-12">
        <EventGrid events={events || []} />
      </div>
    </div>
  );
}
