import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'

test('CATEGORIES has 7 items each with key and emoji', () => {
  expect(CATEGORIES).toHaveLength(7)
  CATEGORIES.forEach(cat => {
    expect(cat).toHaveProperty('key')
    expect(cat).toHaveProperty('emoji')
    expect(typeof cat.key).toBe('string')
    expect(typeof cat.emoji).toBe('string')
  })
})

test('CATEGORIES keys are the expected values', () => {
  const keys = CATEGORIES.map(c => c.key)
  expect(keys).toEqual([
    'plombier', 'electricien', 'climaticien',
    'frigoriste', 'peintre', 'menuisier', 'informaticien'
  ])
})

test('WILAYAS has 58 strings', () => {
  expect(WILAYAS).toHaveLength(58)
  WILAYAS.forEach(w => expect(typeof w).toBe('string'))
})

test('WILAYAS includes the 5 seed cities', () => {
  expect(WILAYAS).toContain('Alger')
  expect(WILAYAS).toContain('Oran')
  expect(WILAYAS).toContain('Constantine')
  expect(WILAYAS).toContain('Béjaïa')
  expect(WILAYAS).toContain('Mostaganem')
})
