import { QueryBuilder } from '../src/query-builder'
import { ValidationError } from '../src/validation'

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder

  beforeEach(() => {
    queryBuilder = new QueryBuilder()
  })

  describe('Pagination', () => {
    it('should set from parameter', () => {
      const result = queryBuilder.from(10).build()
      expect(result.from).toBe(10)
    })

    it('should set size parameter', () => {
      const result = queryBuilder.size(20).build()
      expect(result.size).toBe(20)
    })

    it('should validate from parameter', () => {
      expect(() => queryBuilder.from(-1)).toThrow(ValidationError)
      expect(() => queryBuilder.from(1.5)).toThrow(ValidationError)
    })

    it('should validate size parameter', () => {
      expect(() => queryBuilder.size(0)).not.toThrow() // ✅ Now allows 0
      expect(() => queryBuilder.size(-5)).toThrow(ValidationError)
      expect(() => queryBuilder.size(10001)).toThrow(ValidationError)
    })
  })

  describe('Match Queries', () => {
    it('should add match query', () => {
      const result = queryBuilder.match('title', 'javascript').build()
      expect(result.query?.bool?.must).toContainEqual({
        match: { title: { query: 'javascript' } },
      })
    })

    it('should add match query with operator', () => {
      const result = queryBuilder
        .match('title', 'javascript node', 'and')
        .build()
      expect(result.query?.bool?.must).toContainEqual({
        match: { title: { query: 'javascript node', operator: 'and' } },
      })
    })

    it('should validate match query field', () => {
      expect(() => queryBuilder.match('', 'value')).toThrow(ValidationError)
      expect(() => queryBuilder.match('  ', 'value')).toThrow(ValidationError)
    })

    it('should validate match query value', () => {
      expect(() => queryBuilder.match('field', null)).toThrow(ValidationError)
      expect(() => queryBuilder.match('field', undefined)).toThrow(
        ValidationError
      )
      expect(() => queryBuilder.match('field', '')).toThrow(ValidationError)
    })

    it('should add match_phrase query', () => {
      const result = queryBuilder
        .matchPhrase('description', 'exact phrase')
        .build()
      expect(result.query?.bool?.must).toContainEqual({
        match_phrase: { description: 'exact phrase' },
      })
    })

    it('should add multi_match query', () => {
      const result = queryBuilder
        .multiMatch(['title', 'description'], 'search term')
        .build()
      expect(result.query?.bool?.must).toContainEqual({
        multi_match: {
          query: 'search term',
          fields: ['title', 'description'],
        },
      })
    })

    it('should add multi_match query with type', () => {
      const result = queryBuilder
        .multiMatch(['title', 'description'], 'search term', 'best_fields')
        .build()
      expect(result.query?.bool?.must).toContainEqual({
        multi_match: {
          query: 'search term',
          fields: ['title', 'description'],
          type: 'best_fields',
        },
      })
    })

    it('should validate multi_match fields', () => {
      expect(() => queryBuilder.multiMatch([], 'value')).toThrow(
        ValidationError
      )
      expect(() => queryBuilder.multiMatch([''], 'value')).toThrow(
        ValidationError
      )
      expect(() => queryBuilder.multiMatch(['field', ''], 'value')).toThrow(
        ValidationError
      )
    })

    it('should validate multi_match type', () => {
      expect(() =>
        queryBuilder.multiMatch(['field'], 'value', 'invalid_type')
      ).toThrow(ValidationError)
    })
  })

  describe('Term Queries', () => {
    it('should add term query', () => {
      const result = queryBuilder.term('status', 'published').build()
      expect(result.query?.bool?.filter).toContainEqual({
        term: { status: 'published' },
      })
    })

    it('should add terms query', () => {
      const result = queryBuilder.terms('tags', ['tech', 'programming']).build()
      expect(result.query?.bool?.filter).toContainEqual({
        terms: { tags: ['tech', 'programming'] },
      })
    })

    it('should validate terms array', () => {
      expect(() => queryBuilder.terms('field', [])).toThrow(
        'terms query values must be a non-empty array'
      )
      expect(() => queryBuilder.terms('field', 'not-array' as any)).toThrow(
        'terms query values must be a non-empty array'
      )
    })

    it('should add exists query', () => {
      const result = queryBuilder.exists('author').build()
      expect(result.query?.bool?.filter).toContainEqual({
        exists: { field: 'author' },
      })
    })
  })

  describe('Range Queries', () => {
    it('should add range query', () => {
      const result = queryBuilder.range('price', { gte: 10, lte: 100 }).build()
      expect(result.query?.bool?.filter).toContainEqual({
        range: { price: { gte: 10, lte: 100 } },
      })
    })

    it('should validate range query', () => {
      expect(() => queryBuilder.range('field', {})).toThrow(ValidationError)
      expect(() => queryBuilder.range('field', { gte: 10, gt: 20 })).toThrow(
        ValidationError
      )
      expect(() => queryBuilder.range('field', { lte: 10, lt: 20 })).toThrow(
        ValidationError
      )
      expect(() => queryBuilder.range('field', { invalid: 10 } as any)).toThrow(
        ValidationError
      )
    })
  })

  describe('Text Search Queries', () => {
    it('should add wildcard query', () => {
      const result = queryBuilder.wildcard('title', 'java*').build()
      expect(result.query?.bool?.must).toContainEqual({
        wildcard: { title: 'java*' },
      })
    })

    it('should add prefix query', () => {
      const result = queryBuilder.prefix('title', 'java').build()
      expect(result.query?.bool?.must).toContainEqual({
        prefix: { title: 'java' },
      })
    })
  })

  describe('Boolean Logic', () => {
    it('should add should clause', () => {
      const result = queryBuilder
        .should((q) => q.term('brand', 'apple').term('brand', 'samsung'))
        .build()

      expect(result.query?.bool?.should).toContainEqual({
        term: { brand: 'apple' },
      })
      expect(result.query?.bool?.should).toContainEqual({
        term: { brand: 'samsung' },
      })
    })

    it('should set minimum_should_match', () => {
      const result = queryBuilder
        .should((q) => q.term('brand', 'apple'))
        .minimumShouldMatch(1)
        .build()

      expect(result.query?.bool?.minimum_should_match).toBe(1)
    })

    it('should add must_not clause', () => {
      const result = queryBuilder
        .mustNot((q) => q.term('status', 'deleted'))
        .build()

      expect(result.query?.bool?.must_not).toContainEqual({
        term: { status: 'deleted' },
      })
    })
  })

  describe('Sorting', () => {
    it('should add simple sort', () => {
      const result = queryBuilder.sort('price', 'desc').build()
      expect(result.sort).toContainEqual({ price: 'desc' })
    })

    it('should add complex sort', () => {
      const sortOption = { price: { order: 'desc' as const, missing: '_last' } }
      const result = queryBuilder.sortBy(sortOption).build()
      expect(result.sort).toContainEqual(sortOption)
    })

    it('should clear sort', () => {
      const result = queryBuilder.sort('price', 'desc').clearSort().build()
      expect(result.sort).toBeUndefined()
    })

    it('should validate sort field and order', () => {
      expect(() => queryBuilder.sort('', 'asc')).toThrow(ValidationError)
      expect(() => queryBuilder.sort('field', 'invalid' as any)).toThrow(
        ValidationError
      )
    })
  })

  describe('Source Filtering', () => {
    it('should set source fields array', () => {
      const result = queryBuilder.source(['title', 'description']).build()
      expect(result._source).toEqual(['title', 'description'])
    })

    it('should set source boolean', () => {
      const result = queryBuilder.source(false).build()
      expect(result._source).toBe(false)
    })
  })

  describe('Aggregations', () => {
    it('should add aggregation', () => {
      const agg = { avg: { field: 'price' } }
      const result = queryBuilder.aggregate('avg_price', agg).build()
      expect(result.aggs?.avg_price).toEqual(agg)
    })

    it('should add terms aggregation', () => {
      const result = queryBuilder.termsAgg('brands', 'brand.keyword', 5).build()
      expect(result.aggs?.brands).toEqual({
        terms: { field: 'brand.keyword', size: 5 },
      })
    })

    it('should add date histogram aggregation', () => {
      const result = queryBuilder
        .dateHistogramAgg('sales_over_time', 'createdAt', '1M', 'yyyy-MM')
        .build()
      expect(result.aggs?.sales_over_time).toEqual({
        date_histogram: {
          field: 'createdAt',
          calendar_interval: '1M',
          format: 'yyyy-MM',
        },
      })
    })

    it('should validate aggregation parameters', () => {
      expect(() => queryBuilder.aggregate('', {})).toThrow(ValidationError)
      expect(() => queryBuilder.aggregate('name', null)).toThrow(
        'Aggregation must be an object'
      )
      expect(() => queryBuilder.termsAgg('name', 'field', 0)).toThrow(
        'Terms aggregation size must be a positive integer'
      )
      expect(() => queryBuilder.dateHistogramAgg('name', 'field', '')).toThrow(
        'Date histogram interval must be a non-empty string'
      )
    })
  })

  describe('Highlighting', () => {
    it('should add highlighting with array', () => {
      const result = queryBuilder.highlight(['title', 'content']).build()
      expect(result.highlight).toEqual({
        fields: { title: {}, content: {} },
      })
    })

    it('should add highlighting with object', () => {
      const highlightConfig = { title: { number_of_fragments: 3 } }
      const result = queryBuilder.highlight(highlightConfig).build()
      expect(result.highlight).toEqual({ fields: highlightConfig })
    })
  })

  describe('Utility Methods', () => {
    it('should track total hits', () => {
      const result = queryBuilder.trackTotalHits(true).build()
      expect(result.track_total_hits).toBe(true)
    })

    it('should add raw query', () => {
      const rawQuery = { fuzzy: { title: { value: 'javascript' } } }
      const result = queryBuilder.raw(rawQuery, 'must').build()
      expect(result.query?.bool?.must).toContainEqual(rawQuery)
    })

    it('should set entire query', () => {
      const customQuery = { match_all: {} }
      const result = queryBuilder.setQuery(customQuery).build()
      expect(result.query).toEqual(customQuery)
    })

    it('should match all documents', () => {
      const result = queryBuilder.matchAll().build()
      expect(result.query).toEqual({ match_all: {} })
    })

    it('should reset query builder', () => {
      const result = queryBuilder.match('title', 'test').reset().build()

      // Should be empty bool query after cleanup
      expect(result.query).toEqual({ match_all: {} })
    })

    it('should clone query builder', () => {
      const original = queryBuilder.match('title', 'test')
      const cloned = original.clone()

      // Modify clone
      cloned.match('description', 'another test')

      // Original should be unchanged
      const originalResult = original.build()
      const clonedResult = cloned.build()

      expect(originalResult.query?.bool?.must).toHaveLength(1)
      expect(clonedResult.query?.bool?.must).toHaveLength(2)
    })
  })

  describe('Query Building and Cleanup', () => {
    it('should clean up empty bool clauses', () => {
      const result = queryBuilder.build()
      // Empty query should become match_all
      expect(result.query).toEqual({ match_all: {} })
    })

    it('should preserve non-empty bool clauses', () => {
      const result = queryBuilder
        .match('title', 'test')
        .term('status', 'published')
        .build()

      expect(result.query?.bool?.must).toHaveLength(1)
      expect(result.query?.bool?.filter).toHaveLength(1)
      expect(result.query?.bool?.should).toBeUndefined()
      expect(result.query?.bool?.must_not).toBeUndefined()
    })

    it('should clean up empty sort array', () => {
      const result = queryBuilder.clearSort().build()
      expect(result.sort).toBeUndefined()
    })
  })

  describe('Method Chaining', () => {
    it('should support method chaining', () => {
      const result = queryBuilder
        .match('title', 'javascript')
        .term('status', 'published')
        .range('price', { gte: 10 })
        .sort('createdAt', 'desc')
        .size(20)
        .from(10)
        .build()

      expect(result.query?.bool?.must).toHaveLength(1)
      expect(result.query?.bool?.filter).toHaveLength(2)
      expect(result.sort).toHaveLength(1)
      expect(result.size).toBe(20)
      expect(result.from).toBe(10)
    })
  })

  describe('Edge Cases', () => {
    it('should handle numeric field names', () => {
      const result = queryBuilder.match('123field', 'value').build()
      expect(result.query?.bool?.must).toContainEqual({
        match: { '123field': { query: 'value' } },
      })
    })

    it('should handle special characters in field names', () => {
      const result = queryBuilder.match('field.subfield', 'value').build()
      expect(result.query?.bool?.must).toContainEqual({
        match: { 'field.subfield': { query: 'value' } },
      })
    })

    it('should handle complex nested queries', () => {
      const result = queryBuilder
        .match('title', 'javascript')
        .should((q) =>
          q.term('category', 'tech').term('category', 'programming')
        )
        .mustNot((q) => q.term('status', 'draft').range('price', { gt: 1000 }))
        .minimumShouldMatch(1)
        .build()

      expect(result.query?.bool?.must).toHaveLength(1)
      expect(result.query?.bool?.should).toHaveLength(2)
      expect(result.query?.bool?.must_not).toHaveLength(2)
      expect(result.query?.bool?.minimum_should_match).toBe(1)
    })
  })
})
