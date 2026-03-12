// Event Categories and Fields Configuration
// This file contains the multi-field category system for Fstivo

export interface EventCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  color: string
  bgColor: string
  displayOrder: number
}

export interface EventField {
  id: string
  categoryId: string
  name: string
  slug: string
  keywords: string[]
  industryTags: string[]
  description: string
}

// Main Categories
export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    icon: '💻',
    description: 'Technology events, hackathons, workshops',
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    displayOrder: 1
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    icon: '💼',
    description: 'Business conferences, career fairs, networking',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    displayOrder: 2
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    slug: 'healthcare',
    icon: '🏥',
    description: 'Healthcare symposiums, medical events',
    color: '#ef4444',
    bgColor: 'bg-red-50',
    displayOrder: 3
  },
  {
    id: 'engineering',
    name: 'Engineering',
    slug: 'engineering',
    icon: '⚙️',
    description: 'Engineering expos, technical workshops',
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    displayOrder: 4
  },
  {
    id: 'arts-design',
    name: 'Arts & Design',
    slug: 'arts-design',
    icon: '🎨',
    description: 'Arts exhibitions, design conferences',
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    displayOrder: 5
  },
  {
    id: 'sciences',
    name: 'Sciences',
    slug: 'sciences',
    icon: '🔬',
    description: 'Science fairs, research symposiums',
    color: '#10b981',
    bgColor: 'bg-green-50',
    displayOrder: 6
  },
  {
    id: 'social-impact',
    name: 'Social Impact',
    slug: 'social-impact',
    icon: '🌍',
    description: 'Social impact events, community service',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50',
    displayOrder: 7
  }
]

