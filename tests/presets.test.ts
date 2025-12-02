import {
  EcommerceQueryBuilder,
  LogsQueryBuilder,
  AnalyticsQueryBuilder,
  ContentQueryBuilder,
} from '../src/presets'

describe('Query Builder Presets', () => {
  describe('EcommerceQueryBuilder', () => {
    let builder: EcommerceQueryBuilder

    beforeEach(() => {
      builder = new EcommerceQueryBuilder()
    })

    it('should search products with all options', () => {
      const result = builder
        .searchProducts('laptop', {
          category: 'electronics',
          priceRange: { min: 500, max: 2000 },
          inStock: true,
          brands: ['apple', 'dell'],
        })
        .build()

      // Check multi-match query
      expect(result.query?.bool?.must).toContainEqual({
        multi_match: {
          query: 'laptop',
          fields: ['name', 'description', 'tags'],
          type: 'best_fields',
        },
      })

      // Check filters
      const filters = result.query?.bool?.filter || []
      expect(filters).toContainEqual({
        term: { 'category.keyword': 'electronics' },
      })
      expect(filters).toContainEqual({
        range: { price: { gte: 500, lte: 2000 } },
      })
      expect(filters).toContainEqual({
        term: { 'in_stock.keyword': true },
      })
      expect(filters).toContainEqual({
        terms: { brand: ['apple', 'dell'] },
      })
    })

    it('should add ecommerce aggregations', () => {
      const result = builder.addEcommerceAggregations().build()

      expect(result.aggs).toEqual({
        categories: { terms: { field: 'category.keyword', size: 10 } },
        brands: { terms: { field: 'brand.keyword', size: 20 } },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { to: 25, key: 'under_25' },
              { from: 25, to: 50, key: '25_to_50' },
              { from: 50, to: 100, key: '50_to_100' },
              { from: 100, to: 200, key: '100_to_200' },
              { from: 200, key: 'over_200' },
            ],
          },
        },
        ratings: { terms: { field: 'rating', size: 5 } },
      })
    })

    it('should sort by popularity', () => {
      const result = builder.sortByPopularity().build()

      expect(result.sort).toEqual([{ sales_count: 'desc' }, { rating: 'desc' }])
    })

    it('should sort by price', () => {
      const result = builder.sortByPrice('desc').build()

      expect(result.sort).toEqual([{ price: 'desc' }])
    })

    it('should recommend similar products', () => {
      const result = builder.recommendSimilar('product-123').build()

      expect(result.query?.bool?.must).toContainEqual({
        more_like_this: {
          fields: ['name', 'description', 'category'],
          like: [{ _index: 'products', _id: 'product-123' }],
        },
      })
    })
  })

  describe('LogsQueryBuilder', () => {
    let builder: LogsQueryBuilder

    beforeEach(() => {
      builder = new LogsQueryBuilder()
    })

    it('should filter by time range', () => {
      const from = new Date('2023-01-01T00:00:00Z')
      const to = new Date('2023-01-02T00:00:00Z')

      const result = builder.timeRange(from, to).build()

      expect(result.query?.bool?.filter).toContainEqual({
        range: {
          '@timestamp': {
            gte: '2023-01-01T00:00:00.000Z',
            lte: '2023-01-02T00:00:00.000Z',
          },
        },
      })
    })

    it('should filter by log level', () => {
      const result = builder.logLevel('error').build()

      expect(result.query?.bool?.filter).toContainEqual({
        term: { 'level.keyword': 'error' },
      })
    })

    it('should filter by service', () => {
      const result = builder.service('api-gateway').build()

      expect(result.query?.bool?.filter).toContainEqual({
        term: { 'service.name.keyword': 'api-gateway' },
      })
    })

    it('should search in message', () => {
      const result = builder.searchMessage('database connection failed').build()

      expect(result.query?.bool?.must).toContainEqual({
        match: { message: { query: 'database connection failed' } },
      })
    })

    it('should filter by errors', () => {
      const result = builder.withError('SQLException').build()

      const filters = result.query?.bool?.filter || []
      const musts = result.query?.bool?.must || []

      expect(filters).toContainEqual({
        exists: { field: 'error' },
      })
      expect(musts).toContainEqual({
        match: { 'error.type': { query: 'SQLException' } },
      })
    })

    it('should add log aggregations', () => {
      const result = builder.addLogAggregations().build()

      expect(result.aggs).toEqual({
        services: { terms: { field: 'service.name.keyword', size: 10 } },
        log_levels: { terms: { field: 'level.keyword', size: 5 } },
        environments: { terms: { field: 'environment.keyword', size: 5 } },
        error_types: { terms: { field: 'error.type.keyword', size: 10 } },
      })
    })
  })

  describe('AnalyticsQueryBuilder', () => {
    let builder: AnalyticsQueryBuilder

    beforeEach(() => {
      builder = new AnalyticsQueryBuilder()
    })

    it('should filter by user segment', () => {
      const result = builder.userSegment('premium').build()

      expect(result.query?.bool?.filter).toContainEqual({
        term: { 'user.segment.keyword': 'premium' },
      })
    })

    it('should filter by event type', () => {
      const result = builder.eventType('page_view').build()

      expect(result.query?.bool?.filter).toContainEqual({
        term: { 'event.type.keyword': 'page_view' },
      })
    })

    it('should filter by date range', () => {
      const from = new Date('2023-01-01')
      const to = new Date('2023-01-31')

      const result = builder.dateRange(from, to).build()

      expect(result.query?.bool?.filter).toContainEqual({
        range: {
          'event.timestamp': {
            gte: from.toISOString(),
            lte: to.toISOString(),
          },
        },
      })
    })

    it('should add user analytics aggregations', () => {
      const result = builder.addUserAnalytics().build()

      expect(result.aggs).toEqual({
        unique_users: { cardinality: { field: 'user.id' } },
        user_segments: { terms: { field: 'user.segment.keyword', size: 10 } },
        user_countries: {
          terms: { field: 'user.geo.country.keyword', size: 20 },
        },
        devices: { terms: { field: 'user.device.type.keyword', size: 5 } },
      })
    })
  })

  describe('ContentQueryBuilder', () => {
    let builder: ContentQueryBuilder

    beforeEach(() => {
      builder = new ContentQueryBuilder()
    })

    it('should search content with default fields', () => {
      const result = builder.searchContent('react tutorial').build()

      expect(result.query?.bool?.must).toContainEqual({
        multi_match: {
          query: 'react tutorial',
          fields: ['title^3', 'content', 'tags^2', 'description'],
          type: 'best_fields',
        },
      })
    })

    it('should search content with custom boost', () => {
      const result = builder
        .searchContent('react tutorial', {
          fields: ['title', 'content'],
          boost: { title: 5, content: 1 },
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        multi_match: {
          query: 'react tutorial',
          fields: ['title^5', 'content^1'],
          type: 'best_fields',
        },
      })
    })

    it('should filter by content type', () => {
      const result = builder.contentType('article').build()

      expect(result.query?.bool?.filter).toContainEqual({
        term: { 'content_type.keyword': 'article' },
      })
    })

    it('should filter by tags', () => {
      const result = builder
        .withTags(['javascript', 'react', 'tutorial'])
        .build()

      expect(result.query?.bool?.filter).toContainEqual({
        terms: { tags: ['javascript', 'react', 'tutorial'] },
      })
    })

    it('should add content aggregations', () => {
      const result = builder.addContentAggregations().build()

      expect(result.aggs).toMatchObject({
        content_types: { terms: { field: 'content_type.keyword', size: 10 } },
        authors: { terms: { field: 'author.name.keyword', size: 20 } },
        popular_tags: { terms: { field: 'tags.keyword', size: 50 } },
        published_over_time: {
          date_histogram: {
            field: 'published_at',
            calendar_interval: '1M',
          },
        },
      })
    })

    it('should sort by relevance and recency', () => {
      const result = builder.sortByRelevanceAndRecency().build()

      expect(result.query).toHaveProperty('function_score')
      expect(result.query?.function_score.functions).toHaveLength(2)
    })
  })

  describe('Preset Inheritance', () => {
    it('should inherit all base QueryBuilder methods', () => {
      const ecommerce = new EcommerceQueryBuilder()

      // Should be able to use base methods
      const result = ecommerce
        .searchProducts('laptop')
        .match('description', 'gaming') // Base method
        .size(20) // Base method
        .sort('price', 'asc') // Base method
        .build()

      expect(result.size).toBe(20)
      expect(result.sort).toContainEqual({ price: 'asc' })
      expect(result.query?.bool?.must).toContainEqual({
        match: { description: { query: 'gaming' } },
      })
    })
  })
})
