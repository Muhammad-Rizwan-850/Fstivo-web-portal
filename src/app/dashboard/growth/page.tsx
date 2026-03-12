import { redirect } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import { MarketingGrowthSystem } from '@/components/features/marketing-growth-system'

export default async function GrowthHubPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?redirect=/dashboard/growth')
  }

  return (
    <main className="min-h-screen">
      <MarketingGrowthSystem userId={user.id} />
    </main>
  )
}
