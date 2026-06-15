import { describe, expect, it } from 'vitest'
import { dynamic } from '@/app/api/stats/route'

describe('stats route caching', () => {
  it('forces dynamic rendering so dashboard stats reflect newly created tasks', () => {
    expect(dynamic).toBe('force-dynamic')
  })
})
