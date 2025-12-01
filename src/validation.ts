/**
 * Enhanced validation utilities with better error tracking
 */

export class ValidationError extends Error {
  public readonly code: string
  public readonly context: string
  public readonly details: any
  public readonly originalMessage: string

  constructor(
    message: string,
    public field?: string,
    code?: string,
    context?: string,
    details?: any
  ) {
    super(message)
    this.name = 'ValidationError'
    this.originalMessage = message
    this.code = code || 'VALIDATION_ERROR'
    this.context = context || 'unknown'
    this.details = details

    // Keep the original message for compatibility with tests
    this.message = message
  }

  // Method to get enhanced error message with context and code for debugging
  getEnhancedMessage(): string {
    if (this.field || this.context !== 'unknown') {
      const contextInfo = [this.field, this.context]
        .filter(Boolean)
        .join(' in ')
      return `${this.originalMessage} (${contextInfo}) [Code: ${this.code}]`
    } else {
      return `${this.originalMessage} [Code: ${this.code}]`
    }
  }

  // Method to get structured error information for logging
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      originalMessage: this.originalMessage,
      enhancedMessage: this.getEnhancedMessage(),
      code: this.code,
      field: this.field,
      context: this.context,
      details: this.details,
      stack: this.stack,
    }
  }
}

// Safe helper to get error message from unknown error
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return String(error)
}

export function validateSearchConfig(config: any): void {
  const context = 'validateSearchConfig'

  if (!config || typeof config !== 'object') {
    throw new ValidationError(
      'Search config must be an object',
      'config',
      'CONFIG_NOT_OBJECT',
      context,
      { receivedType: typeof config, receivedValue: config }
    )
  }

  if (!config.endpoint || typeof config.endpoint !== 'string') {
    throw new ValidationError(
      'endpoint is required and must be a string',
      'endpoint',
      'ENDPOINT_REQUIRED',
      context,
      { endpoint: config.endpoint, type: typeof config.endpoint }
    )
  }

  try {
    new URL(config.endpoint)
  } catch (urlError) {
    throw new ValidationError(
      'endpoint must be a valid URL',
      'endpoint',
      'INVALID_URL',
      context,
      { endpoint: config.endpoint, urlError: getErrorMessage(urlError) }
    )
  }

  if (config.retries !== undefined) {
    if (!Number.isInteger(config.retries) || config.retries < 0) {
      throw new ValidationError(
        'retries must be a non-negative integer',
        'retries',
        'INVALID_RETRIES',
        context,
        { retries: config.retries, type: typeof config.retries }
      )
    }
  }

  if (config.timeout !== undefined) {
    if (!Number.isInteger(config.timeout) || config.timeout <= 0) {
      throw new ValidationError(
        'timeout must be a positive integer',
        'timeout',
        'INVALID_TIMEOUT',
        context,
        { timeout: config.timeout, type: typeof config.timeout }
      )
    }
  }

  if (config.tokenType !== undefined) {
    // Use explicit check instead of array.includes to avoid potential undefined errors
    const validTokenTypes = ['bearer', 'raw']
    if (
      typeof config.tokenType !== 'string' ||
      !validTokenTypes.includes(config.tokenType)
    ) {
      throw new ValidationError(
        'tokenType must be either "bearer" or "raw"',
        'tokenType',
        'INVALID_TOKEN_TYPE',
        context,
        {
          tokenType: config.tokenType,
          type: typeof config.tokenType,
          validOptions: validTokenTypes,
        }
      )
    }
  }
}

export function validateRangeQuery(range: any): void {
  const context = 'validateRangeQuery'

  if (!range || typeof range !== 'object') {
    throw new ValidationError(
      'Range query must be an object',
      'range',
      'RANGE_NOT_OBJECT',
      context,
      { receivedType: typeof range, receivedValue: range }
    )
  }

  const validKeys = ['gte', 'gt', 'lte', 'lt', 'boost']
  const providedKeys = Object.keys(range)

  if (providedKeys.length === 0) {
    throw new ValidationError(
      'Range query must have at least one condition',
      'range',
      'RANGE_EMPTY',
      context,
      { range }
    )
  }

  const invalidKeys = providedKeys.filter((key) => !validKeys.includes(key))
  if (invalidKeys.length > 0) {
    throw new ValidationError(
      `Invalid range query keys: ${invalidKeys.join(', ')}`,
      'range',
      'INVALID_RANGE_KEYS',
      context,
      { invalidKeys, validKeys, providedKeys }
    )
  }

  // Check for conflicting conditions
  if (
    (range.gte !== undefined && range.gt !== undefined) ||
    (range.lte !== undefined && range.lt !== undefined)
  ) {
    throw new ValidationError(
      'Range query cannot have conflicting conditions (gte/gt or lte/lt)',
      'range',
      'CONFLICTING_RANGE_CONDITIONS',
      context,
      {
        range,
        conflicts: {
          gte: range.gte,
          gt: range.gt,
          lte: range.lte,
          lt: range.lt,
        },
      }
    )
  }
}

