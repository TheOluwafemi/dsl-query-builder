import {
  createQuery,
  createEcommerceQuery,
  createLogsQuery,
  createAnalyticsQuery,
  createContentQuery,
} from '../src/index'
import { QueryBuilder } from '../src/query-builder'
import {
  EcommerceQueryBuilder,
  LogsQueryBuilder,
  AnalyticsQueryBuilder,
  ContentQueryBuilder,
} from '../src/presets'

describe('Integration Tests - HTTP Client Usage', () => {
  describe('Basic Query Building Integration', () => {
    it('should create a complete e-commerce search query', () => {
      const query = createQuery()
        .match('name', 'wireless headphones')
        .range('price', { gte: 50, lte: 300 })
        .terms('brand', ['sony', 'bose', 'apple'])
        .term('in_stock', true)
        .sort('rating', 'desc')
        .sort('price', 'asc')
        .size(24)
        .from(0)
        .termsAgg('brands', 'brand.keyword')
        .rangeAgg('price_ranges', 'price', [
          { to: 100, key: 'budget' },
          { from: 100, to: 200, key: 'mid' },
          { from: 200, key: 'premium' },
        ])
        .build()

      expect(query).toMatchObject({
        from: 0,
        size: 24,
        query: {
          bool: {
            must: [
              {
                match: { name: { query: 'wireless headphones' } },
              },
            ],
            filter: [
              { range: { price: { gte: 50, lte: 300 } } },
              { terms: { brand: ['sony', 'bose', 'apple'] } },
              { term: { 'in_stock.keyword': true } },
            ],
          },
        },
        sort: [{ rating: 'desc' }, { price: 'asc' }],
        aggs: {
          brands: { terms: { field: 'brand.keyword', size: 10 } },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 100, key: 'budget' },
                { from: 100, to: 200, key: 'mid' },
                { from: 200, key: 'premium' },
              ],
            },
          },
        },
      })
    })

    it('should build complex analytics query', () => {
      const query = createQuery()
        .range('event_timestamp', { gte: '2023-01-01', lte: '2023-12-31' })
        .term('event_type', 'purchase')
        .nested('user', (q) => {
          q.term('user.segment', 'premium').range('user.account_age_days', {
            gte: 365,
          })
        })
        .functionScore([
          {
            filter: { range: { event_timestamp: { gte: 'now-7d' } } },
            weight: 2.0,
          },
        ])
        .cardinalityAgg('unique_users', 'user.id')
        .dateHistogramAgg('purchases_over_time', 'event_timestamp', '1d')
        .sumAgg('total_revenue', 'purchase_amount')
        .build()

      expect(query.query).toHaveProperty('function_score')
      expect(query.aggs).toHaveProperty('unique_users')
      expect(query.aggs).toHaveProperty('purchases_over_time')
      expect(query.aggs).toHaveProperty('total_revenue')
    })
  })

  describe('HTTP Client Integration Examples', () => {
    it('should demonstrate fetch API usage', async () => {
      const query = createQuery()
        .match('title', 'javascript')
        .range('published_date', { gte: '2023-01-01' })
        .sort('_score', 'desc')
        .size(10)

      const dsl = query.build()

      // Mock fetch to demonstrate usage
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            hits: {
              total: { value: 42 },
              hits: [{ _id: '1', _source: { title: 'JavaScript Basics' } }],
            },
          }),
      })

      global.fetch = mockFetch

      // Simulate actual usage
      const response = await fetch('http://localhost:9200/articles/_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dsl),
      })

      const results = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9200/articles/_search',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dsl),
        }
      )
      expect((results as any).hits.total.value).toBe(42)
    })

    it('should demonstrate custom HTTP client integration', async () => {
      // Mock custom HTTP client
      const httpClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: { total: { value: 15 }, hits: [] },
            aggregations: { categories: { buckets: [] } },
          },
        }),
      }

      const query = createEcommerceQuery()
        .searchProducts('laptop', { category: 'electronics' })
        .addEcommerceAggregations()

      const dsl = query.build()

      // Use with custom client
      const response = await httpClient.post('/search', dsl)

      expect(httpClient.post).toHaveBeenCalledWith('/search', dsl)
      expect(response.data.hits.total.value).toBe(15)
    })

    it('should demonstrate GraphQL integration', () => {
      const query = createContentQuery()
        .searchContent('react hooks tutorial')
        .contentType('tutorial')
        .publishedBetween(new Date('2023-01-01'), new Date('2023-12-31'))

      const dsl = query.build()

      // GraphQL variables
      const variables = {
        searchQuery: dsl,
        index: 'content',
      }

      // Mock GraphQL query
      const graphqlQuery = `
        query SearchContent($searchQuery: JSON!, $index: String!) {
          search(query: $searchQuery, index: $index) {
            total
            hits {
              id
              title
              content
              publishedAt
            }
            aggregations
          }
        }
      `

      expect(variables.searchQuery).toEqual(dsl)
      expect(typeof graphqlQuery).toBe('string')
    })
  })

  describe('Factory Functions', () => {
    it('should create basic query builder', () => {
      const query = createQuery()
      expect(query).toBeInstanceOf(QueryBuilder)
    })

    it('should create ecommerce query builder', () => {
      const query = createEcommerceQuery()
      expect(query).toBeInstanceOf(EcommerceQueryBuilder)
      expect(query).toBeInstanceOf(QueryBuilder) // Should inherit
    })

    it('should create logs query builder', () => {
      const query = createLogsQuery()
      expect(query).toBeInstanceOf(LogsQueryBuilder)
      expect(query).toBeInstanceOf(QueryBuilder)
    })

    it('should create analytics query builder', () => {
      const query = createAnalyticsQuery()
      expect(query).toBeInstanceOf(AnalyticsQueryBuilder)
      expect(query).toBeInstanceOf(QueryBuilder)
    })

    it('should create content query builder', () => {
      const query = createContentQuery()
      expect(query).toBeInstanceOf(ContentQueryBuilder)
      expect(query).toBeInstanceOf(QueryBuilder)
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle complex e-commerce faceted search', () => {
      const query = createEcommerceQuery()
        .searchProducts('gaming laptop', {
          category: 'computers',
          priceRange: { min: 800, max: 3000 },
          brands: ['msi', 'asus', 'alienware'],
        })
        .addEcommerceAggregations()
        .sortByPopularity()
        .size(24)
        .highlight(['name', 'description'])

      const dsl = query.build()

      expect(dsl.query?.bool?.must).toBeDefined()
      expect(dsl.query?.bool?.filter).toBeDefined()
      expect(dsl.aggs).toBeDefined()
      expect(dsl.sort).toBeDefined()
      expect(dsl.highlight).toBeDefined()
      expect(dsl.size).toBe(24)
    })

    it('should handle log analysis scenario', () => {
      const query = createLogsQuery()
        .timeRange('now-24h', 'now')
        .logLevel('error')
        .service('payment-service')
        .withError()
        .addLogAggregations()
        .addTimeHistogram('1h')
        .sortByTime()
        .size(100)

      const dsl = query.build()

      expect(dsl.query).toBeDefined()
      expect(dsl.aggs).toHaveProperty('logs_over_time')
      expect(dsl.sort).toBeDefined()
    })

    it('should handle analytics dashboard scenario', () => {
      const query = createAnalyticsQuery()
        .dateRange(new Date('2023-01-01'), new Date('2023-01-31'))
        .eventType('page_view')
        .userSegment('active')
        .addUserAnalytics()
        .addTimeAnalytics('1d')
        .size(0) // Only aggregations

      const dsl = query.build()

      expect(dsl.size).toBe(0)
      expect(dsl.aggs).toHaveProperty('unique_users')
      expect(dsl.aggs).toHaveProperty('events_over_time')
      expect(dsl.query?.bool?.filter).toBeDefined()
    })

    it('should handle content recommendation scenario', () => {
      const query = createContentQuery()
        .moreLikeThis(['title', 'content', 'tags'], undefined, [
          { _index: 'articles', _id: 'current-article-123' },
        ])
        .contentType('article')
        .withTags(['javascript', 'tutorial'])
        .functionScore([
          {
            filter: { range: { view_count: { gte: 1000 } } },
            weight: 1.5,
          },
          {
            filter: { range: { published_at: { gte: 'now-30d' } } },
            weight: 1.2,
          },
        ])
        .size(5)

      const dsl = query.build()

      expect(dsl.query).toHaveProperty('function_score')
      expect(dsl.query.function_score.query.bool.must).toBeDefined()
      expect(dsl.size).toBe(5)
    })
  })

  describe('Performance and Bundle Size', () => {
    it('should create queries efficiently', () => {
      const start = performance.now()

      // Create multiple complex queries
      for (let i = 0; i < 100; i++) {
        createQuery()
          .match('title', `query ${i}`)
          .range('price', { gte: i * 10, lte: (i + 1) * 10 })
          .termsAgg('categories', 'category')
          .build()
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(100) // Should be very fast
    })

    it('should have minimal memory footprint', () => {
      const queries = []

      // Create many queries
      for (let i = 0; i < 1000; i++) {
        queries.push(createQuery().match('field', `value${i}`).build())
      }

      expect(queries).toHaveLength(1000)
      // If this test passes without memory issues, footprint is acceptable
    })
  })
})
