import {
  ValidationError,
  validateSearchConfig,
  validateRangeQuery,
  validateFieldName,
  validateSortOrder,
  validatePaginationParams,
  validateArray,
  validateStringArray,
  validateIndexName,
  validateQueryValue,
  validateMultiMatchType,
  validateAggregationName,
  validateMsearchQueries,
} from '../src/validation'

describe('Validation', () => {
  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ValidationError')
      expect(error.field).toBeUndefined()
    })

    it('should create validation error with field', () => {
      const error = new ValidationError('Test error', 'fieldName')
      expect(error.message).toBe('Test error')
      expect(error.field).toBe('fieldName')
    })
  })

  describe('validateSearchConfig', () => {
    it('should validate valid config', () => {
      const validConfig = {
        endpoint: 'https://elasticsearch.example.com',
        index: 'test-index',
        token: 'test-token',
        retries: 3,
        timeout: 30000,
        headers: { 'Custom-Header': 'value' },
      }

      expect(() => validateSearchConfig(validConfig)).not.toThrow()
    })

    it('should require config object', () => {
      expect(() => validateSearchConfig(null)).toThrow(
        'Search config must be an object'
      )
      expect(() => validateSearchConfig(undefined)).toThrow(
        'Search config must be an object'
      )
      expect(() => validateSearchConfig('string')).toThrow(
        'Search config must be an object'
      )
    })

    it('should require endpoint', () => {
      expect(() => validateSearchConfig({})).toThrow(
        new ValidationError(
          'endpoint is required and must be a string',
          'endpoint'
        )
      )
      expect(() => validateSearchConfig({ endpoint: null })).toThrow()
      expect(() => validateSearchConfig({ endpoint: 123 })).toThrow()
    })

    it('should validate endpoint URL', () => {
      expect(() => validateSearchConfig({ endpoint: 'invalid-url' })).toThrow(
        new ValidationError('endpoint must be a valid URL', 'endpoint')
      )
      expect(() => validateSearchConfig({ endpoint: 'not-a-url' })).toThrow()
    })

    it('should validate retries', () => {
      expect(() =>
        validateSearchConfig({
          endpoint: 'https://test.com',
          retries: -1,
        })
      ).toThrow(
        new ValidationError('retries must be a non-negative integer', 'retries')
      )

      expect(() =>
        validateSearchConfig({
          endpoint: 'https://test.com',
          retries: 1.5,
        })
      ).toThrow()
    })

    it('should validate timeout', () => {
      expect(() =>
        validateSearchConfig({
          endpoint: 'https://test.com',
          timeout: 0,
        })
      ).toThrow(
        new ValidationError('timeout must be a positive integer', 'timeout')
      )

      expect(() =>
        validateSearchConfig({
          endpoint: 'https://test.com',
          timeout: -1000,
        })
      ).toThrow()
    })
  })

  describe('validateRangeQuery', () => {
    it('should validate valid range queries', () => {
      expect(() => validateRangeQuery({ gte: 10 })).not.toThrow()
      expect(() => validateRangeQuery({ gte: 10, lte: 100 })).not.toThrow()
      expect(() => validateRangeQuery({ gt: 0, lt: 50 })).not.toThrow()
      expect(() => validateRangeQuery({ gte: 10, boost: 1.5 })).not.toThrow()
    })

    it('should require object', () => {
      expect(() => validateRangeQuery(null)).toThrow(
        'Range query must be an object'
      )
      expect(() => validateRangeQuery('string')).toThrow(
        'Range query must be an object'
      )
    })

    it('should require at least one condition', () => {
      expect(() => validateRangeQuery({})).toThrow(
        'Range query must have at least one condition'
      )
    })

    it('should reject invalid keys', () => {
      expect(() => validateRangeQuery({ invalid: 10 })).toThrow(
        'Invalid range query keys: invalid'
      )
      expect(() =>
        validateRangeQuery({ gte: 10, invalid1: 20, invalid2: 30 })
      ).toThrow()
    })

    it('should reject conflicting conditions', () => {
      expect(() => validateRangeQuery({ gte: 10, gt: 20 })).toThrow(
        'Range query cannot have conflicting conditions (gte/gt or lte/lt)'
      )
      expect(() => validateRangeQuery({ lte: 100, lt: 50 })).toThrow()
    })
  })

  describe('validateFieldName', () => {
    it('should validate valid field names', () => {
      expect(() => validateFieldName('title', 'test')).not.toThrow()
      expect(() => validateFieldName('field.subfield', 'test')).not.toThrow()
      expect(() => validateFieldName('123field', 'test')).not.toThrow()
    })

    it('should reject invalid field names', () => {
      expect(() => validateFieldName('', 'test')).toThrow(
        'Field name is required and must be a string in test'
      )
      expect(() => validateFieldName('  ', 'test')).toThrow(
        'Field name cannot be empty in test'
      )
      expect(() => validateFieldName(null as any, 'test')).toThrow()
      expect(() => validateFieldName(undefined as any, 'test')).toThrow()
    })
  })

  describe('validateSortOrder', () => {
    it('should validate valid sort orders', () => {
      expect(() => validateSortOrder('asc')).not.toThrow()
      expect(() => validateSortOrder('desc')).not.toThrow()
    })

    it('should reject invalid sort orders', () => {
      expect(() => validateSortOrder('ascending')).toThrow(
        'Sort order must be "asc" or "desc"'
      )
      expect(() => validateSortOrder('descending')).toThrow()
      expect(() => validateSortOrder(null)).toThrow()
      expect(() => validateSortOrder(123)).toThrow()
    })
  })

  describe('validatePaginationParams', () => {
    it('should validate valid pagination', () => {
      expect(() => validatePaginationParams(0, 10)).not.toThrow()
      expect(() => validatePaginationParams(100, 20)).not.toThrow()
      expect(() => validatePaginationParams(undefined, 10)).not.toThrow()
      expect(() => validatePaginationParams(0, undefined)).not.toThrow()
    })

    it('should reject invalid from values', () => {
      expect(() => validatePaginationParams(-1, 10)).toThrow(
        'from parameter must be a non-negative integer'
      )
      expect(() => validatePaginationParams(1.5, 10)).toThrow()
    })

    it('should reject invalid size values', () => {
      expect(() => validatePaginationParams(0, 0)).not.toThrow()
      expect(() => validatePaginationParams(0, -5)).toThrow(
        'size parameter must be a non-negative integer'
      )
      expect(() => validatePaginationParams(0, 10001)).toThrow(
        'size parameter cannot exceed 10000 (Elasticsearch limit)'
      )
    })
  })

  describe('validateArray', () => {
    it('should validate valid arrays', () => {
      expect(() => validateArray(['item'], 'test')).not.toThrow()
      expect(() => validateArray(['item1', 'item2'], 'test')).not.toThrow()
      expect(() => validateArray(['item'], 'test', 1)).not.toThrow()
    })

    it('should reject non-arrays', () => {
      expect(() => validateArray('string', 'test')).toThrow(
        'test must be an array'
      )
      expect(() => validateArray(null, 'test')).toThrow()
      expect(() => validateArray({}, 'test')).toThrow()
    })

    it('should validate minimum length', () => {
      expect(() => validateArray([], 'test')).toThrow(
        'test must have at least 1 item(s)'
      )
      expect(() => validateArray(['item'], 'test', 2)).toThrow(
        'test must have at least 2 item(s)'
      )
    })
  })

  describe('validateStringArray', () => {
    it('should validate valid string arrays', () => {
      expect(() => validateStringArray(['string1'], 'test')).not.toThrow()
      expect(() =>
        validateStringArray(['string1', 'string2'], 'test')
      ).not.toThrow()
    })

    it('should reject arrays with non-strings', () => {
      expect(() => validateStringArray([123], 'test')).toThrow(
        'test must contain only non-empty strings'
      )
      expect(() => validateStringArray(['valid', null], 'test')).toThrow()
      expect(() => validateStringArray(['valid', ''], 'test')).toThrow()
      expect(() => validateStringArray(['valid', '  '], 'test')).toThrow()
    })
  })

  describe('validateIndexName', () => {
    it('should validate valid index names', () => {
      expect(() => validateIndexName('test-index', 'test')).not.toThrow()
      expect(() => validateIndexName('my_index', 'test')).not.toThrow()
      expect(() => validateIndexName('index123', 'test')).not.toThrow()
      expect(() => validateIndexName('a.b-c_d', 'test')).not.toThrow()
    })

    it('should reject invalid index names', () => {
      expect(() => validateIndexName('', 'test')).toThrow(
        'Index name is required and must be a string in test'
      )
      expect(() => validateIndexName('  ', 'test')).toThrow(
        'Index name cannot be empty in test'
      )
      expect(() => validateIndexName('Invalid-Index', 'test')).toThrow(
        /Invalid index name/
      )
      expect(() => validateIndexName('-invalid', 'test')).toThrow()
      expect(() => validateIndexName('Invalid', 'test')).toThrow() // Uppercase
    })

    it('should reject overly long index names', () => {
      const longName = 'a'.repeat(256)
      expect(() => validateIndexName(longName, 'test')).toThrow(
        /exceeds maximum length of 255 characters/
      )
    })
  })

  describe('validateQueryValue', () => {
    it('should validate valid query values', () => {
      expect(() => validateQueryValue('string', 'test')).not.toThrow()
      expect(() => validateQueryValue(123, 'test')).not.toThrow()
      expect(() => validateQueryValue(true, 'test')).not.toThrow()
      expect(() => validateQueryValue([], 'test')).not.toThrow()
      expect(() => validateQueryValue({}, 'test')).not.toThrow()
    })

    it('should reject null and undefined', () => {
      expect(() => validateQueryValue(null, 'test')).toThrow(
        'Query value cannot be null or undefined in test'
      )
      expect(() => validateQueryValue(undefined, 'test')).toThrow()
    })

    it('should reject empty strings', () => {
      expect(() => validateQueryValue('', 'test')).toThrow(
        'Query value cannot be empty string in test'
      )
      expect(() => validateQueryValue('  ', 'test')).toThrow()
    })
  })

  describe('validateMultiMatchType', () => {
    it('should validate valid multi_match types', () => {
      const validTypes = [
        'best_fields',
        'most_fields',
        'cross_fields',
        'phrase',
        'phrase_prefix',
        'bool_prefix',
      ]
      validTypes.forEach((type) => {
        expect(() => validateMultiMatchType(type)).not.toThrow()
      })
    })

    it('should allow undefined', () => {
      expect(() => validateMultiMatchType(undefined)).not.toThrow()
    })

    it('should reject invalid types', () => {
      expect(() => validateMultiMatchType('invalid_type')).toThrow(
        /Invalid multi_match type/
      )
      expect(() => validateMultiMatchType('best')).toThrow()
      expect(() => validateMultiMatchType(null)).toThrow()
    })
  })

  describe('validateAggregationName', () => {
    it('should validate valid aggregation names', () => {
      expect(() => validateAggregationName('avg_price')).not.toThrow()
      expect(() => validateAggregationName('categories')).not.toThrow()
    })

    it('should reject invalid names', () => {
      expect(() => validateAggregationName('')).toThrow(
        'Aggregation name must be a non-empty string'
      )
      expect(() => validateAggregationName('  ')).toThrow(
        'Aggregation name cannot be empty'
      )
      expect(() => validateAggregationName(null as any)).toThrow()
      expect(() => validateAggregationName(undefined as any)).toThrow()
    })
  })

  describe('validateMsearchQueries', () => {
    it('should validate valid msearch queries', () => {
      const validQueries = [
        { query: { match_all: {} } },
        { index: 'test', query: { match: { title: 'test' } } },
      ]

      expect(() => validateMsearchQueries(validQueries)).not.toThrow()
    })

    it('should reject non-arrays', () => {
      expect(() => validateMsearchQueries('not-array' as any)).toThrow(
        'msearch queries must be an array'
      )
      expect(() => validateMsearchQueries(null as any)).toThrow()
    })

    it('should reject empty arrays', () => {
      expect(() => validateMsearchQueries([])).toThrow(
        'msearch queries array cannot be empty'
      )
    })

    it('should reject too many queries', () => {
      const tooManyQueries = Array(101).fill({ query: { match_all: {} } })
      expect(() => validateMsearchQueries(tooManyQueries)).toThrow(
        'msearch queries cannot exceed 100 searches per request'
      )
    })

    it('should validate individual query objects', () => {
      expect(() => validateMsearchQueries([null])).toThrow(
        'msearch item at index 0 must be an object'
      )
      expect(() => validateMsearchQueries([{}])).toThrow(
        'msearch item at index 0 must have a query property'
      )
      expect(() =>
        validateMsearchQueries([
          { query: { match_all: {} } },
          { index: 'test' }, // Missing query
        ])
      ).toThrow('msearch item at index 1 must have a query property')
    })
  })

  describe('Error Context and Messages', () => {
    it('should provide helpful error messages with context', () => {
      try {
        validateFieldName('', 'match query')
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        const validationError = error as ValidationError
        expect(validationError.message).toContain('match query')

        expect(
          validationError.field !== undefined ||
            validationError.message.includes('match query')
        ).toBe(true)
      }
    })

    it('should handle multiple validation errors in sequence', () => {
      const errors: ValidationError[] = []

      try {
        validateFieldName('', 'test1')
      } catch (e) {
        errors.push(e as ValidationError)
      }
      try {
        validateSortOrder('invalid')
      } catch (e) {
        errors.push(e as ValidationError)
      }
      try {
        validatePaginationParams(-1, 10)
      } catch (e) {
        errors.push(e as ValidationError)
      }

      expect(errors).toHaveLength(3)
      expect(errors.every((e) => e instanceof ValidationError)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in field names', () => {
      expect(() => validateFieldName('field.with.dots', 'test')).not.toThrow()
      expect(() =>
        validateFieldName('field_with_underscores', 'test')
      ).not.toThrow()
      expect(() =>
        validateFieldName('field-with-hyphens', 'test')
      ).not.toThrow()
    })

    it('should handle numeric values in various contexts', () => {
      expect(() => validateQueryValue(0, 'test')).not.toThrow()
      expect(() => validateQueryValue(-1, 'test')).not.toThrow()
      expect(() => validateQueryValue(1.5, 'test')).not.toThrow()
    })

    it('should handle unicode in field names and values', () => {
      expect(() => validateFieldName('título', 'test')).not.toThrow()
      expect(() => validateQueryValue('测试', 'test')).not.toThrow()
    })

    it('should validate range queries with edge values', () => {
      expect(() => validateRangeQuery({ gte: 0 })).not.toThrow()
      expect(() => validateRangeQuery({ gte: -Infinity })).not.toThrow()
      expect(() => validateRangeQuery({ lte: Infinity })).not.toThrow()
    })
  })
})
