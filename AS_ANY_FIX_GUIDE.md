src/src/components/error-boundary.tsx:47:    if (typeof window !== 'undefined' && (window as any).Sentry) {
src/src/components/error-boundary.tsx:48:      ;(window as any).Sentry.captureException(error, {
src/src/components/providers.tsx:30:            {...({ position: 'bottom-right' } as any)}
src/src/components/features/ticket-display.tsx:190:      const reg = registration as any
src/src/components/features/ticket-display.tsx:191:      const eventData = reg.event as any
src/src/components/features/enhanced-user-dashboard.tsx:150:          volunteerPoints: (volunteerData as any).total_points || 0,
src/src/components/features/enhanced-user-dashboard.tsx:389:                              (registration.event as any).banner_image_url ||
src/src/components/features/enhanced-user-dashboard.tsx:532:                          src={event.cover_image_url || (event as any).banner_image_url || '/api/placeholder/100'}
src/src/components/features/email-campaign-manager.tsx:39:          recipientCount: (response.result as any)?.recipientCount,
src/src/components/features/email-campaign-manager.tsx:45:        setResult({ success: false, message: (response.error as any)?.message || 'Failed to send email' })
src/src/components/features/event-feed.tsx:85:      const currentReaction = (post as any)?.userReaction
src/src/components/features/event-feed.tsx:246:                  className={(post as any)?.userReaction?.reaction_type === 'like' ? 'text-red-500' : ''}
src/src/components/features/event-feed.tsx:250:                      (post as any)?.userReaction?.reaction_type === 'like' ? 'fill-current' : ''
src/src/components/features/qr-code-system.tsx:129:      const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/components/features/qr-code-system.tsx:323:      const { error } = await (supabase.from('registrations') as any)
src/src/components/features/qr-code-system.tsx:423:      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
src/src/components/features/event-details.tsx:69:      setEvent(enhancedEvent as any)
src/src/components/features/event-details.tsx:317:                          {(event as any).venue_address || event.location?.address || ''},{' '}
src/src/components/features/admin-panel.tsx:623:                          {(txn as any).user_full_name || 'Unknown'}
src/src/components/features/admin-panel.tsx:626:                          {(txn as any).event_title || 'Unknown'}
src/src/components/security/data-export-section.tsx:43:          onChange={(e) => setExportType(e.target.value as any)}
src/src/lib/webhooks/stripeWebhookVerify.ts:5:  apiVersion: (process.env.STRIPE_API_VERSION || undefined) as any,
src/src/lib/utils/errors.ts:29:    return (error as any).code;
src/src/lib/utils/errors.ts:32:    return (error as any).code;
src/src/lib/utils/errors.ts:55:    return (error as any).name === 'ValidationError';
src/src/lib/utils/errors.ts:72:      code: (error as any).code,
src/src/lib/utils/uploadUtils.ts:128:    }) as any
src/src/lib/auth/server-actions.ts:88:    const { error: profileError } = await (supabase.from('profiles') as any).insert({
src/src/lib/auth/server-actions.ts:182:  const { error } = await (supabase.from('profiles') as any).update({
src/src/lib/auth/server-actions.ts:230:  const { data: uploadData, error: uploadError } = await (supabase.storage as any)
src/src/lib/auth/server-actions.ts:245:  const { error: updateError } = await (supabase.from('profiles') as any)
src/src/lib/auth/server-actions.ts:288:  const { error: profileError } = await (supabase.from('profiles') as any)
src/src/lib/admin/adminAuth.ts:53:    return ['super_admin', 'admin', 'moderator'].includes((data as any).role)
src/src/lib/admin/adminAuth.ts:83:    return roleHierarchy[(data as any).role as AdminRole] >= roleHierarchy[requiredRole]
src/src/lib/admin/adminAuth.ts:131:      } as any)
src/src/lib/admin/adminAuth.ts:137:      .from('user_profiles') as any)
src/src/lib/admin/adminAuth.ts:165:      .from('user_profiles') as any)
src/src/lib/admin/adminAuth.ts:204:    const { error } = await (supabase.rpc as any)('log_admin_activity', {
src/src/lib/admin/adminAuth.ts:267:    const { error } = await (supabase as any)
src/src/lib/admin/adminAuth.ts:309:    const { error } = await (supabase as any)
src/src/lib/admin/adminAuth.ts:347:    const { data, error } = await (supabase as any)
src/src/lib/admin/adminAuth.ts:372:    const { error } = await (supabase as any)
src/src/lib/admin/adminAuth.ts:414:    const { data, error } = await (supabase.rpc as any)('get_revenue_by_month', {
src/src/lib/feature-flags.ts:53:          environment: (process.env.NODE_ENV as any) || 'development',
src/src/lib/database/queries/social.ts:119:    .from('event_posts') as any)
src/src/lib/database/queries/social.ts:140:    .from('event_posts') as any)
src/src/lib/database/queries/social.ts:157:    .from('post_reactions') as any)
src/src/lib/database/queries/social.ts:166:      .from('post_reactions') as any)
src/src/lib/database/queries/social.ts:177:    .from('post_reactions') as any)
src/src/lib/database/queries/social.ts:184:    await supabase.rpc('increment_post_likes', { post_id: data.post_id } as any)
src/src/lib/database/queries/social.ts:194:    .from('post_reactions') as any)
src/src/lib/database/queries/social.ts:200:    await supabase.rpc('decrement_post_likes', { post_id: postId } as any)
src/src/lib/database/queries/social.ts:280:    .from('post_comments') as any)
src/src/lib/database/queries/social.ts:287:    await supabase.rpc('increment_post_comments', { post_id: data.post_id } as any)
src/src/lib/database/queries/social.ts:297:    .from('post_comments') as any)
src/src/lib/database/queries/social.ts:302:    await supabase.rpc('decrement_post_comments', { post_id: postId } as any)
src/src/lib/database/queries/social.ts:337:    .from('event_photos') as any)
src/src/lib/database/queries/social.ts:358:    .from('event_photos') as any)
src/src/lib/database/queries/social.ts:397:    .from('referrals') as any)
src/src/lib/database/queries/social.ts:416:  } as any)
src/src/lib/database/queries/social.ts:449:    .from('connections') as any)
src/src/lib/database/queries/social.ts:469:    .from('connections') as any)
src/src/lib/database/queries/social.ts:482:    .from('connections') as any)
src/src/lib/database/queries/sponsored-ads.ts:118:    .from('sponsored_event_bookings') as any)
src/src/lib/database/queries/sponsored-ads.ts:144:    .from('sponsored_event_bookings') as any)
src/src/lib/database/queries/sponsored-ads.ts:164:    .from('sponsored_event_bookings') as any)
src/src/lib/database/queries/sponsored-ads.ts:185:    .from('sponsored_event_bookings') as any)
src/src/lib/database/queries/sponsored-ads.ts:289:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:320:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:340:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:362:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:380:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:434:    .from('ad_tracking') as any)
src/src/lib/database/queries/sponsored-ads.ts:440:      ip_address: trackingData?.ipAddress as any,
src/src/lib/database/queries/sponsored-ads.ts:455:  } as any)
src/src/lib/database/queries/sponsored-ads.ts:474:    .from('ad_tracking') as any)
src/src/lib/database/queries/sponsored-ads.ts:480:      ip_address: trackingData?.ipAddress as any,
src/src/lib/database/queries/sponsored-ads.ts:495:  } as any)
src/src/lib/database/queries/sponsored-ads.ts:510:    .from('ad_tracking') as any)
src/src/lib/database/queries/sponsored-ads.ts:527:  } as any)
src/src/lib/database/queries/sponsored-ads.ts:603:    .from('sponsor_profiles') as any)
src/src/lib/database/queries/sponsored-ads.ts:613:      budget_range: profileData.budgetRange as any,
src/src/lib/database/queries/sponsored-ads.ts:633:    .from('sponsor_profiles') as any)
src/src/lib/database/queries/sponsored-ads.ts:707:    .from('sponsor_matches') as any)
src/src/lib/database/queries/sponsored-ads.ts:712:      match_reasons: matchData.matchReasons as any,
src/src/lib/database/queries/sponsored-ads.ts:737:    .from('sponsor_matches') as any)
src/src/lib/database/queries/sponsored-ads.ts:755:    .from('banner_ads') as any)
src/src/lib/database/queries/sponsored-ads.ts:763:    .from('ad_tracking') as any)
src/src/lib/database/queries/sponsored-ads.ts:790:    .from('sponsored_event_bookings') as any)
src/src/lib/database/queries/sponsored-ads.ts:798:    .from('ad_tracking') as any)
src/src/lib/database/queries/sponsored-ads.ts:820:    .from('banner_ads') as any)
src/src/lib/database/queries/events.ts:137:    .from('events') as any)
src/src/lib/database/queries/events.ts:148:    .from('events') as any)
src/src/lib/database/queries/events.ts:160:    .from('events') as any)
src/src/lib/database/queries/events.ts:192:  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
src/src/lib/database/queries/events.ts:223:    .select('amount') as any)
src/src/lib/database/queries/events.ts:239:    .select('registered_at') as any)
src/src/lib/database/queries/events.ts:260:    .select('id, name, price') as any)
src/src/lib/database/queries/events.ts:293:    capacity: (event as any).capacity || 0,
src/src/lib/database/queries/events.ts:351:    .from('registrations') as any)
src/src/lib/database/queries/events.ts:463:    .from('events') as any)
src/src/lib/database/queries/preferences.ts:80:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:118:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:134:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:148:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:162:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:179:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:196:    .from('user_preferences') as any)
src/src/lib/database/queries/preferences.ts:227:    .from('pwa_push_subscriptions') as any)
src/src/lib/database/queries/preferences.ts:244:    .from('pwa_push_subscriptions') as any)
src/src/lib/database/queries/preferences.ts:293:    .from('pwa_offline_tickets') as any)
src/src/lib/database/queries/preferences.ts:356:    .from('pwa_installations') as any)
src/src/lib/database/queries/preferences.ts:374:    .from('pwa_installations') as any)
src/src/lib/database/queries/affiliate.ts:73:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:79:      payment_details: accountData.paymentDetails as any,
src/src/lib/database/queries/affiliate.ts:95:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:115:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:134:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:151:  const { data: account } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:160:  const { data: commissions } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:179:    totalClicks: (account as any).total_clicks,
src/src/lib/database/queries/affiliate.ts:180:    totalConversions: (account as any).total_conversions,
src/src/lib/database/queries/affiliate.ts:181:    conversionRate: (account as any).conversion_rate,
src/src/lib/database/queries/affiliate.ts:182:    totalEarned: (account as any).total_earned,
src/src/lib/database/queries/affiliate.ts:183:    pendingPayout: (account as any).pending_payout,
src/src/lib/database/queries/affiliate.ts:245:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:268:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:282:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:296:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:299:      clicks: (supabase as any).raw('clicks + 1')
src/src/lib/database/queries/affiliate.ts:312:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:315:      conversions: (supabase as any).raw('conversions + 1'),
src/src/lib/database/queries/affiliate.ts:316:      revenue_generated: (supabase as any).raw(`revenue_generated + ${amount}`)
src/src/lib/database/queries/affiliate.ts:341:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:346:      ip_address: clickData.ipAddress as any,
src/src/lib/database/queries/affiliate.ts:359:    total_clicks: (supabase as any).raw('total_clicks + 1')
src/src/lib/database/queries/affiliate.ts:400:  const { error: updateError } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:412:  await updateAffiliateAccount((click as any).affiliate_id, {
src/src/lib/database/queries/affiliate.ts:413:    total_conversions: (supabase as any).raw('total_conversions + 1')
src/src/lib/database/queries/affiliate.ts:417:  if ((click as any).link_id) {
src/src/lib/database/queries/affiliate.ts:418:    await incrementLinkConversions((click as any).link_id, 0) // Amount will be updated when commission is calculated
src/src/lib/database/queries/affiliate.ts:479:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:497:    pending_payout: (supabase as any).raw(`pending_payout + ${commissionData.commissionAmount}`),
src/src/lib/database/queries/affiliate.ts:498:    total_earned: (supabase as any).raw(`total_earned + ${commissionData.commissionAmount}`)
src/src/lib/database/queries/affiliate.ts:507:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:524:  const { data, error } = await (supabase as any)
src/src/lib/database/queries/affiliate.ts:537:    const commission = data[0] as any
src/src/lib/database/queries/affiliate.ts:542:      pending_payout: (supabase as any).raw(`pending_payout - ${totalAmount}`),
src/src/lib/database/queries/affiliate.ts:543:      total_paid: (supabase as any).raw(`total_paid + ${totalAmount}`)
src/src/lib/database/queries/affiliate.ts:557:    .from('affiliate_commissions') as any)
src/src/lib/database/queries/affiliate.ts:565:    .from('affiliate_commissions') as any)
src/src/lib/database/queries/affiliate.ts:578:      pending_payout: (supabase as any).raw(`pending_payout - ${commission.commission_amount}`)
src/src/lib/database/queries/affiliate.ts:616:    .from('affiliate_payouts') as any)
src/src/lib/database/queries/affiliate.ts:622:      payment_details: payoutData.paymentDetails as any,
src/src/lib/database/queries/affiliate.ts:669:    .from('affiliate_payouts') as any)
src/src/lib/database/queries/affiliate.ts:723:    .from('affiliate_marketing_materials') as any)
src/src/lib/database/queries/affiliate.ts:725:      download_count: (supabase as any).raw('download_count + 1')
src/src/lib/database/queries/affiliate.ts:781:    .from('affiliate_accounts') as any)
src/src/lib/database/queries/affiliate.ts:794:    .from('affiliate_commissions') as any)
src/src/lib/database/queries/affiliate.ts:809:    .from('affiliate_referral_links') as any)
src/src/lib/database/queries/affiliate.ts:875:    .from('affiliate_commissions') as any)
src/src/lib/database/queries/analytics.ts:53:    .from('attendance_tracking') as any)
src/src/lib/database/queries/analytics.ts:113:    .from('revenue_analytics') as any)
src/src/lib/database/queries/analytics.ts:156:    .from('revenue_analytics') as any)
src/src/lib/database/queries/analytics.ts:220:    .from('marketing_funnel') as any)
src/src/lib/database/queries/analytics.ts:243:    .from('marketing_funnel') as any)
src/src/lib/database/queries/analytics.ts:296:    .from('attendee_demographics') as any)
src/src/lib/database/queries/analytics.ts:349:    .from('engagement_heatmaps') as any)
src/src/lib/database/queries/analytics.ts:385:    .from('analytics_reports') as any)
src/src/lib/database/queries/analytics.ts:393:      filters: reportData.filters as any,
src/src/lib/database/queries/analytics.ts:437:    .from('analytics_reports') as any)
src/src/lib/database/queries/analytics.ts:480:    .from('traffic_sources') as any)
src/src/lib/database/queries/analytics.ts:490:      .from('traffic_sources') as any)
src/src/lib/database/queries/analytics.ts:506:      .from('traffic_sources') as any)
src/src/lib/database/queries/analytics.ts:569:    .from('custom_metrics') as any)
src/src/lib/database/queries/analytics.ts:575:      metadata: options?.metadata as any
src/src/lib/database/queries/analytics.ts:608:      .from('events') as any)
src/src/lib/database/queries/registrations.ts:29:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:43:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:55:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:77:    .from('ticket_types') as any)
src/src/lib/database/queries/registrations.ts:104:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:126:      await (supabase.rpc as any)('increment_ticket_sold', {
src/src/lib/database/queries/registrations.ts:145:      .from('attendees') as any)
src/src/lib/database/queries/registrations.ts:200:    .from('ticket_types') as any)
src/src/lib/database/queries/registrations.ts:232:    .from('attendees') as any)
src/src/lib/database/queries/registrations.ts:264:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:295:    .from('attendees') as any)
src/src/lib/database/queries/registrations.ts:326:    .from('registrations') as any)
src/src/lib/database/queries/registrations.ts:366:    .from('registrations') as any)
src/src/lib/database/queries/email-marketing.ts:70:    .from('email_templates') as any)
src/src/lib/database/queries/email-marketing.ts:79:      template_variables: templateData.templateVariables as any,
src/src/lib/database/queries/email-marketing.ts:96:    .from('email_templates') as any)
src/src/lib/database/queries/email-marketing.ts:125:  } as any)
src/src/lib/database/queries/email-marketing.ts:173:    .from('audience_segments') as any)
src/src/lib/database/queries/email-marketing.ts:179:      filters: segmentData.filters as any
src/src/lib/database/queries/email-marketing.ts:192:  const filters = segment.filters as any
src/src/lib/database/queries/email-marketing.ts:219:    .from('audience_segments') as any)
src/src/lib/database/queries/email-marketing.ts:282:    .from('email_campaigns') as any)
src/src/lib/database/queries/email-marketing.ts:310:    .from('email_campaigns') as any)
src/src/lib/database/queries/email-marketing.ts:382:    const filters = segment.filters as any
src/src/lib/database/queries/email-marketing.ts:396:  const registrationIds = (data as any)?.map((r: any) => r.id) || []
src/src/lib/database/queries/email-marketing.ts:400:    .in('id', (data as any)?.map((r: any) => r.profile_id) || [])
src/src/lib/database/queries/email-marketing.ts:402:  return (data as any)?.map((reg: any) => {
src/src/lib/database/queries/email-marketing.ts:403:    const profile = (profiles.data as any)?.find((p: any) => p.id === reg.profile_id)
src/src/lib/database/queries/email-marketing.ts:443:    .from('email_tracking') as any)
src/src/lib/database/queries/email-marketing.ts:468:  if ((tracking.data as any)) {
src/src/lib/database/queries/email-marketing.ts:470:      campaign_id: (tracking.data as any).campaign_id
src/src/lib/database/queries/email-marketing.ts:471:    } as any)
src/src/lib/database/queries/email-marketing.ts:490:  if ((tracking.data as any)) {
src/src/lib/database/queries/email-marketing.ts:492:      campaign_id: (tracking.data as any).campaign_id
src/src/lib/database/queries/email-marketing.ts:493:    } as any)
src/src/lib/database/queries/email-marketing.ts:515:    .from('email_queue') as any)
src/src/lib/database/queries/email-marketing.ts:559:    .from('email_queue') as any)
src/src/lib/database/queries/email-marketing.ts:582:      .from('email_queue') as any)
src/src/lib/database/queries/email-marketing.ts:592:        .from('email_tracking') as any)
src/src/lib/database/queries/email-marketing.ts:606:      .from('email_queue') as any)
src/src/lib/database/queries/email-marketing.ts:635:    .from('email_ab_tests') as any)
src/src/lib/database/queries/email-marketing.ts:668:    .from('email_ab_tests') as any)
src/src/lib/database/queries/email-marketing.ts:704:    .from('email_automations') as any)
src/src/lib/database/queries/email-marketing.ts:709:      trigger_conditions: automationData.triggerConditions as any,
src/src/lib/database/queries/email-marketing.ts:730:  } as any)
src/src/lib/database/queries/email-marketing.ts:748:    .from('email_suppression_list') as any)
src/src/lib/database/queries/email-marketing.ts:787:    .from('unsubscribe_logs') as any)
src/src/lib/database/queries/subscriptions.ts:23:    .from('subscription_tiers') as any)
src/src/lib/database/queries/subscriptions.ts:36:    .from('subscription_tiers') as any)
src/src/lib/database/queries/subscriptions.ts:49:    .from('subscription_tiers') as any)
src/src/lib/database/queries/subscriptions.ts:108:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:135:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:168:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:186:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:202:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:230:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:243:  const tier = subscription.tier as any
src/src/lib/database/queries/subscriptions.ts:248:    .from('subscription_usage') as any)
src/src/lib/database/queries/subscriptions.ts:295:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:303:    .from('subscription_usage') as any)
src/src/lib/database/queries/subscriptions.ts:322:    .from('subscription_usage') as any)
src/src/lib/database/queries/subscriptions.ts:336:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:344:    .from('subscription_usage') as any)
src/src/lib/database/queries/subscriptions.ts:378:    .from('feature_gates') as any)
src/src/lib/database/queries/subscriptions.ts:390:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:401:  const tier = subscription.tier as any
src/src/lib/database/queries/subscriptions.ts:413:    .from('feature_gates') as any)
src/src/lib/database/queries/subscriptions.ts:430:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:440:  const tier = subscription.tier as any
src/src/lib/database/queries/subscriptions.ts:488:    .from('user_subscriptions') as any)
src/src/lib/database/queries/subscriptions.ts:501:    .from('subscription_invoices') as any)
src/src/lib/database/queries/subscriptions.ts:513:      line_items: invoiceData.lineItems as any
src/src/lib/database/queries/subscriptions.ts:547:    .from('subscription_invoices') as any)
src/src/lib/database/queries/subscriptions.ts:589:    .from('subscription_history') as any)
src/src/lib/database/queries/subscriptions.ts:613:    .from('subscription_invoices') as any)
src/src/lib/database/queries/subscriptions.ts:673:    .from('user_subscriptions') as any)
src/src/lib/database/queries/templates.ts:81:    .from('event_templates') as any)
src/src/lib/database/queries/templates.ts:88:      template_data: templateData.templateData as any,
src/src/lib/database/queries/templates.ts:107:    .from('event_templates') as any)
src/src/lib/database/queries/templates.ts:124:    .from('event_templates') as any)
src/src/lib/database/queries/templates.ts:135:    .from('event_templates') as any)
src/src/lib/database/queries/templates.ts:137:      usage_count: (supabase as any).raw('usage_count + 1')
src/src/lib/database/queries/templates.ts:189:    .from('template_reviews') as any)
src/src/lib/database/queries/templates.ts:208:    .from('template_reviews') as any)
src/src/lib/database/queries/templates.ts:217:    .from('event_templates') as any)
src/src/lib/database/queries/templates.ts:271:    .from('template_collections') as any)
src/src/lib/database/queries/templates.ts:293:    .from('template_collections') as any)
src/src/lib/database/queries/templates.ts:350:    .from('event_series') as any)
src/src/lib/database/queries/templates.ts:355:      recurrence_pattern: seriesData.recurrencePattern as any,
src/src/lib/database/queries/templates.ts:371:    .from('event_series') as any)
src/src/lib/database/queries/templates.ts:373:      event_ids: (supabase as any).raw('array_append(event_ids, $1)', [eventId])
src/src/lib/database/queries/templates.ts:409:    .from('event_clone_history') as any)
src/src/lib/database/queries/templates.ts:465:    .from('template_categories') as any)
src/src/lib/database/queries/templates.ts:512:    .from('template_tags') as any)
src/src/lib/database/queries/templates.ts:525:    .from('template_tags') as any)
src/src/lib/database/queries/templates.ts:527:      usage_count: (supabase as any).raw('usage_count + 1')
src/src/lib/database/queries/templates.ts:548:    .from('template_category_mapping') as any)
src/src/lib/database/queries/templates.ts:579:    .from('template_category_mapping') as any)
src/src/lib/database/queries/templates.ts:599:    .from('template_usage_analytics') as any)
src/src/lib/database/queries/checkin.ts:102:    .from('checkin_stations') as any)
src/src/lib/database/queries/checkin.ts:123:    .from('checkin_stations') as any)
src/src/lib/database/queries/checkin.ts:154:    .from('checkin_records') as any)
src/src/lib/database/queries/checkin.ts:177:      .from('registrations') as any)
src/src/lib/database/queries/checkin.ts:274:    .from('registrations') as any)
src/src/lib/database/queries/checkin.ts:287:    .from('badge_prints') as any)
src/src/lib/database/queries/checkin.ts:297:    .from('badge_prints') as any)
src/src/lib/database/queries/checkin.ts:346:    .from('badge_prints') as any)
src/src/lib/database/queries/checkin.ts:368:    .from('walkin_registrations') as any)
src/src/lib/database/queries/checkin.ts:401:    .from('walkin_registrations') as any)
src/src/lib/database/queries/checkin.ts:427:    const ticketName = (registration as any).ticket_types?.name || ''
src/src/lib/database/queries/checkin.ts:497:    .from('ticket_recovery') as any)
src/src/lib/database/queries/checkin.ts:517:    .from('ticket_recovery') as any)
src/src/lib/database/queries/checkin.ts:529:      .from('ticket_recovery') as any)
src/src/lib/database/queries/checkin.ts:538:    .from('ticket_recovery') as any)
src/src/lib/database/queries/checkin.ts:551:    .from('ticket_recovery') as any)
src/src/lib/database/queries/ticketing.ts:130:    .from('waitlist') as any)
src/src/lib/database/queries/ticketing.ts:141:    .from('waitlist') as any)
src/src/lib/database/queries/ticketing.ts:193:    .from('waitlist') as any)
src/src/lib/database/queries/ticketing.ts:208:    .from('waitlist') as any)
src/src/lib/database/queries/ticketing.ts:216:    } as any)
src/src/lib/database/queries/ticketing.ts:226:    .from('waitlist') as any)
src/src/lib/database/queries/ticketing.ts:273:    .from('pricing_rules') as any)
src/src/lib/database/queries/ticketing.ts:303:  } as any)
src/src/lib/database/queries/ticketing.ts:305:  return (result as any) || { base_price: 0, final_price: 0, discount: 0, applied_rules: [] }
src/src/lib/database/queries/ticketing.ts:315:    .from('pricing_rules') as any)
src/src/lib/database/queries/ticketing.ts:328:    .from('pricing_rules') as any)
src/src/lib/database/queries/ticketing.ts:363:    .from('ticket_bundles') as any)
src/src/lib/database/queries/ticketing.ts:389:    .from('ticket_bundles') as any)
src/src/lib/database/queries/ticketing.ts:400:    .from('ticket_types') as any)
src/src/lib/database/queries/ticketing.ts:435:    .from('group_bookings') as any)
src/src/lib/database/queries/ticketing.ts:489:    .from('group_booking_attendees') as any)
src/src/lib/database/queries/ticketing.ts:529:    .from('season_passes') as any)
src/src/lib/database/queries/ticketing.ts:569:    .from('season_passes') as any)
src/src/lib/database/queries/ticketing.ts:598:      .from('events') as any)
src/src/lib/database/queries/ticketing.ts:610:      .from('events') as any)
src/src/lib/database/queries/ticketing.ts:628:  } as any)
src/src/lib/database/queries/ticketing.ts:645:    .from('ticket_resale') as any)
src/src/lib/database/queries/ticketing.ts:701:    .from('ticket_resale') as any)
src/src/lib/database/queries/ticketing.ts:718:    .from('ticket_resale') as any)
src/src/lib/database/queries/seating.ts:78:    .from('venues') as any)
src/src/lib/database/queries/seating.ts:93:      amenities: venueData.amenities as any,
src/src/lib/database/queries/seating.ts:110:    .from('venues') as any)
src/src/lib/database/queries/seating.ts:127:    .from('venues') as any)
src/src/lib/database/queries/seating.ts:161:    .from('seating_layouts') as any)
src/src/lib/database/queries/seating.ts:185:    .from('seating_layouts') as any)
src/src/lib/database/queries/seating.ts:192:      stage_position: layoutData.stagePosition as any,
src/src/lib/database/queries/seating.ts:193:      dimensions: layoutData.dimensions as any,
src/src/lib/database/queries/seating.ts:210:    .from('seating_layouts') as any)
src/src/lib/database/queries/seating.ts:234:    .from('seating_layouts') as any)
src/src/lib/database/queries/seating.ts:254:        .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:275:          .from('seats') as any)
src/src/lib/database/queries/seating.ts:304:    .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:343:    .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:350:      position: sectionData.position as any,
src/src/lib/database/queries/seating.ts:370:    .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:384:    .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:399:    .from('seats') as any)
src/src/lib/database/queries/seating.ts:456:    .from('seats') as any)
src/src/lib/database/queries/seating.ts:471:    .from('seats') as any)
src/src/lib/database/queries/seating.ts:488:    .from('seats') as any)
src/src/lib/database/queries/seating.ts:516:    .from('seats') as any)
src/src/lib/database/queries/seating.ts:520:        .from('seating_sections') as any)
src/src/lib/database/queries/seating.ts:578:    .from('seat_reservations') as any)
src/src/lib/database/queries/seating.ts:604:    .from('seat_reservations') as any)
src/src/lib/database/queries/seating.ts:627:    .from('seat_reservations') as any)
src/src/lib/database/queries/seating.ts:647:    .from('seat_reservations') as any)
src/src/lib/database/queries/seating.ts:691:    .from('seat_pricing_tiers') as any)
src/src/lib/database/queries/seating.ts:698:      benefits: tierData.benefits as any
src/src/lib/database/queries/seating.ts:738:    .from('accessibility_requests') as any)
src/src/lib/database/queries/seating.ts:763:    .from('accessibility_requests') as any)
src/src/lib/database/queries/seating.ts:811:    .from('group_seating') as any)
src/src/lib/database/queries/seating.ts:835:    .from('group_seating') as any)
src/src/lib/database/queries/seating.ts:865:    .from('seat_holds') as any)
src/src/lib/database/queries/seating.ts:887:    .from('seat_holds') as any)
src/src/lib/database/queries/seating.ts:895:    .from('seat_holds') as any)
src/src/lib/database/queries/seating.ts:925:    .from('seating_config_history') as any)
src/src/lib/database/queries/seating.ts:928:      configuration: configuration as any,
src/src/lib/database/queries/seating.ts:1001:      .from('seats') as any)
src/src/lib/database/queries/users.ts:104:      .from('profiles') as any)
src/src/lib/database/queries/users.ts:141:      .from('profiles') as any)
src/src/lib/database/queries/users.ts:167:      .from('profiles') as any)
src/src/lib/database/queries/users.ts:283:      .from('registrations') as any)
src/src/lib/pwa-utils.ts:80:      applicationServerKey: convertedVapidKey as any
src/src/lib/pwa-utils.ts:174:    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
src/src/lib/pwa-utils.ts:176:      await (registration as any).sync.register('sync-registrations');
src/src/lib/pwa-utils.ts:307:  const isAndroidStandalone = (window.navigator as any).standalone === true;
src/src/lib/pwa-utils.ts:340:    (deferredPrompt as any).prompt();
src/src/lib/pwa-utils.ts:342:    const { outcome } = await (deferredPrompt as any).userChoice;
src/src/lib/pwa-utils.ts:378:  const atobFn = (globalThis as any).atob;
src/src/lib/cron/eventReminderCron.ts:43:      .eq('is_published', true) as any)
src/src/lib/cron/eventReminderCron.ts:69:        .eq('status', 'confirmed') as any)
src/src/lib/cron/eventReminderCron.ts:127:          .single() as any)
src/src/lib/cron/eventReminderCron.ts:190:    .single() as any)
src/src/lib/cron/eventReminderCron.ts:201:    .eq('status', 'confirmed') as any)
src/src/lib/ab-testing.ts:260:      const statsData = stats as any;
src/src/lib/analytics/service.ts:126:    const { error } = await (supabase as any).rpc('update_event_analytics', {
src/src/lib/analytics/service.ts:151:    const { error } = await (supabase as any)
src/src/lib/analytics/service.ts:181:    const { error } = await (supabase as any)
src/src/lib/analytics/service.ts:255:      revenue: parseFloat(a.revenue as any) || 0
src/src/lib/analytics/service.ts:285:    const { data, error } = await (supabase as any)
src/src/lib/analytics/service.ts:324:    const { data, error } = await (supabase as any)
src/src/lib/analytics/service.ts:351:    const { error } = await (supabase as any)
src/src/lib/analytics/service.ts:453:    const { data, error } = await (supabase as any)
src/src/lib/notifications/sms.ts.backup:97:  // Properly typed insert - cast as any to bypass type checking for now
src/src/lib/notifications/sms.ts.backup:107:  } as any;
src/src/lib/notifications/sms.ts:137:  // Properly typed insert - cast as any to bypass type checking for now
src/src/lib/notifications/sms.ts:147:  } as any;
src/src/lib/hooks/useRealtimeSubscription.ts:59:      'postgres_changes' as any,
src/src/lib/hooks/useRealtimeSubscription.ts:222:        'postgres_changes' as any,
src/src/lib/hooks/useAnalytics.ts:66:      const analyticsData = (analytics as any)?.data || analytics
src/src/lib/hooks/useAnalytics.ts:67:      const eventsData = (events as any)?.data || events
src/src/lib/hooks/useAnalytics.ts:68:      const volunteersData = (volunteers as any)?.data || volunteers
src/src/lib/hooks/useAnalytics.ts:69:      const jobsData = (jobs as any)?.data || jobs
src/src/lib/hooks/useAnalytics.ts:96:      const registrationsData = (registrations as any)?.data || registrations
src/src/lib/hooks/useAnalytics.ts:184:      const jobsData = (jobs as any)?.data || jobs
src/src/lib/security/security-fixes.ts:69:  apiVersion: '2025-01-27.acacia' as any, // Updated Stripe API version
src/src/lib/security/auth-middleware.ts:64:      .from('profiles') as any)
src/src/lib/security/auth-middleware.ts:121:      .from('admin_users') as any)
src/src/lib/security/auth-middleware.ts:179:      .from('events') as any)
src/src/lib/security/auth-middleware.ts:244:      .from('tickets') as any)
src/src/lib/security/auth-middleware.ts:402:      .from('admin_users') as any)
src/src/lib/security/sql-injection-prevention.ts:415:  const { data, error } = await (supabase.rpc as any)('execute_raw_sql', {
src/src/lib/actions/attendees.ts:117:    const reg = registration as any
src/src/lib/actions/attendees.ts:157:      .eq('id', registrationId) as any
src/src/lib/actions/attendees.ts:171:      .eq('id', registration.event_id) as any
src/src/lib/actions/attendees.ts:181:    const { error: updateError } = await (supabase.from('registrations') as any)
src/src/lib/actions/attendees.ts:219:    const { data: profile, error } = await (supabase.from('profiles') as any)
src/src/lib/actions/ticketing-actions.ts:85:  const { data: profile } = await (supabase as any)
src/src/lib/actions/ticketing-actions.ts:91:  if (!profile || (profile as any).role !== 'organizer') {
src/src/lib/actions/ticketing-actions.ts:96:  const ruleType = formData.get('rule_type') as any
src/src/lib/actions/ticketing-actions.ts:199:  const { data: profile } = await (supabase as any)
src/src/lib/actions/ticketing-actions.ts:205:  if (!profile || (profile as any).role !== 'organizer') {
src/src/lib/actions/ticketing-actions.ts:407:    .single() as any
src/src/lib/actions/events-server.ts:154:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:189:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:213:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:243:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:257:  const { error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:285:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:304:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:337:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:351:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:381:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:426:  let query = (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:467:  let query = (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:572:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:613:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:637:  const { data, error } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/events-server.ts:668:  const { data: ticketType } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/events-server.ts:692:  const { data, error } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/events-server.ts:721:  const { data: ticketType } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/events-server.ts:735:  const { error } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/events-server.ts:766:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:780:  const { data: registrations, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/events-server.ts:824:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/events-server.ts:851:  const { data: uploadData, error: uploadError } = await (supabase.storage as any)
src/src/lib/actions/events-server.ts:870:  const { error: updateError } = await (supabase.from('events') as any)
src/src/lib/actions/marketing-server.ts:46:    .from('user_profiles') as any)
src/src/lib/actions/marketing-server.ts:69:    .from('referrals') as any)
src/src/lib/actions/marketing-server.ts:99:    .single() as any)
src/src/lib/actions/marketing-server.ts:111:    .from('referrals') as any)
src/src/lib/actions/marketing-server.ts:124:    .from('user_profiles') as any)
src/src/lib/actions/marketing-server.ts:150:    .single() as any)
src/src/lib/actions/marketing-server.ts:157:    .limit(10) as any)
src/src/lib/actions/marketing-server.ts:180:    .single() as any)
src/src/lib/actions/marketing-server.ts:192:    .from('reward_redemptions') as any)
src/src/lib/actions/marketing-server.ts:210:    .from('user_profiles') as any)
src/src/lib/actions/marketing-server.ts:240:    .limit(20) as any)
src/src/lib/actions/marketing-server.ts:260:    .from('campaign_progress') as any)
src/src/lib/actions/marketing-server.ts:293:    .eq('campaign_id', campaignId) as any)
src/src/lib/actions/marketing-server.ts:298:      .from('user_profiles') as any)
src/src/lib/actions/marketing-server.ts:317:    .order('created_at', { ascending: false }) as any)
src/src/lib/actions/marketing-server.ts:344:        .eq('campaign_id', campaign.id) as any)
src/src/lib/actions/marketing-server.ts:368:    .from('share_tracking') as any)
src/src/lib/actions/marketing-server.ts:390:    .lt('created_at', new Date().toISOString()) as any)
src/src/lib/actions/marketing-server.ts:394:      .from('user_profiles') as any)
src/src/lib/actions/marketing-server.ts:415:    .limit(50) as any)
src/src/lib/actions/marketing-server.ts:442:    .order('points', { ascending: true }) as any)
src/src/lib/actions/social.ts:40:    .from('connections') as any)
src/src/lib/actions/social.ts:66:    .from('connections') as any)
src/src/lib/actions/social.ts:92:    .from('messages') as any)
src/src/lib/actions/analytics-actions.ts:77:    const { error } = await (supabase.from('marketing_funnel') as any).insert({
src/src/lib/actions/analytics-actions.ts:122:      .from('analytics_reports') as any)
src/src/lib/actions/checkin-actions.ts:25:  if (!profile || ((profile as any).role !== 'organizer' && (profile as any).role !== 'admin')) {
src/src/lib/actions/checkin-actions.ts:125:  if ((registration as any).checked_in_at) {
src/src/lib/actions/checkin-actions.ts:130:    registration_id: (registration as any).id,
src/src/lib/actions/checkin-actions.ts:167:  if ((registration as any).checked_in_at) {
src/src/lib/actions/checkin-actions.ts:391:  if (!profile || (profile as any).role !== 'admin') {
src/src/lib/actions/events.ts:91:      ...(updateData as any),
src/src/lib/actions/volunteer-server.ts:94:    .from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:105:      .from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:144:  const { data: volunteer } = await (supabase.from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:158:    .from('volunteer_activities') as any)
src/src/lib/actions/volunteer-server.ts:199:  const { data: volunteer } = await (supabase.from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:212:    .from('volunteer_payouts') as any)
src/src/lib/actions/volunteer-server.ts:244:  const { data: volunteer } = await (supabase.from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:259:    .from('volunteer_activities') as any)
src/src/lib/actions/volunteer-server.ts:312:  const { data: volunteer } = await (supabase.from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:323:    .from('volunteer_activities') as any)
src/src/lib/actions/volunteer-server.ts:378:  const { data: volunteer } = await (supabase.from('volunteers') as any)
src/src/lib/actions/volunteer-server.ts:389:    .from('activity_points') as any)
src/src/lib/actions/volunteer-server.ts:403:    .from('volunteer_activities') as any)
src/src/lib/actions/seating-actions.ts:422:      .single() as any);
src/src/lib/actions/registration-server.ts:82:    const { data: event, error: eventError } = await (supabase.from('events') as any)
src/src/lib/actions/registration-server.ts:101:    const { data: ticketType } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/registration-server.ts:159:    const { data: updatedReg, error: updateError } = await (supabase.from('registrations') as any)
src/src/lib/actions/registration-server.ts:208:    .from('registrations') as any)
src/src/lib/actions/registration-server.ts:239:    .from('registrations') as any)
src/src/lib/actions/registration-server.ts:275:  const { data: existingReg } = await (supabase.from('registrations') as any)
src/src/lib/actions/registration-server.ts:289:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/registration-server.ts:307:      await (supabase.rpc as any)('decrement_ticket_sold', {
src/src/lib/actions/registration-server.ts:317:  const { error } = await (supabase.from('registrations') as any)
src/src/lib/actions/registration-server.ts:338:    .from('ticket_types') as any)
src/src/lib/actions/email-server.ts:36:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:103:      await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:131:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:195:      await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:220:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:298:    const { data: registrations, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:374:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:439:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:495:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:566:    const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/email-server.ts:582:    const { data: organizer } = await (supabase.from('profiles') as any)
src/src/lib/actions/payments-server.ts:72:  const { data: registration, error: registrationError } = await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:123:        const stripeData = stripeResult.data as any
src/src/lib/actions/payments-server.ts:133:        await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:157:          payment_url: (jazzcashResult as any).paymentUrl,
src/src/lib/actions/payments-server.ts:158:          payment_data: (jazzcashResult as any).paymentData,
src/src/lib/actions/payments-server.ts:165:        const { data: profile } = await (supabase.from('profiles') as any)
src/src/lib/actions/payments-server.ts:188:          payment_url: (easypaisaResult as any).paymentUrl,
src/src/lib/actions/payments-server.ts:189:          payment_data: (easypaisaResult as any).paymentData,
src/src/lib/actions/payments-server.ts:238:  const { data: registration } = await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:249:    const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/payments-server.ts:293:      await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:332:  const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:385:        const refundData = stripeRefundResult.data as any
src/src/lib/actions/payments-server.ts:405:        await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:420:          const { data: ticketType } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/payments-server.ts:426:            await (supabase.from('ticket_types') as any)
src/src/lib/actions/payments-server.ts:448:      await (supabase.from('registrations') as any)
src/src/lib/actions/payments-server.ts:463:        const { data: ticketType } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/payments-server.ts:469:          await (supabase.from('ticket_types') as any)
src/src/lib/actions/payments-server.ts:502:  const { data: registration } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:69:  const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:85:    const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/qr-server.ts:177:  const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:188:    const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/qr-server.ts:239:  const { data: registration, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:311:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/qr-server.ts:321:  const { data: registrations, error } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:406:  const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/qr-server.ts:416:  const { data: registrations } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:455:  const { data: registration } = await (supabase.from('registrations') as any)
src/src/lib/actions/qr-server.ts:466:    const { data: event } = await (supabase.from('events') as any)
src/src/lib/actions/qr-server.ts:499:  const { data: profile } = await (supabase.from('profiles') as any)
src/src/lib/actions/event-creation-server.ts:199:    const { data: event, error: eventError } = await (supabase.from('events') as any)
src/src/lib/actions/event-creation-server.ts:219:    const { error: ticketsError } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/event-creation-server.ts:260:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/event-creation-server.ts:329:      const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/event-creation-server.ts:357:    const { data: event, error: eventError } = await (supabase.from('events') as any)
src/src/lib/actions/event-creation-server.ts:383:      const { error: ticketsError } = await (supabase.from('ticket_types') as any)
src/src/lib/actions/event-creation-server.ts:430:  const { data: existingEvent } = await (supabase.from('events') as any)
src/src/lib/actions/event-creation-server.ts:449:  const { data, error } = await (supabase.from('events') as any)
src/src/lib/actions/payments-new.ts:8:  apiVersion: '2024-11-20.acacia' as any,
src/src/lib/actions/payments-new.ts:38:      .from('orders') as any)
src/src/lib/actions/payments-new.ts:63:        .from('orders') as any)
src/src/lib/actions/payments-new.ts:72:        .from('tickets') as any)
src/src/lib/actions/payments-new.ts:105:      .from('orders') as any)
src/src/lib/actions/payments-new.ts:113:      .from('tickets') as any)
src/src/lib/actions/payments.ts:8:  apiVersion: '2024-11-20.acacia' as any,
src/src/lib/actions/affiliate-actions.ts:213:    await (supabase as any)
src/src/lib/actions/affiliate-actions.ts:216:        total_conversions: (supabase as any).raw('total_conversions + 1'),
src/src/lib/actions/affiliate-actions.ts:217:        total_earned: (supabase as any).raw('total_earned + ' + String(commission_amount || 0)),
src/src/lib/actions/affiliate-actions.ts:218:        pending_payout: (supabase as any).raw('pending_payout + ' + String(commission_amount || 0))
src/src/lib/actions/social-actions.ts:85:    reaction_type: reactionType as any,
src/src/lib/actions/social-actions.ts:214:  const { data: profile } = await (supabase as any)
src/src/lib/actions/social-actions.ts:220:  if (!profile || ((profile as any).role !== 'admin' && (profile as any).role !== 'organizer')) {
src/src/lib/actions/revenue-actions.ts:71:    ? (tier as any).price_monthly
src/src/lib/actions/revenue-actions.ts:72:    : (tier as any).price_yearly
src/src/lib/actions/revenue-actions.ts:95:    } as any)
src/src/lib/actions/revenue-actions.ts:102:  await createSubscriptionInvoice((subscription as any).id, amount)
src/src/lib/actions/revenue-actions.ts:107:    subscription_id: (subscription as any).id,
src/src/lib/actions/revenue-actions.ts:110:  } as any)
src/src/lib/actions/revenue-actions.ts:142:  const newAmount = (currentSub as any).billing_cycle === 'monthly'
src/src/lib/actions/revenue-actions.ts:143:    ? (newTier as any).price_monthly
src/src/lib/actions/revenue-actions.ts:144:    : (newTier as any).price_yearly
src/src/lib/actions/revenue-actions.ts:147:    .from('user_subscriptions') as any)
src/src/lib/actions/revenue-actions.ts:153:    .eq('id', (currentSub as any).id)
src/src/lib/actions/revenue-actions.ts:160:    subscription_id: (currentSub as any).id,
src/src/lib/actions/revenue-actions.ts:162:    from_tier_id: (currentSub as any).tier_id,
src/src/lib/actions/revenue-actions.ts:164:  } as any)
src/src/lib/actions/revenue-actions.ts:187:    .from('user_subscriptions') as any)
src/src/lib/actions/revenue-actions.ts:192:    .eq('id', (subscription as any).id)
src/src/lib/actions/revenue-actions.ts:199:    subscription_id: (subscription as any).id,
src/src/lib/actions/revenue-actions.ts:202:  } as any)
src/src/lib/actions/revenue-actions.ts:223:  const hasAccess = (subscription as any).tier.features[featureName] === true
src/src/lib/actions/revenue-actions.ts:242:    user_id: (subscription as any).user_id,
src/src/lib/actions/revenue-actions.ts:246:    billing_period_start: (subscription as any).current_period_start,
src/src/lib/actions/revenue-actions.ts:247:    billing_period_end: (subscription as any).current_period_end,
src/src/lib/actions/revenue-actions.ts:254:  } as any)
src/src/lib/actions/revenue-actions.ts:299:  const totalAmount = (slot as any).price_per_day * days
src/src/lib/actions/revenue-actions.ts:310:      daily_rate: (slot as any).price_per_day,
src/src/lib/actions/revenue-actions.ts:313:    } as any)
src/src/lib/actions/revenue-actions.ts:315:    .single() as any)
src/src/lib/actions/revenue-actions.ts:348:    } as any)
src/src/lib/actions/revenue-actions.ts:350:    .single() as any)
src/src/lib/actions/revenue-actions.ts:368:  } as any) as any)
src/src/lib/actions/revenue-actions.ts:375:  } as any) as any)
src/src/lib/actions/revenue-actions.ts:390:  } as any) as any)
src/src/lib/actions/revenue-actions.ts:397:  } as any) as any)
src/src/lib/actions/revenue-actions.ts:421:  const { data: profile, error } = await (supabase as any)
src/src/lib/actions/revenue-actions.ts:469:  const { data: account, error } = await (supabase as any)
src/src/lib/actions/revenue-actions.ts:522:  if (!(account as any) || (account as any).status !== 'active') {
src/src/lib/actions/revenue-actions.ts:530:  let fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}?ref=${(account as any).affiliate_code}`
src/src/lib/actions/revenue-actions.ts:532:    fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/${data.target_event_id}?ref=${(account as any).affiliate_code}`
src/src/lib/actions/revenue-actions.ts:534:    fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events?category=${data.target_category}&ref=${(account as any).affiliate_code}`
src/src/lib/actions/revenue-actions.ts:537:  const { data: link, error } = await (supabase as any)
src/src/lib/actions/revenue-actions.ts:540:      affiliate_id: (account as any).id,
src/src/lib/actions/revenue-actions.ts:572:  await (supabase as any).from('affiliate_clicks').insert({
src/src/lib/actions/revenue-actions.ts:574:    affiliate_id: (account as any).id,
src/src/lib/actions/revenue-actions.ts:580:  await (supabase as any)
src/src/lib/actions/revenue-actions.ts:582:    .update({ total_clicks: (account as any).total_clicks + 1 })
src/src/lib/actions/revenue-actions.ts:583:    .eq('id', (account as any).id)
src/src/lib/actions/revenue-actions.ts:614:  const { data: commission_amount } = await (supabase as any).rpc(
src/src/lib/actions/revenue-actions.ts:617:      p_order_amount: (registration as any).total_amount,
src/src/lib/actions/revenue-actions.ts:618:      p_affiliate_id: (click as any).affiliate_id
src/src/lib/actions/revenue-actions.ts:630:  await (supabase as any).from('affiliate_commissions').insert({
src/src/lib/actions/revenue-actions.ts:631:    affiliate_id: (click as any).affiliate_id,
src/src/lib/actions/revenue-actions.ts:633:    click_id: (click as any).id,
src/src/lib/actions/revenue-actions.ts:634:    order_amount: (registration as any).total_amount,
src/src/lib/actions/revenue-actions.ts:635:    commission_rate: (config as any)?.commission_percentage || 10,
src/src/lib/actions/revenue-actions.ts:641:  await (supabase as any)
src/src/lib/actions/revenue-actions.ts:648:    .eq('id', (click as any).id)
src/src/lib/actions/revenue-actions.ts:651:  await (supabase as any)
src/src/lib/actions/revenue-actions.ts:654:      total_conversions: (supabase as any).raw('total_conversions + 1'),
src/src/lib/actions/revenue-actions.ts:655:      total_earned: (supabase as any).raw(`total_earned + ${commission_amount}`),
src/src/lib/actions/revenue-actions.ts:656:      pending_payout: (supabase as any).raw(`pending_payout + ${commission_amount}`)
src/src/lib/actions/revenue-actions.ts:658:    .eq('id', (click as any).affiliate_id)
src/src/lib/actions/revenue-actions.ts:683:    (supabase as any)
src/src/lib/actions/revenue-actions.ts:686:      .eq('affiliate_id', (account as any).id)
src/src/lib/actions/revenue-actions.ts:688:    (supabase as any)
src/src/lib/actions/revenue-actions.ts:691:      .eq('affiliate_id', (account as any).id),
src/src/lib/actions/revenue-actions.ts:692:    (supabase as any)
src/src/lib/actions/revenue-actions.ts:700:      .eq('affiliate_id', (account as any).id)
src/src/lib/actions/revenue-actions.ts:746:  if ((account as any).pending_payout < ((config as any)?.minimum_payout || 1000)) {
src/src/lib/actions/revenue-actions.ts:747:    return { error: `Minimum payout is ${(config as any)?.minimum_payout} PKR` }
src/src/lib/actions/revenue-actions.ts:751:  const { data: commissions } = await (supabase as any)
src/src/lib/actions/revenue-actions.ts:754:    .eq('affiliate_id', (account as any).id)
src/src/lib/actions/revenue-actions.ts:762:  const { data: payout, error } = await (supabase as any)
src/src/lib/actions/revenue-actions.ts:765:      affiliate_id: (account as any).id,
src/src/lib/actions/revenue-actions.ts:766:      amount: (account as any).pending_payout,
src/src/lib/actions/revenue-actions.ts:768:      payment_method: (account as any).payment_method,
src/src/lib/actions/revenue-actions.ts:769:      payment_details: (account as any).payment_details,
src/src/lib/actions/tickets.ts:50:    .from('orders') as any)
src/src/lib/actions/tickets.ts:77:    .from('tickets') as any)
src/src/lib/actions/tickets.ts:118:    .from('ticket_transfers') as any)
src/src/lib/actions/tickets.ts:146:    .from('tickets') as any)
src/src/lib/actions/event-template-actions.ts:24:      .single() as any);
src/src/lib/actions/event-template-actions.ts:36:      .from('events') as any)
src/src/lib/actions/event-template-actions.ts:52:      await (supabase.from('ticket_types') as any).insert(
src/src/lib/actions/event-template-actions.ts:63:      await (supabase.from('speakers') as any).insert(
src/src/lib/actions/event-template-actions.ts:100:      .single() as any);
src/src/lib/actions/event-template-actions.ts:111:      .from('event_templates') as any)
src/src/lib/actions/event-template-actions.ts:186:    const templateData = template.template_data as any;
src/src/lib/monetization/subscription/features.ts:127:    return (subscription.tier as any)?.features as SubscriptionFeature;
src/src/lib/monetization/ads/budget.ts:131:        spent: (supabase as any).raw('spent + ' + amount),
src/src/lib/monetization/affiliate/payouts.ts:105:        pending_payout: (supabase as any).raw('pending_payout - ' + data.amount),
src/src/lib/monetization/affiliate/payouts.ts:302:        pending_payout: (supabase as any).raw('pending_payout + ' + payout.amount),
src/src/lib/monetization/affiliate/commission.ts:58:    const commissionStructure = config.commission_structure as any;
src/src/lib/monetization/affiliate/commission.ts:185:        total_conversions: (supabase as any).raw('total_conversions + 1'),
src/src/lib/monetization/affiliate/commission.ts:186:        total_earned: (supabase as any).raw('total_earned + ' + commissionAmount),
src/src/lib/monetization/affiliate/commission.ts:187:        pending_payout: (supabase as any).raw('pending_payout + ' + commissionAmount),
src/src/lib/monetization/affiliate/commission.ts:196:          conversions: (supabase as any).raw('conversions + 1'),
src/src/lib/monetization/affiliate/commission.ts:320:        pending_payout: (supabase as any).raw('pending_payout - ' + commission.commission_amount),
src/src/lib/monetization/affiliate/tracking.ts:105:          clicks: (supabase as any).raw('clicks + 1'),
src/src/lib/supabase/server.ts:21:  ) as any; // Temporary: using 'any' to allow dynamic table access
src/src/lib/supabase/server.ts:47:  ) as any; // Temporary: using 'any' to allow dynamic table access
src/src/lib/supabase/queries.ts:292:      .from('registrations') as any)
src/src/lib/supabase/queries.ts:313:      .from('registrations') as any)
src/src/lib/supabase/queries.ts:335:      .from('registrations') as any)
src/src/lib/supabase/queries.ts:412:      .from('profiles') as any)
src/src/lib/supabase/queries.ts:498:      .from('volunteer_activities') as any)
src/src/lib/supabase/queries.ts:703:      .lte('registered_at', endDate) as any)
src/src/lib/supabase/queries.ts:712:      .lte('created_at', endDate) as any)
src/src/lib/supabase/queries.ts:722:      .lte('registered_at', endDate) as any)
src/src/lib/supabase/queries.ts:732:      .lte('registered_at', endDate) as any)
src/src/lib/supabase/queries.ts:747:      .lte('created_at', endDate) as any)
src/src/lib/supabase/queries.ts:757:      .lte('created_at', endDate) as any)
src/src/lib/cache/redis.ts:163:    const info = await (redis as any).info('stats');
src/src/lib/cache/redis.ts:202:    const info = await (redis as any).info('memory');
src/src/lib/cache/redis-config.ts:53:    const RedisClass = (global as any).Redis || MockRedis;
src/src/lib/performance/lazy-loading.tsx:95:    () => import('@/components/features/events/event-calendar' as any),
src/src/lib/performance/lazy-loading.tsx:101:    () => import('@/components/features/analytics/dashboard-analytics' as any),
src/src/lib/performance/lazy-loading.tsx:106:    () => import('@/components/features/analytics/event-analytics' as any),
src/src/lib/performance/lazy-loading.tsx:111:    () => import('@/components/features/analytics/revenue-chart' as any),
src/src/lib/performance/lazy-loading.tsx:117:    () => import('@/components/features/seating/seating-chart-editor' as any),
src/src/lib/performance/lazy-loading.tsx:122:    () => import('@/components/features/seating/seating-chart-viewer' as any),
src/src/lib/performance/lazy-loading.tsx:128:    () => import('@/components/features/editor/rich-text-editor' as any),
src/src/lib/performance/lazy-loading.tsx:133:    () => import('@/components/features/events/event-form' as any),
src/src/lib/performance/lazy-loading.tsx:139:    () => import('@/components/features/checkin/qr-scanner' as any),
src/src/lib/performance/lazy-loading.tsx:145:    () => import('@/components/features/campaigns/campaign-editor' as any),
src/src/lib/performance/lazy-loading.tsx:151:    () => import('@/components/features/social/chat-interface' as any),
src/src/lib/performance/lazy-loading.tsx:157:    () => import('@/components/features/events/event-map' as any),
src/src/lib/performance/lazy-loading.tsx:163:    () => import('@/components/features/admin/admin-dashboard' as any),
src/src/lib/performance/lazy-loading.tsx:168:    () => import('@/components/features/admin/user-management' as any),
src/src/lib/performance/lazy-loading.tsx:182:  OrganizerDashboard: () => import('@/app/dashboard/organizer/page' as any),
src/src/lib/performance/lazy-loading.tsx:183:  AttendeeDashboard: () => import('@/app/dashboard/attendee/page' as any),
src/src/lib/performance/lazy-loading.tsx:184:  AdminDashboard: () => import('@/app/dashboard/admin/page' as any),
src/src/lib/performance/lazy-loading.tsx:187:  EventCreate: () => import('@/app/events/create/page' as any),
src/src/lib/performance/lazy-loading.tsx:188:  EventEdit: (id: string) => import('@/app/events/[id]/edit/page' as any),
src/src/lib/performance/lazy-loading.tsx:191:  EventAnalytics: (id: string) => import('@/app/events/[id]/analytics/page' as any),
src/src/lib/performance/lazy-loading.tsx:194:  Settings: () => import('@/app/settings/page' as any),
src/src/lib/performance/lazy-loading.tsx:195:  ProfileSettings: () => import('@/app/settings/profile/page' as any),
src/src/lib/performance/lazy-loading.tsx:196:  NotificationSettings: () => import('@/app/settings/notifications/page' as any),
src/src/lib/performance/lazy-loading.tsx:275:  preloadComponent(() => import('@/components/features/analytics/dashboard-analytics' as any));
src/src/lib/performance/lazy-loading.tsx:276:  preloadComponent(() => import('@/components/features/events/event-calendar' as any));
src/src/lib/performance/lazy-loading.tsx:284:    (window as any).requestIdleCallback(() => {
src/src/lib/performance/lazy-loading.tsx:285:      preloadComponent(() => import('@/components/features/analytics/event-analytics' as any));
src/src/lib/performance/lazy-loading.tsx:286:      preloadComponent(() => import('@/components/features/editor/rich-text-editor' as any));
src/src/lib/performance/lazy-loading.tsx:291:      preloadComponent(() => import('@/components/features/analytics/event-analytics' as any));
src/src/lib/performance/lazy-loading.tsx:292:      preloadComponent(() => import('@/components/features/editor/rich-text-editor' as any));
src/src/lib/performance/bundle-optimization.ts:13:export const loadD3Library = () => import('d3' as any);
src/src/lib/performance/bundle-optimization.ts:18:export const loadTipTap = () => import('@tiptap/react' as any);
src/src/lib/performance/bundle-optimization.ts:19:export const loadQuill = () => import('react-quill' as any);
src/src/lib/performance/bundle-optimization.ts:21:export const loadMapbox = () => import('mapbox-gl' as any);
src/src/lib/performance/bundle-optimization.ts:23:export const loadUppy = () => import('@uppy/react' as any);
src/src/lib/performance/bundle-optimization.ts:26:export const loadJSZip = () => import('jszip' as any);
src/src/lib/performance/bundle-optimization.ts:27:export const loadPDFLib = () => import('pdf-lib' as any);
src/src/lib/performance/bundle-optimization.ts:152:    (window as any).requestIdleCallback(() => {
src/src/lib/performance/lazy-load.tsx:23:  () => import('@/components/charts/analytics-chart' as any),
src/src/lib/performance/lazy-load.tsx:28:  () => import('@/components/editor/rich-text-editor' as any),
src/src/lib/performance/lazy-load.tsx:33:  () => import('@/components/maps/event-map' as any),
src/src/lib/performance/web-vitals.ts:61:  unsubscribeFns.push(onCLS(callback as any, reportAllChanges as any));
src/src/lib/performance/web-vitals.ts:62:  unsubscribeFns.push(onFCP(callback as any, reportAllChanges as any));
src/src/lib/performance/web-vitals.ts:63:  unsubscribeFns.push(onLCP(callback as any, reportAllChanges as any));
src/src/lib/performance/web-vitals.ts:64:  unsubscribeFns.push(onTTFB(callback as any, reportAllChanges as any));
src/src/lib/performance/web-vitals.ts:137:  if (typeof window !== 'undefined' && (window as any).gtag) {
src/src/lib/performance/web-vitals.ts:138:    (window as any).gtag('event', metric.name, {
src/src/lib/performance/web-vitals.ts:196:    callback(entries as any);
src/src/lib/performance/web-vitals.ts:212:    callback(entries as any);
src/src/lib/performance/query-optimization.ts:50:    ? (data[data.length - 1] as any)[orderBy]
src/src/lib/performance/route-prefetch.tsx:53:      const callbackId = (window as any).requestIdleCallback(() => {
src/src/lib/performance/route-prefetch.tsx:57:        (window as any).cancelIdleCallback(callbackId);
src/src/lib/performance/route-prefetch.tsx:77:      const callbackId = (window as any).requestIdleCallback(() => {
src/src/lib/performance/route-prefetch.tsx:83:        (window as any).cancelIdleCallback(callbackId);
src/src/lib/performance/route-prefetch.tsx:198:        const callbackId = (window as any).requestIdleCallback(() => {
src/src/lib/performance/route-prefetch.tsx:209:          (window as any).cancelIdleCallback(callbackId);
src/src/app/test-email/page.tsx:27:        setResult({ success: false, message: (response.error as any)?.message || 'Failed to send test email' })
src/src/app/api/webhooks/easypaisa/return/route.ts:35:    if (!easyPaisaClient.verifyWebhook(webhookData as unknown as any)) {
src/src/app/api/webhooks/easypaisa/return/route.ts:53:    const { status, message } = easyPaisaClient.getPaymentStatus(webhookData as unknown as any);
src/src/app/api/webhooks/jazzcash/return/route.ts:35:    if (!jazzCashClient.verifyWebhook(webhookData as unknown as any)) {
src/src/app/api/applications/submit/route.ts:91:    await (supabase as any).from('application_activity_log').insert({
src/src/app/api/admin/applications/[applicationId]/reject/route.ts:97:    await (supabase as any).from('application_activity_log').insert({
src/src/app/api/admin/applications/[applicationId]/route.ts:73:      .eq('user_id', (application as any).user_id)
src/src/app/api/admin/applications/[applicationId]/request-changes/route.ts:96:    await (supabase as any).from('application_activity_log').insert({
src/src/app/api/admin/applications/[applicationId]/approve/route.ts:91:    await (supabase as any).from('application_activity_log').insert({
src/src/app/api/admin/activity/route.ts:53:      type: activity.action as any,
src/src/app/api/admin/stats/route.ts:81:    const { data: stats, error } = await (supabase as any).rpc('get_platform_stats')
src/src/app/api/admin/stats/route.ts:85:    const typedStats = stats as any
src/src/app/api/admin/showcase/volunteers/route.ts:26:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/volunteers/route.ts:36:    let query = (supabase as any)
src/src/app/api/admin/showcase/volunteers/route.ts:91:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/volunteers/route.ts:118:    const { data: volunteer, error: volunteerError } = await (supabase as any)
src/src/app/api/admin/showcase/volunteers/route.ts:168:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/volunteers/route.ts:179:    const { data: volunteer, error } = await (supabase as any)
src/src/app/api/admin/showcase/volunteers/route.ts:217:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/volunteers/route.ts:228:    const { error } = await (supabase as any)
src/src/app/api/admin/showcase/team/route.ts:26:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/team/route.ts:91:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/team/route.ts:140:      } as any)
src/src/app/api/admin/showcase/team/route.ts:151:      await (supabase as any).from('team_member_stats').insert({
src/src/app/api/admin/showcase/team/route.ts:152:        team_member_id: (member as any).id,
src/src/app/api/admin/showcase/team/route.ts:158:      } as any);
src/src/app/api/admin/showcase/team/route.ts:164:        team_member_id: (member as any).id,
src/src/app/api/admin/showcase/team/route.ts:169:      await (supabase as any).from('team_member_skills').insert(skillsData);
src/src/app/api/admin/showcase/team/route.ts:175:        team_member_id: (member as any).id,
src/src/app/api/admin/showcase/team/route.ts:180:      await (supabase as any).from('team_member_social').insert(socialData);
src/src/app/api/admin/showcase/team/route.ts:186:        team_member_id: (member as any).id,
src/src/app/api/admin/showcase/team/route.ts:193:      await (supabase as any).from('team_member_achievements').insert(achievementsData);
src/src/app/api/admin/showcase/team/route.ts:223:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/team/route.ts:234:    const { data: member, error } = await (supabase as any)
src/src/app/api/admin/showcase/team/route.ts:272:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/stats/route.ts:23:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/stats/route.ts:46:      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:47:      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }).eq('status', 'published'),
src/src/app/api/admin/showcase/stats/route.ts:48:      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
src/src/app/api/admin/showcase/stats/route.ts:49:      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:50:      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
src/src/app/api/admin/showcase/stats/route.ts:51:      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
src/src/app/api/admin/showcase/stats/route.ts:52:      (supabase as any).from('team_members').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:53:      (supabase as any).from('team_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
src/src/app/api/admin/showcase/stats/route.ts:54:      (supabase as any).from('volunteers').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:55:      (supabase as any).from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
src/src/app/api/admin/showcase/stats/route.ts:56:      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:57:      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
src/src/app/api/admin/showcase/stats/route.ts:58:      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }).eq('is_active', false),
src/src/app/api/admin/showcase/stats/route.ts:59:      (supabase as any).from('universities').select('*', { count: 'exact', head: true }),
src/src/app/api/admin/showcase/stats/route.ts:60:      (supabase as any).from('universities').select('*', { count: 'exact', head: true }).eq('is_active', true),
src/src/app/api/admin/showcase/stats/route.ts:61:      (supabase as any).from('universities').select('*', { count: 'exact', head: true }).eq('is_active', false)
src/src/app/api/admin/showcase/sponsors/route.ts:26:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/sponsors/route.ts:92:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/sponsors/route.ts:145:      } as any)
src/src/app/api/admin/showcase/sponsors/route.ts:154:    const typedSponsor = sponsor as any;
src/src/app/api/admin/showcase/sponsors/route.ts:158:      const typedSponsor = sponsor as any;
src/src/app/api/admin/showcase/sponsors/route.ts:166:      await (supabase as any).from('sponsor_impact_metrics').insert(metricsData);
src/src/app/api/admin/showcase/sponsors/route.ts:178:      await (supabase as any).from('sponsor_testimonials').insert(testimonialsData);
src/src/app/api/admin/showcase/sponsors/route.ts:192:      await (supabase as any).from('sponsor_success_stories').insert(storiesData);
src/src/app/api/admin/showcase/sponsors/route.ts:222:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/sponsors/route.ts:235:    const { data: sponsor, error } = await (supabase as any)
src/src/app/api/admin/showcase/sponsors/route.ts:275:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/universities/route.ts:26:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/universities/route.ts:96:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/universities/route.ts:130:    const { data: university, error: universityError } = await (supabase as any)
src/src/app/api/admin/showcase/universities/route.ts:161:      await (supabase as any).from('university_campuses').insert(campusesData);
src/src/app/api/admin/showcase/universities/route.ts:171:      await (supabase as any).from('university_achievements').insert(achievementsData);
src/src/app/api/admin/showcase/universities/route.ts:182:      await (supabase as any).from('student_organizations').insert(orgsData);
src/src/app/api/admin/showcase/universities/route.ts:194:      await (supabase as any).from('university_events').insert(eventsData);
src/src/app/api/admin/showcase/universities/route.ts:198:    await (supabase as any).rpc('calculate_university_ranks');
src/src/app/api/admin/showcase/universities/route.ts:227:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/universities/route.ts:239:    const { data: university, error } = await (supabase as any)
src/src/app/api/admin/showcase/universities/route.ts:252:      await (supabase as any).from('university_campuses').delete().eq('university_id', id);
src/src/app/api/admin/showcase/universities/route.ts:259:        await (supabase as any).from('university_campuses').insert(campusesData);
src/src/app/api/admin/showcase/universities/route.ts:265:      await (supabase as any).from('university_achievements').delete().eq('university_id', id);
src/src/app/api/admin/showcase/universities/route.ts:273:        await (supabase as any).from('university_achievements').insert(achievementsData);
src/src/app/api/admin/showcase/universities/route.ts:279:      await (supabase as any).from('student_organizations').delete().eq('university_id', id);
src/src/app/api/admin/showcase/universities/route.ts:288:        await (supabase as any).from('student_organizations').insert(orgsData);
src/src/app/api/admin/showcase/universities/route.ts:294:      await (supabase as any).from('university_events').delete().eq('university_id', id);
src/src/app/api/admin/showcase/universities/route.ts:304:        await (supabase as any).from('university_events').insert(eventsData);
src/src/app/api/admin/showcase/universities/route.ts:309:    await (supabase as any).rpc('calculate_university_ranks');
src/src/app/api/admin/showcase/universities/route.ts:338:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/universities/route.ts:349:    const { error } = await (supabase as any)
src/src/app/api/admin/showcase/universities/route.ts:359:    await (supabase as any).rpc('calculate_university_ranks');
src/src/app/api/admin/showcase/partners/route.ts:26:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/partners/route.ts:96:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/partners/route.ts:144:      } as any)
src/src/app/api/admin/showcase/partners/route.ts:153:    const typedPartner = partner as any;
src/src/app/api/admin/showcase/partners/route.ts:162:      await (supabase as any).from('partner_collaborations').insert(collabData);
src/src/app/api/admin/showcase/partners/route.ts:174:      await (supabase as any).from('partner_joint_events').insert(eventsData);
src/src/app/api/admin/showcase/partners/route.ts:185:      await (supabase as any).from('partner_impact_metrics').insert(metricsData);
src/src/app/api/admin/showcase/partners/route.ts:190:      await (supabase as any).from('partner_testimonials').insert({
src/src/app/api/admin/showcase/partners/route.ts:196:      } as any);
src/src/app/api/admin/showcase/partners/route.ts:226:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/partners/route.ts:240:    const { data: partner, error } = await (supabase as any)
src/src/app/api/admin/showcase/partners/route.ts:253:      await (supabase as any).from('partner_collaborations').delete().eq('partner_id', id);
src/src/app/api/admin/showcase/partners/route.ts:261:        await (supabase as any).from('partner_collaborations').insert(collabData);
src/src/app/api/admin/showcase/partners/route.ts:267:      await (supabase as any).from('partner_joint_events').delete().eq('partner_id', id);
src/src/app/api/admin/showcase/partners/route.ts:277:        await (supabase as any).from('partner_joint_events').insert(eventsData);
src/src/app/api/admin/showcase/partners/route.ts:283:      await (supabase as any).from('partner_impact_metrics').delete().eq('partner_id', id);
src/src/app/api/admin/showcase/partners/route.ts:292:        await (supabase as any).from('partner_impact_metrics').insert(metricsData);
src/src/app/api/admin/showcase/partners/route.ts:323:    const typedProfile = profile as any;
src/src/app/api/admin/showcase/events/route.ts:26:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/events/route.ts:36:    let query = (supabase as any)
src/src/app/api/admin/showcase/events/route.ts:91:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/events/route.ts:122:    const { data: event, error: eventError } = await (supabase as any)
src/src/app/api/admin/showcase/events/route.ts:136:      } as any)
src/src/app/api/admin/showcase/events/route.ts:148:        showcase_event_id: (event as any).id,
src/src/app/api/admin/showcase/events/route.ts:153:      await (supabase as any).from('event_gallery').insert(galleryData);
src/src/app/api/admin/showcase/events/route.ts:159:        showcase_event_id: (event as any).id,
src/src/app/api/admin/showcase/events/route.ts:165:      await (supabase as any).from('event_testimonials').insert(testimonialData);
src/src/app/api/admin/showcase/events/route.ts:171:        showcase_event_id: (event as any).id,
src/src/app/api/admin/showcase/events/route.ts:175:      await (supabase as any).from('event_impact_metrics').insert(metricsData);
src/src/app/api/admin/showcase/events/route.ts:205:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/events/route.ts:217:    const { data: event, error } = await (supabase as any)
src/src/app/api/admin/showcase/events/route.ts:231:      await (supabase as any).from('event_gallery').delete().eq('showcase_event_id', id);
src/src/app/api/admin/showcase/events/route.ts:241:        await (supabase as any).from('event_gallery').insert(galleryData);
src/src/app/api/admin/showcase/events/route.ts:248:      await (supabase as any).from('event_testimonials').delete().eq('showcase_event_id', id);
src/src/app/api/admin/showcase/events/route.ts:259:        await (supabase as any).from('event_testimonials').insert(testimonialData);
src/src/app/api/admin/showcase/events/route.ts:266:      await (supabase as any).from('event_impact_metrics').delete().eq('showcase_event_id', id);
src/src/app/api/admin/showcase/events/route.ts:275:        await (supabase as any).from('event_impact_metrics').insert(metricsData);
src/src/app/api/admin/showcase/events/route.ts:306:    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
src/src/app/api/admin/showcase/events/route.ts:317:    const { error } = await (supabase as any)
src/src/app/api/campaigns/[id]/test/route.ts:30:      .single() as any;
src/src/app/api/sponsored/events/[id]/route.ts:11:    const { data, error } = await (supabase as any)
src/src/app/api/sponsored/events/[id]/route.ts:42:    const { data, error } = await (supabase as any)
src/src/app/api/sponsored/events/[id]/route.ts:74:    const { error } = await (supabase as any)
src/src/app/api/templates/[id]/route.ts:11:    const { data, error } = await (supabase as any)
src/src/app/api/templates/[id]/route.ts:42:    const { data, error } = await (supabase as any)
src/src/app/api/templates/[id]/route.ts:74:    const { error } = await (supabase as any)
src/src/app/api/network/connections/route.ts:26:      const { data: suggestions } = await (supabase as any).rpc('get_suggested_connections', {
src/src/app/api/network/connections/route.ts:158:      await (supabase as any).from('social_notifications').insert({
src/src/app/api/network/connections/route.ts:193:        await (supabase as any).from('user_connections').insert({
src/src/app/api/network/connections/route.ts:200:        await (supabase as any).from('social_notifications').insert({
src/src/app/api/network/messages/route.ts:171:    await (supabase as any).from('social_notifications').insert({
src/src/app/api/network/posts/route.ts:115:      await (supabase as any).from('social_notifications').insert(notifications)
src/src/app/api/ticketing/waitlist/route.ts:102:      await (supabase as any).from('notifications').insert({
src/src/app/api/ticketing/pricing/calculate/route.ts:16:    const { data, error } = await (supabase as any).rpc('calculate_dynamic_price', {
src/src/app/api/seating/venues/[id]/route.ts:11:    const { data, error } = await (supabase as any)
src/src/app/api/seating/venues/[id]/route.ts:39:    const { data, error } = await (supabase as any)
src/src/app/api/seating/venues/[id]/route.ts:71:    const { error } = await (supabase as any)
src/src/app/api/seating/charts/[id]/route.ts:11:    const { data, error } = await (supabase as any)
src/src/app/api/seating/charts/[id]/route.ts:42:    const { data, error } = await (supabase as any)
src/src/app/api/ads/[id]/resume/route.ts:17:    const { data, error } = await (supabase as any)
src/src/app/api/ads/[id]/pause/route.ts:17:    const { data, error } = await (supabase as any)
src/src/app/api/ads/impression/route.ts:15:    await (supabase as any).from('ad_impressions').insert({
src/src/app/api/ads/impression/route.ts:23:    await (supabase as any).rpc('increment_ad_impressions', { ad_id });
src/src/app/api/ads/click/route.ts:15:    await (supabase as any).from('ad_clicks').insert({
src/src/app/api/ads/click/route.ts:23:    await (supabase as any).rpc('increment_ad_clicks', { ad_id });
src/src/app/api/registrations/[registrationId]/payment/route.ts:35:      .eq('id', registrationId) as any
src/src/app/api/registrations/[registrationId]/payment/route.ts:42:    const reg = registration as any
src/src/app/api/affiliate/links/[id]/route.ts:16:    const { data: affiliate } = await (supabase as any)
src/src/app/api/affiliate/links/[id]/route.ts:30:    const { data, error } = await (supabase as any)
src/src/app/api/notifications/push/subscribe/route.ts:47:    const { data, error } = await (supabase as any)
src/src/app/api/notifications/preferences/route.ts:23:    const { data: preferences } = await (supabase as any)
src/src/app/api/notifications/preferences/route.ts:28:    (preferences as any[])?.forEach((pref: any) => {
src/src/app/api/notifications/preferences/route.ts:98:        const { data: typeData } = await (supabase as any)
src/src/app/api/notifications/preferences/route.ts:104:        const { data: channelData } = await (supabase as any)
src/src/app/api/notifications/preferences/route.ts:111:          await (supabase as any)
src/src/app/api/notifications/verify/route.ts:40:    const { data: channelData } = await (supabase as any)
src/src/app/api/notifications/verify/route.ts:58:    await (supabase as any)
src/src/app/api/notifications/verify/route.ts:156:        const { data: verification } = await (supabase as any)
src/src/app/api/notifications/verify/route.ts:164:          await (supabase as any)
src/src/app/api/ai/match-volunteers/route.ts:63:      })) as any
src/src/app/api/showcase/team-volunteers/route.ts:141:    const { data: stats } = await (supabase as any).rpc('get_team_volunteer_stats')
src/src/app/api/showcase/team-volunteers/route.ts:221:      await (supabase as any).from('team_member_stats').insert({
src/src/app/api/showcase/team-volunteers/route.ts:238:        await (supabase as any).from('team_member_skills').insert(skillsData)
src/src/app/api/showcase/team-volunteers/route.ts:249:        await (supabase as any).from('team_member_social').insert(socialData)
src/src/app/api/showcase/team-volunteers/route.ts:288:      if ((vol as any).badges && (vol as any).badges.length > 0) {
src/src/app/api/showcase/team-volunteers/route.ts:289:        const badgesData = ((vol as any).badges || []).map((badgeId: string) => ({
src/src/app/api/showcase/team-volunteers/route.ts:293:        await (supabase as any).from('volunteer_badges_earned').insert(badgesData)
src/src/app/api/showcase/sponsors/route.ts:57:    const { data: stats } = await (supabase as any).rpc('get_sponsor_stats')
src/src/app/api/showcase/sponsors/route.ts:186:      await (supabase as any).from('sponsor_impact_metrics').insert(metricsData)
src/src/app/api/showcase/sponsors/route.ts:199:      await (supabase as any).from('sponsor_testimonials').insert(testimonialsData)
src/src/app/api/showcase/sponsors/route.ts:214:      await (supabase as any).from('sponsor_success_stories').insert(storiesData)
src/src/app/api/showcase/community-partners/route.ts:62:    const { data: stats } = await (supabase as any).rpc('get_community_partners_stats')
src/src/app/api/showcase/community-partners/route.ts:177:      await (supabase as any).from('partner_collaborations').insert(collaborationsData)
src/src/app/api/showcase/community-partners/route.ts:189:      await (supabase as any).from('partner_joint_events').insert(eventsData)
src/src/app/api/showcase/community-partners/route.ts:200:      await (supabase as any).from('partner_impact_metrics').insert(metricsData)
src/src/app/api/showcase/community-partners/route.ts:206:      await (supabase as any).from('partner_testimonials').insert({
src/src/app/api/showcase/university-network/route.ts:66:    const { data: stats } = await (supabase as any).rpc('get_university_network_stats')
src/src/app/api/showcase/university-network/route.ts:196:      await (supabase as any).from('university_campuses').insert(campusesData)
src/src/app/api/showcase/university-network/route.ts:207:      await (supabase as any).from('university_achievements').insert(achievementsData)
src/src/app/api/showcase/university-network/route.ts:218:      await (supabase as any).from('student_organizations').insert(orgsData)
src/src/app/api/showcase/university-network/route.ts:222:    await (supabase as any).rpc('calculate_university_ranks')
src/src/app/api/showcase/university-network/route.ts:297:      await (supabase as any).rpc('calculate_university_ranks')
src/src/app/api/showcase/past-events/route.ts:53:    const { data: statsData } = await (supabase as any).rpc('get_past_events_stats')
src/src/app/api/ab-testing/route.ts:116:    const newTest = await abTesting.createTest(testData as any);
