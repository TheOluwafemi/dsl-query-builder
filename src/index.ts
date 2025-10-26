import { QueryBuilder } from './query-builder'
import { SearchClient } from './search-client'

export { QueryBuilder } from './query-builder'
export { SearchClient } from './search-client'
export * from './types'

// Function to create a new search client
export function createSearchClient(config: import('./types').SearchConfig) {
  return new SearchClient(config)
}

// Function to create a new query builder
export function createQuery() {
  return new QueryBuilder()
}