export function validateFieldName(field: string, methodContext: string): void {
  const context = `validateFieldName:${methodContext}`

  if (!field || typeof field !== 'string') {
    throw new ValidationError(
      `Field name is required and must be a string in ${methodContext}`,
      'field',
      'FIELD_NAME_REQUIRED',
      context,
      { field, type: typeof field, methodContext }
    )
  }

  if (field.trim().length === 0) {
    throw new ValidationError(
      `Field name cannot be empty in ${methodContext}`,
      'field',
      'FIELD_NAME_EMPTY',
      context,
      { field, methodContext }
    )
  }
}

export function validateIndexName(index: any, methodContext: string): void {
  const context = `validateIndexName:${methodContext}`

  if (!index || typeof index !== 'string') {
    throw new ValidationError(
      `Index name is required and must be a string in ${methodContext}`,
      'index',
      'INDEX_NAME_REQUIRED',
      context,
      { index, type: typeof index, methodContext }
    )
  }

  if (index.trim().length === 0) {
    throw new ValidationError(
      `Index name cannot be empty in ${methodContext}`,
      'index',
      'INDEX_NAME_EMPTY',
      context,
      { index, methodContext }
    )
  }

  // Elasticsearch index naming rules with detailed error
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(index)) {
    throw new ValidationError(
      `Invalid index name "${index}". Must start with lowercase letter or number and contain only lowercase letters, numbers, dots, hyphens, and underscores`,
      'index',
      'INVALID_INDEX_NAME',
      context,
      { index, pattern: '^[a-z0-9][a-z0-9._-]*$', methodContext }
    )
  }

  if (index.length > 255) {
    throw new ValidationError(
      `Index name "${index}" exceeds maximum length of 255 characters`,
      'index',
      'INDEX_NAME_TOO_LONG',
      context,
      { index, length: index.length, maxLength: 255, methodContext }
    )
  }
}

// Enhanced error context for debugging
export function createErrorContext(operation: string, params: any = {}) {
  return {
    operation,
    timestamp: new Date().toISOString(),
    params,
    stack: new Error().stack,
  }
}

// Utility to wrap validation functions with enhanced error context
export function withValidationContext<T extends any[], R>(
  fn: (...args: T) => R,
  fnName: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args)
    } catch (error) {
      if (error instanceof ValidationError) {
        // Re-throw with enhanced context
        throw new ValidationError(
          error.message,
          error.field,
          error.code,
          `${fnName}:${error.context}`,
          {
            ...error.details,
            originalContext: error.context,
            wrapperFunction: fnName,
            args,
          }
        )
      }
      throw new ValidationError(
        `Unexpected error in ${fnName}: ${getErrorMessage(error)}`,
        undefined,
        'UNEXPECTED_VALIDATION_ERROR',
        fnName,
        {
          functionName: fnName,
          originalError: getErrorMessage(error),
          args,
        }
      )
    }
  }
}

export function validateSortOrder(order: any): void {
  const context = 'validateSortOrder'

  if (order !== 'asc' && order !== 'desc') {
    throw new ValidationError(
      'Sort order must be "asc" or "desc"',
      'order',
      'INVALID_SORT_ORDER',
      context,
      { order, type: typeof order, validOptions: ['asc', 'desc'] }
    )
  }
}

export function validatePaginationParams(
  from?: any,
  size?: any,
  context?: string
): void {
  const validationContext = context || 'validatePaginationParams'

  if (from !== undefined) {
    if (!Number.isInteger(from) || from < 0) {
      throw new ValidationError(
        'from parameter must be a non-negative integer',
        'from',
        'INVALID_FROM_PARAM',
        validationContext,
        { from, type: typeof from }
      )
    }
  }

  if (size !== undefined) {
    if (!Number.isInteger(size) || size < 0) {
      throw new ValidationError(
        'size parameter must be a non-negative integer',
        'size',
        'INVALID_SIZE_PARAM',
        validationContext,
        { size, type: typeof size }
      )
    }

    if (size > 10000) {
      throw new ValidationError(
        'size parameter cannot exceed 10000 (Elasticsearch limit)',
        'size',
        'SIZE_EXCEEDS_LIMIT',
        validationContext,
        { size, limit: 10000 }
      )
    }
  }
}

