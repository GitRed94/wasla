import { CATEGORIES, CATEGORY_CLUSTERS, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'

test('CATEGORIES has 19 items each with key, emoji, and cluster', () => {
  expect(CATEGORIES).toHaveLength(19)
  CATEGORIES.forEach(cat => {
    expect(cat).toHaveProperty('key')
    expect(cat).toHaveProperty('emoji')
    expect(cat).toHaveProperty('cluster')
    expect(typeof cat.key).toBe('string')
    expect(typeof cat.emoji).toBe('string')
    expect(typeof cat.cluster).toBe('string')
  })
})

test('CATEGORIES keys are the expected 19 values', () => {
  const keys = CATEGORIES.map(c => c.key)
  expect(keys).toEqual([
    'plombier', 'electricien', 'climaticien', 'frigoriste',
    'macon', 'carreleur', 'etancheur',
    'peintre', 'platrier', 'menuisier', 'menuisier_alu', 'serrurier', 'vitrier',
    'cameras', 'alarmes',
    'electromenager', 'panneaux_solaires',
    'informaticien', 'reparation_telephone',
  ])
})

test('CATEGORY_CLUSTERS has 8 items each with key and label', () => {
  expect(CATEGORY_CLUSTERS).toHaveLength(8)
  CATEGORY_CLUSTERS.forEach(c => {
    expect(c).toHaveProperty('key')
    expect(c).toHaveProperty('label')
  })
})

test('INCOMPATIBLE_PAIRS is an array of [key, key] pairs', () => {
  expect(Array.isArray(INCOMPATIBLE_PAIRS)).toBe(true)
  expect(INCOMPATIBLE_PAIRS.length).toBeGreaterThan(0)
  INCOMPATIBLE_PAIRS.forEach(pair => {
    expect(pair).toHaveLength(2)
    const keys = CATEGORIES.map(c => c.key)
    expect(keys).toContain(pair[0])
    expect(keys).toContain(pair[1])
  })
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
