import { describe, it, expect } from 'vitest'
import { buildApiParams, ServiceError } from '../services/jobService'
import type { JobQuery } from '../services/jobService'

describe('buildApiParams', () => {
  const baseQuery: JobQuery = {
    page: 1,
    limit: 20,
    sort: 'newest',
    q: '',
    source: '',
    location: '',
    remote: '',
    employmentType: '',
    experience: '',
    company: '',
    skill: '',
    status: '',
    saved: null,
    postedWithin: '',
    discoveredWithin: '',
    hasSalary: false,
  }

  it('includes sort, page, and limit', () => {
    const params = buildApiParams(baseQuery)
    expect(params.get('sort')).toBe('newest')
    expect(params.get('page')).toBe('1')
    expect(params.get('limit')).toBe('20')
  })

  it('maps q parameter', () => {
    const params = buildApiParams({ ...baseQuery, q: 'python' })
    expect(params.get('q')).toBe('python')
  })

  it('maps source to source_only', () => {
    const params = buildApiParams({ ...baseQuery, source: 'jooble' })
    expect(params.get('source_only')).toBe('jooble')
  })

  it('maps location to city', () => {
    const params = buildApiParams({ ...baseQuery, location: 'Montevideo' })
    expect(params.get('city')).toBe('Montevideo')
  })

  it('maps employmentType to job_type', () => {
    const params = buildApiParams({ ...baseQuery, employmentType: 'Full-time' })
    expect(params.get('job_type')).toBe('Full-time')
  })

  it('maps status to user_status', () => {
    const params = buildApiParams({ ...baseQuery, status: 'applied' })
    expect(params.get('user_status')).toBe('applied')
  })

  it('maps saved as string', () => {
    const params = buildApiParams({ ...baseQuery, saved: true })
    expect(params.get('saved')).toBe('true')
  })

  it('omits saved when null', () => {
    const params = buildApiParams({ ...baseQuery, saved: null })
    expect(params.has('saved')).toBe(false)
  })

  it('maps hasSalary as true', () => {
    const params = buildApiParams({ ...baseQuery, hasSalary: true })
    expect(params.get('has_salary')).toBe('true')
  })

  it('omits empty optional params', () => {
    const params = buildApiParams(baseQuery)
    expect(params.has('q')).toBe(false)
    expect(params.has('source_only')).toBe(false)
    expect(params.has('city')).toBe(false)
    expect(params.has('remote')).toBe(false)
  })
})

describe('ServiceError', () => {
  it('has correct name', () => {
    const err = new ServiceError('test error')
    expect(err.name).toBe('ServiceError')
    expect(err.message).toBe('test error')
  })

  it('preserves cause', () => {
    const cause = new Error('original')
    const err = new ServiceError('wrapped', cause)
    expect(err.cause).toBe(cause)
  })
})
