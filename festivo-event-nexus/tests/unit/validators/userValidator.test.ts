import { validateUserProfileUpdate } from '@/lib/validators/userValidator'

describe('userValidator', () => {
  test('validateUserProfileUpdate - happy path', () => {
    const data = { firstName: 'Alice', lastName: 'Smith', email: 'a@b.com', skills: ['js', 'react'] }
    const res = validateUserProfileUpdate(data)
    expect(res.valid).toBe(true)
  })

  test('validateUserProfileUpdate - invalid fields', () => {
    const data = { firstName: 123, skills: 'not-an-array' }
    const res = validateUserProfileUpdate(data)
    expect(res.valid).toBe(false)
    x(res.errors.length).toBeGreaterThanOrEqual(1)
  })
})
