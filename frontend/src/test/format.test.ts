import { describe, it, expect } from 'vitest'
import { sourceLabel, decodeEntities, timeAgo, matchLabel } from '../lib/format'

describe('sourceLabel', () => {
  it('returns Buscojobs for buscojobs', () => {
    expect(sourceLabel('buscojobs')).toBe('Buscojobs')
  })

  it('returns Jooble for jooble', () => {
    expect(sourceLabel('jooble')).toBe('Jooble')
  })

  it('returns Get on Board for getonbrd', () => {
    expect(sourceLabel('getonbrd')).toBe('Get on Board')
  })

  it('capitalizes unknown source', () => {
    expect(sourceLabel('linkedin')).toBe('Linkedin')
  })
})

describe('decodeEntities', () => {
  it('decodes nbsp', () => {
    expect(decodeEntities('hello&nbsp;world')).toBe('hello world')
  })

  it('decodes ampersand', () => {
    expect(decodeEntities('a&amp;b')).toBe('a&b')
  })

  it('decodes quotes', () => {
    expect(decodeEntities('&quot;hello&quot;')).toBe('"hello"')
  })

  it('decodes ellipsis', () => {
    expect(decodeEntities('wait&hellip;')).toBe('wait...')
  })
})

describe('timeAgo', () => {
  it('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('')
  })

  it('returns Just now for recent time', () => {
    const now = new Date().toISOString()
    expect(timeAgo(now)).toBe('Just now')
  })

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60000).toISOString()
    expect(timeAgo(d)).toBe('5 min ago')
  })
})

describe('matchLabel', () => {
  it('returns null for null score', () => {
    expect(matchLabel(null)).toBeNull()
  })

  it('returns Strong match for high score', () => {
    expect(matchLabel(85)).toBe('Strong match')
  })

  it('returns Good match for medium score', () => {
    expect(matchLabel(60)).toBe('Good match')
  })

  it('returns Low match for low score', () => {
    expect(matchLabel(30)).toBe('Low match')
  })
})