export function validateArray(
  array: any,
  fieldName: string,
  minLength = 1
): void {
  const context = `validateArray:${fieldName}`

  if (!Array.isArray(array)) {
    throw new ValidationError(
      `${fieldName} must be an array`,
      fieldName,
      'NOT_AN_ARRAY',
      context,
      { array, type: typeof array }
    )
  }

  if (array.length < minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${minLength} item(s)`,
      fieldName,
      'INSUFFICIENT_ARRAY_LENGTH',
      context,
      { array, length: array.length, minLength }
    )
  }
}

export function validateStringArray(array: any, fieldName: string): void {
  const context = `validateStringArray:${fieldName}`

  validateArray(array, fieldName)

  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new ValidationError(
        `${fieldName} must contain only non-empty strings`,
        fieldName,
        'INVALID_STRING_ARRAY_ITEM',
        context,
        { array, invalidItem: item, invalidIndex: i, type: typeof item }
      )
    }
  }
}

export function validateQueryValue(value: any, methodContext: string): void {
  const context = `validateQueryValue:${methodContext}`

  if (value === null || value === undefined) {
    throw new ValidationError(
      `Query value cannot be null or undefined in ${methodContext}`,
      'value',
      'NULL_OR_UNDEFINED_QUERY_VALUE',
      context,
      { value, methodContext }
    )
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    throw new ValidationError(
      `Query value cannot be empty string in ${methodContext}`,
      'value',
      'EMPTY_STRING_QUERY_VALUE',
      context,
      { value, methodContext }
    )
  }
}

export function validateMultiMatchType(type?: any): void {
  const context = 'validateMultiMatchType'

  if (type === undefined) {
    return // undefined is allowed
  }

  const validTypes = [
    'best_fields',
    'most_fields',
    'cross_fields',
    'phrase',
    'phrase_prefix',
    'bool_prefix',
  ]

  if (typeof type !== 'string' || !validTypes.includes(type)) {
    throw new ValidationError(
      `Invalid multi_match type: ${type}. Valid types are: ${validTypes.join(
        ', '
      )}`,
      'type',
      'INVALID_MULTI_MATCH_TYPE',
      context,
      { type, validTypes }
    )
  }
}

export function validateAggregationName(name: any): void {
  const context = 'validateAggregationName'

  if (!name || typeof name !== 'string') {
    throw new ValidationError(
      'Aggregation name must be a non-empty string',
      'name',
      'INVALID_AGGREGATION_NAME',
      context,
      { name, type: typeof name }
    )
  }

  if (name.trim().length === 0) {
    throw new ValidationError(
      'Aggregation name cannot be empty',
      'name',
      'EMPTY_AGGREGATION_NAME',
      context,
      { name }
    )
  }
}

export function validateMsearchQueries(queries: any): void {
  const context = 'validateMsearchQueries'

  if (!Array.isArray(queries)) {
    throw new ValidationError(
      'msearch queries must be an array',
      'queries',
      'MSEARCH_NOT_ARRAY',
      context,
      { queries, type: typeof queries }
    )
  }

  if (queries.length === 0) {
    throw new ValidationError(
      'msearch queries array cannot be empty',
      'queries',
      'MSEARCH_EMPTY_ARRAY',
      context,
      { queries }
    )
  }

  if (queries.length > 100) {
    throw new ValidationError(
      'msearch queries cannot exceed 100 searches per request',
      'queries',
      'MSEARCH_TOO_MANY_QUERIES',
      context,
      { queries, length: queries.length, maxLength: 100 }
    )
  }

  queries.forEach((query: any, index: number) => {
    if (!query || typeof query !== 'object') {
      throw new ValidationError(
        `msearch item at index ${index} must be an object`,
        'queries',
        'MSEARCH_INVALID_ITEM',
        context,
        { query, index, type: typeof query }
      )
    }

    if (!query.query) {
      throw new ValidationError(
        `msearch item at index ${index} must have a query property`,
        'queries',
        'MSEARCH_MISSING_QUERY',
        context,
        { query, index }
      )
    }
  })
}