// Fields/Subcategories
export const EVENT_FIELDS: EventField[] = [
  // Technology
  {
    id: 'software-dev',
    categoryId: 'technology',
    name: 'Software Development',
    slug: 'software-dev',
    keywords: ['coding', 'programming', 'web', 'app', 'software'],
    industryTags: ['IT', 'Software', 'Tech'],
    description: 'Programming, web development, mobile apps'
  },
  {
    id: 'data-ai',
    categoryId: 'technology',
    name: 'Data & AI',
    slug: 'data-ai',
    keywords: ['AI', 'machine learning', 'data', 'analytics'],
    industryTags: ['AI', 'Data Science', 'ML'],
    description: 'Artificial intelligence, machine learning, data science'
  },
  {
    id: 'cloud-devops',
    categoryId: 'technology',
    name: 'Cloud & DevOps',
    slug: 'cloud-devops',
    keywords: ['cloud', 'aws', 'azure', 'devops', 'infrastructure'],
    industryTags: ['Cloud', 'DevOps', 'Infrastructure'],
    description: 'Cloud computing, DevOps, infrastructure'
  },
  {
    id: 'cybersecurity',
    categoryId: 'technology',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    keywords: ['security', 'hacking', 'cyber', 'network'],
    industryTags: ['Cybersecurity', 'Security'],
    description: 'Information security, ethical hacking'
  },

  // Business
  {
    id: 'entrepreneurship',
    categoryId: 'business',
    name: 'Entrepreneurship',
    slug: 'entrepreneurship',
    keywords: ['startup', 'entrepreneur', 'pitch', 'funding'],
    industryTags: ['Startups', 'Venture Capital'],
    description: 'Startup events, pitch competitions, funding'
  },
  {
    id: 'finance',
    categoryId: 'business',
    name: 'Finance & Banking',
    slug: 'finance',
    keywords: ['finance', 'banking', 'investment', 'trading'],
    industryTags: ['Finance', 'Banking', 'Investment'],
    description: 'Finance, banking, investment, trading'
  },
  {
    id: 'marketing',
    categoryId: 'business',
    name: 'Marketing & Sales',
    slug: 'marketing',
    keywords: ['marketing', 'sales', 'branding', 'digital'],
    industryTags: ['Marketing', 'Sales', 'Branding'],
    description: 'Marketing strategies, sales, branding'
  },
  {
    id: 'management',
    categoryId: 'business',
    name: 'Management & Leadership',
    slug: 'management',
    keywords: ['management', 'leadership', 'mba', 'executive'],
    industryTags: ['Management', 'Leadership', 'MBA'],
    description: 'Business management, leadership, MBA'
  },

  // Healthcare
  {
    id: 'medicine',
    categoryId: 'healthcare',
    name: 'Medicine',
    slug: 'medicine',
    keywords: ['medical', 'doctor', 'physician', 'healthcare'],
    industryTags: ['Healthcare', 'Medical'],
    description: 'Medical conferences, healthcare events'
  },
  {
    id: 'pharmacy',
    categoryId: 'healthcare',
    name: 'Pharmaceutical',
    slug: 'pharmacy',
    keywords: ['pharmacy', 'pharmaceutical', 'drug', 'medicine'],
    industryTags: ['Pharmacy', 'Pharmaceutical'],
    description: 'Pharmacy, pharmaceutical sciences'
  },
  {
    id: 'nursing',
    categoryId: 'healthcare',
    name: 'Nursing & Allied Health',
    slug: 'nursing',
    keywords: ['nursing', 'allied', 'health', 'medical'],
    industryTags: ['Nursing', 'Allied Health'],
    description: 'Nursing, allied health professions'
  },
  {
    id: 'health-tech',
    categoryId: 'healthcare',
    name: 'Health Tech',
    slug: 'health-tech',
    keywords: ['health tech', 'medical devices', 'digital health'],
    industryTags: ['HealthTech', 'Medical Devices'],
    description: 'Healthcare technology, medical devices'
  },

  // Engineering
  {
    id: 'civil-engineering',
    categoryId: 'engineering',
    name: 'Civil Engineering',
    slug: 'civil-engineering',
    keywords: ['civil', 'construction', 'infrastructure'],
    industryTags: ['Construction', 'Infrastructure'],
    description: 'Civil engineering, construction'
  },
  {
    id: 'electrical-engineering',
    categoryId: 'engineering',
    name: 'Electrical Engineering',
    slug: 'electrical-engineering',
    keywords: ['electrical', 'electronics', 'power'],
    industryTags: ['Electrical', 'Electronics'],
    description: 'Electrical engineering, electronics'
  },
  {
    id: 'mechanical-engineering',
    categoryId: 'engineering',
    name: 'Mechanical Engineering',
    slug: 'mechanical-engineering',
    keywords: ['mechanical', 'manufacturing', 'automotive'],
    industryTags: ['Manufacturing', 'Automotive'],
    description: 'Mechanical engineering, manufacturing'
  },
  {
    id: 'chemical-engineering',
    categoryId: 'engineering',
    name: 'Chemical Engineering',
    slug: 'chemical-engineering',
    keywords: ['chemical', 'process', 'industrial'],
    industryTags: ['Chemical', 'Process'],
    description: 'Chemical engineering, process industries'
  },

  // Arts & Design
  {
    id: 'graphic-design',
    categoryId: 'arts-design',
    name: 'Graphic Design',
    slug: 'graphic-design',
    keywords: ['graphic', 'design', 'ui', 'ux', 'visual'],
    industryTags: ['Design', 'UI/UX'],
    description: 'Graphic design, UI/UX, visual design'
  },
  {
    id: 'fine-arts',
    categoryId: 'arts-design',
    name: 'Fine Arts',
    slug: 'fine-arts',
    keywords: ['painting', 'sculpture', 'art', 'fine arts'],
    industryTags: ['Arts', 'Fine Arts'],
    description: 'Painting, sculpture, fine arts'
  },
  {
    id: 'fashion',
    categoryId: 'arts-design',
    name: 'Fashion & Design',
    slug: 'fashion',
    keywords: ['fashion', 'design', 'textile', 'apparel'],
    industryTags: ['Fashion', 'Textile'],
    description: 'Fashion design, textile, apparel'
  },
  {
    id: 'media-arts',
    categoryId: 'arts-design',
    name: 'Media & Film',
    slug: 'media-arts',
    keywords: ['film', 'media', 'photography', 'video'],
    industryTags: ['Media', 'Film', 'Photography'],
    description: 'Film, media, photography, videography'
  },

  // Sciences
  {
    id: 'physics',
    categoryId: 'sciences',
    name: 'Physics',
    slug: 'physics',
    keywords: ['physics', 'quantum', 'mechanics'],
    industryTags: ['Physics', 'Research'],
    description: 'Physics, quantum mechanics, research'
  },
  {
    id: 'chemistry',
    categoryId: 'sciences',
    name: 'Chemistry',
    slug: 'chemistry',
    keywords: ['chemistry', 'biochemistry', 'materials'],
    industryTags: ['Chemistry', 'Research'],
    description: 'Chemistry, biochemistry, materials'
  },
  {
    id: 'biology',
    categoryId: 'sciences',
    name: 'Biology & Life Sciences',
    slug: 'biology',
    keywords: ['biology', 'biotech', 'genetics', 'life sciences'],
    industryTags: ['Biology', 'Biotech'],
    description: 'Biology, biotechnology, life sciences'
  },
  {
    id: 'mathematics',
    categoryId: 'sciences',
    name: 'Mathematics & Statistics',
    slug: 'mathematics',
    keywords: ['math', 'statistics', 'data'],
    industryTags: ['Mathematics', 'Statistics'],
    description: 'Mathematics, statistics, data science'
  },

  // Social Impact
  {
    id: 'environment',
    categoryId: 'social-impact',
    name: 'Environment & Sustainability',
    slug: 'environment',
    keywords: ['environment', 'climate', 'sustainability', 'green'],
    industryTags: ['Environment', 'Climate', 'Sustainability'],
    description: 'Environmental issues, climate change, sustainability'
  },
  {
    id: 'education',
    categoryId: 'social-impact',
    name: 'Education',
    slug: 'education',
    keywords: ['education', 'teaching', 'learning', 'edtech'],
    industryTags: ['Education', 'EdTech'],
    description: 'Education, teaching, learning, EdTech'
  },
  {
    id: 'community-service',
    categoryId: 'social-impact',
    name: 'Community Service',
    slug: 'community-service',
    keywords: ['volunteer', 'community', 'service', 'ngo'],
    industryTags: ['NGO', 'Nonprofit'],
    description: 'Volunteering, community service, NGO work'
  },
  {
    id: 'social-justice',
    categoryId: 'social-impact',
    name: 'Social Justice',
    slug: 'social-justice',
    keywords: ['human rights', 'justice', 'advocacy'],
    industryTags: ['Human Rights', 'Advocacy'],
    description: 'Human rights, social justice, advocacy'
  }
]

// Helper functions
export function getCategoryById(id: string): EventCategory | undefined {
  return EVENT_CATEGORIES.find(cat => cat.id === id)
}

export function getCategoryBySlug(slug: string): EventCategory | undefined {
  return EVENT_CATEGORIES.find(cat => cat.slug === slug)
}

export function getFieldsByCategory(categoryId: string): EventField[] {
  return EVENT_FIELDS.filter(field => field.categoryId === categoryId)
}

export function getAllFields(): EventField[] {
  return EVENT_FIELDS
}

export function getFieldById(id: string): EventField | undefined {
  return EVENT_FIELDS.find(field => field.id === id)
}

export function searchFieldsByKeyword(keyword: string): EventField[] {
  const lowerKeyword = keyword.toLowerCase()
  return EVENT_FIELDS.filter(field =>
    field.name.toLowerCase().includes(lowerKeyword) ||
    field.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
    field.industryTags.some(t => t.toLowerCase().includes(lowerKeyword))
  )
}
