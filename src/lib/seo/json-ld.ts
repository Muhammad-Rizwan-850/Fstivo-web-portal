export function generateEventSchema(event: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    image: event.image_url,
    startDate: event.start_date,
    endDate: event.end_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.is_online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': event.is_online ? 'VirtualLocation' : 'Place',
      name: event.venue_name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address,
        addressLocality: event.city,
        addressRegion: event.region,
        addressCountry: 'PK',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer_name,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/organizers/${event.organizer_id}`,
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}`,
      price: event.price,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      validFrom: event.sales_start_date,
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FSTIVO',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    description: 'Pakistan\'s leading event management and ticketing platform',
    sameAs: [
      'https://facebook.com/fstivo',
      'https://twitter.com/fstivo',
      'https://instagram.com/fstivo',
      'https://linkedin.com/company/fstivo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+92-300-1234567',
      contactType: 'customer support',
      email: 'support@fstivo.com',
      availableLanguage: ['English', 'Urdu'],
    },
  };
}
