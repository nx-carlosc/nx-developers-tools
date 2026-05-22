import { describe, it, expect } from 'vitest'
import { branchNameCreator } from '../src/utils/branchNameCreator'

const mockData = {
  project: 'Adecco CDX',
  ticket: 'ADECCOCDX-928',
  title: '"Buzzwords" Feature (all brands, all landingpages)',
  branchInputValue: '$2-$3',
  charReplacerValue: '-',
}

describe('branchNameCreator', () => {
  it('return correct name', () => {
    const branchName = branchNameCreator({ ...mockData })
    expect(branchName).toBe('ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)')
  })

  it('includes type from $0', () => {
    const branchName = branchNameCreator({
      ...mockData,
      type: 'fix',
      branchInputValue: '$0/$2-$3',
    })
    expect(branchName).toBe('fix/ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)')
  })

  it('defaults $0 to empty string when type is omitted', () => {
    const branchName = branchNameCreator({
      ...mockData,
      branchInputValue: '$0$2-$3',
    })
    expect(branchName).toBe('ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)')
  })
})
