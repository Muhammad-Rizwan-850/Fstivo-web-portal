import OpenAI from 'openai'
import { logger } from '@/lib/logger';

let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

export interface VolunteerProfile {
  id: string
  full_name: string
  skills: string[]
  experience?: number
  bio?: string
  location?: string
  availability?: string[]
}

export interface EventRequirement {
  event_id: string
  title: string
  description: string
  required_skills: string[]
  time_commitment: string
  location?: string
}

export interface MatchResult {
  volunteer_id: string
  volunteer_name: string
  confidence_score: number
  reasoning: string
  matched_skills: string[]
}

export async function matchVolunteersToEvent(
  event: EventRequirement,
  availableVolunteers: VolunteerProfile[]
): Promise<MatchResult[]> {
  const prompt = `
You are an expert volunteer matching system. Analyze the event requirements and available volunteers,
then return the top 10 matches with confidence scores (0-100).

EVENT REQUIREMENTS:
- Title: ${event.title}
- Description: ${event.description}
- Required Skills: ${event.required_skills.join(', ')}
- Time Commitment: ${event.time_commitment}
- Location: ${event.location || 'Remote/Various'}

AVAILABLE VOLUNTEERS:
${availableVolunteers.map((v, i) => `
${i + 1}. ${v.full_name}
   Skills: ${v.skills.join(', ')}
   Experience: ${v.experience || 'N/A'} years
   Bio: ${v.bio || 'N/A'}
   Location: ${v.location || 'N/A'}
   Availability: ${v.availability?.join(', ') || 'N/A'}
`).join('\n')}

IMPORTANT: Return ONLY a valid JSON array. Do not include any explanatory text before or after the JSON.
The response must start with '[' and end with ']'.

Format:
[
  {
    "volunteer_id": "string",
    "volunteer_name": "string",
    "confidence_score": number (0-100),
    "reasoning": "string (explain why this volunteer is a good match)",
    "matched_skills": ["string"]
  }
]

Rules:
1. Prioritize skill match above all else
2. Consider location proximity if event is in-person
3. Factor in experience level
4. Consider availability
5. Only return volunteers with confidence_score >= 50
6. Sort by confidence_score descending
7. Maximum 10 results
`

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Always respond with valid JSON only, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content in response')
    }

    const parsed = JSON.parse(content)

    // Handle case where AI returns { matches: [...] } instead of [...]
    const matches = Array.isArray(parsed) ? parsed : parsed.matches || []

    return matches.slice(0, 10)
  } catch (error) {
    logger.error('OpenAI API error:', error)
    throw new Error('Failed to match volunteers')
  }
}

export async function generateVolunteerRecommendations(
  volunteerId: string,
  volunteerSkills: string[],
  volunteerLocation?: string
): Promise<string[]> {
  // Get user profile first
  // Then generate recommendations based on skills and preferences
  const prompt = `
Based on the following volunteer profile, suggest 5 types of events they would be most interested in:

VOLUNTEER PROFILE:
- Skills: ${volunteerSkills.join(', ')}
- Location: ${volunteerLocation || 'Remote'}

Provide 5 event recommendations that match their skills and location.
Return only a JSON array of event type strings.

Format: ["event type 1", "event type 2", ...]
`

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const content = response.choices[0].message.content
    if (!content) return []

    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    logger.error('OpenAI recommendation error:', error)
    return []
  }
}

export async function analyzeEventDescription(description: string): Promise<{
  suggestedSkills: string[]
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedVolunteersNeeded: number
}> {
  const prompt = `
Analyze this event description and extract key information:

EVENT DESCRIPTION:
${description}

Return a JSON object with:
1. suggestedSkills: array of 5-10 relevant skills needed
2. difficultyLevel: "beginner", "intermediate", or "advanced"
3. estimatedVolunteersNeeded: estimated number (integer)

Format:
{
  "suggestedSkills": ["skill1", "skill2", ...],
  "difficultyLevel": "intermediate",
  "estimatedVolunteersNeeded": 10
}
`

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      return {
        suggestedSkills: [],
        difficultyLevel: 'intermediate',
        estimatedVolunteersNeeded: 5,
      }
    }

    return JSON.parse(content)
  } catch (error) {
    logger.error('OpenAI analysis error:', error)
    return {
      suggestedSkills: [],
      difficultyLevel: 'intermediate',
      estimatedVolunteersNeeded: 5,
    }
  }
}
