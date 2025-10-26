/**
 * Validation utilities for query builder and search client
 */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateSearchConfig(config: any): void {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Search config must be an object')
  }

  if (!config.endpoint || typeof config.endpoint !== 'string') {
    throw new ValidationError(
      'endpoint is required and must be a string',
      'endpoint'
    )
  }

  try {
    new URL(config.endpoint)
  } catch {
    throw new ValidationError('endpoint must be a valid URL', 'endpoint')
  }

  if (
    config.retries !== undefined &&
    (!Number.isInteger(config.retries) || config.retries < 0)
  ) {
    throw new ValidationError(
      'retries must be a non-negative integer',
      'retries'
    )
  }

  if (
    config.timeout !== undefined &&
    (!Number.isInteger(config.timeout) || config.timeout <= 0)
  ) {
    throw new ValidationError('timeout must be a positive integer', 'timeout')
  }
}

export function validateRangeQuery(range: any): void {
  if (!range || typeof range !== 'object') {
    throw new ValidationError('Range query must be an object')
  }

  const validKeys = ['gte', 'gt', 'lte', 'lt', 'boost']
  const providedKeys = Object.keys(range)

  if (providedKeys.length === 0) {
    throw new ValidationError('Range query must have at least one condition')
  }

  const invalidKeys = providedKeys.filter((key) => !validKeys.includes(key))
  if (invalidKeys.length > 0) {
    throw new ValidationError(
      `Invalid range query keys: ${invalidKeys.join(', ')}`
    )
  }

  // Check for conflicting conditions
  if (
    (range.gte !== undefined && range.gt !== undefined) ||
    (range.lte !== undefined && range.lt !== undefined)
  ) {
    throw new ValidationError(
      'Range query cannot have conflicting conditions (gte/gt or lte/lt)'
    )
  }
}

export function validateFieldName(field: string, context: string): void {
  if (!field || typeof field !== 'string') {
    throw new ValidationError(
      `Field name is required and must be a string in ${context}`
    )
  }

  if (field.trim().length === 0) {
    throw new ValidationError(`Field name cannot be empty in ${context}`)
  }
}

export function validateSortOrder(order: any): void {
  if (order !== 'asc' && order !== 'desc') {
    throw new ValidationError('Sort order must be "asc" or "desc"')
  }
}

export function validatePaginationParams(
  from?: number,
  size?: number,
  field?: string
): void {
  if (from !== undefined && (!Number.isInteger(from) || from < 0)) {
    throw new ValidationError(
      'from parameter must be a non-negative integer',
      field
    )
  }

  // Allow size(0) for aggregation-only queries, but reject negative sizes
  if (size !== undefined && (!Number.isInteger(size) || size < 0)) {
    throw new ValidationError(
      'size parameter must be a non-negative integer',
      field
    )
  }

  if (size !== undefined && size > 10000) {
    throw new ValidationError(
      'size parameter cannot exceed 10000 (Elasticsearch limit)',
      field
    )
  }
}

export function validateArray(arr: any, context: string, minLength = 1): void {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${context} must be an array`)
  }

  if (arr.length < minLength) {
    throw new ValidationError(
      `${context} must have at least ${minLength} item(s)`
    )
  }
}

export function validateStringArray(arr: any, context: string): void {
  validateArray(arr, context)

  if (
    !arr.every(
      (item: any) => typeof item === 'string' && item.trim().length > 0
    )
  ) {
    throw new ValidationError(`${context} must contain only non-empty strings`)
  }
}

export function validateIndexName(index: any, context: string): void {
  if (!index || typeof index !== 'string') {
    throw new ValidationError(
      `Index name is required and must be a string in ${context}`
    )
  }

  if (index.trim().length === 0) {
    throw new ValidationError(`Index name cannot be empty in ${context}`)
  }

  // Elasticsearch index naming rules
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(index)) {
    throw new ValidationError(
      `Invalid index name "${index}". Must start with lowercase letter or number and contain only lowercase letters, numbers, dots, hyphens, and underscores`
    )
  }

  if (index.length > 255) {
    throw new ValidationError(
      `Index name "${index}" exceeds maximum length of 255 characters`
    )
  }
}

export function validateQueryValue(value: any, context: string): void {
  if (value === null || value === undefined) {
    throw new ValidationError(
      `Query value cannot be null or undefined in ${context}`
    )
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    throw new ValidationError(
      `Query value cannot be empty string in ${context}`
    )
  }
}

export function validateMultiMatchType(type: any): void {
  const validTypes = [
    'best_fields',
    'most_fields',
    'cross_fields',
    'phrase',
    'phrase_prefix',
    'bool_prefix',
  ]

  if (type !== undefined && !validTypes.includes(type)) {
    throw new ValidationError(
      `Invalid multi_match type "${type}". Valid types are: ${validTypes.join(
        ', '
      )}`
    )
  }
}

export function validateAggregationName(name: any): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Aggregation name must be a non-empty string')
  }

  if (name.trim().length === 0) {
    throw new ValidationError('Aggregation name cannot be empty')
  }
}

export function validateMsearchQueries(searches: any): void {
  if (!Array.isArray(searches)) {
    throw new ValidationError('msearch queries must be an array')
  }

  if (searches.length === 0) {
    throw new ValidationError('msearch queries array cannot be empty')
  }

  if (searches.length > 100) {
    throw new ValidationError(
      'msearch queries cannot exceed 100 searches per request'
    )
  }

  searches.forEach((search, index) => {
    if (!search || typeof search !== 'object') {
      throw new ValidationError(
        `msearch item at index ${index} must be an object`
      )
    }

    if (!search.query) {
      throw new ValidationError(
        `msearch item at index ${index} must have a query property`
      )
    }
  })
}
