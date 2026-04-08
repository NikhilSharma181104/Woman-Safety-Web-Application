// Feature: safetnet, Property: sample
import * as fc from 'fast-check'
import { describe, it } from 'vitest'

describe('sample property-based test', () => {
  it('string length is non-negative', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0
      })
    )
  })
})
