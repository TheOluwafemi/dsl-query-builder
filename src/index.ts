import { QueryBuilder } from './query-builder'

export { QueryBuilder } from './query-builder'
export { ValidationError } from './validation'
export * from './types'
export * from './presets'

// Factory function to create a new query builder
export function createQuery(): QueryBuilder {
  return new QueryBuilder()
}

// Specialized factory functions
export function createEcommerceQuery() {
  const { EcommerceQueryBuilder } = require('./presets')
  return new EcommerceQueryBuilder()
}

export function createLogsQuery() {
  const { LogsQueryBuilder } = require('./presets')
  return new LogsQueryBuilder()
}

export function createAnalyticsQuery() {
  const { AnalyticsQueryBuilder } = require('./presets')
  return new AnalyticsQueryBuilder()
}

export function createContentQuery() {
  const { ContentQueryBuilder } = require('./presets')
  return new ContentQueryBuilder()
}
