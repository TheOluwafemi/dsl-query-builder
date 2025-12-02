import { QueryBuilder } from '../src/query-builder'

describe('Enhanced Aggregations', () => {
  let builder: QueryBuilder

  beforeEach(() => {
    builder = new QueryBuilder()
  })

  describe('Metric Aggregations', () => {
    it('should create avg aggregation', () => {
      const result = builder.avgAgg('avg_price', 'price').build()

      expect(result.aggs).toEqual({
        avg_price: { avg: { field: 'price' } },
      })
    })

    it('should create sum aggregation', () => {
      const result = builder.sumAgg('total_sales', 'sales').build()

      expect(result.aggs).toEqual({
        total_sales: { sum: { field: 'sales' } },
      })
    })

    it('should create max aggregation', () => {
      const result = builder.maxAgg('max_price', 'price').build()

      expect(result.aggs).toEqual({
        max_price: { max: { field: 'price' } },
      })
    })

    it('should create min aggregation', () => {
      const result = builder.minAgg('min_price', 'price').build()

      expect(result.aggs).toEqual({
        min_price: { min: { field: 'price' } },
      })
    })

    it('should create cardinality aggregation', () => {
      const result = builder.cardinalityAgg('unique_users', 'user_id').build()

      expect(result.aggs).toEqual({
        unique_users: { cardinality: { field: 'user_id' } },
      })
    })

    it('should create value_count aggregation', () => {
      const result = builder.valueCountAgg('review_count', 'review').build()

      expect(result.aggs).toEqual({
        review_count: { value_count: { field: 'review' } },
      })
    })
  })

  describe('Bucket Aggregations', () => {
    it('should create histogram aggregation', () => {
      const result = builder
        .histogramAgg('price_histogram', 'price', 10)
        .build()

      expect(result.aggs).toEqual({
        price_histogram: {
          histogram: {
            field: 'price',
            interval: 10,
          },
        },
      })
    })

    it('should validate histogram interval', () => {
      expect(() => {
        builder.histogramAgg('test', 'price', 0)
      }).toThrow('Histogram interval must be a positive integer')

      expect(() => {
        builder.histogramAgg('test', 'price', 1.5)
      }).toThrow('Histogram interval must be a positive integer')
    })

    it('should create range aggregation', () => {
      const ranges = [
        { to: 100, key: 'cheap' },
        { from: 100, to: 500, key: 'medium' },
        { from: 500, key: 'expensive' },
      ]

      const result = builder.rangeAgg('price_ranges', 'price', ranges).build()

      expect(result.aggs).toEqual({
        price_ranges: {
          range: {
            field: 'price',
            ranges,
          },
        },
      })
    })

    it('should validate range aggregation', () => {
      expect(() => {
        builder.rangeAgg('test', 'price', [])
      }).toThrow('Range aggregation requires at least one range')
    })

    it('should create filters aggregation', () => {
      const filters = {
        published: { term: { status: 'published' } },
        featured: { term: { featured: true } },
      }

      const result = builder.filtersAgg('content_filters', filters).build()

      expect(result.aggs).toEqual({
        content_filters: {
          filters: { filters },
        },
      })
    })

    it('should validate filters aggregation', () => {
      expect(() => {
        builder.filtersAgg('test', null as any)
      }).toThrow('Filters aggregation requires filters object')
    })

    it('should create nested aggregation', () => {
      const result = builder.nestedAgg('nested_comments', 'comments').build()

      expect(result.aggs).toEqual({
        nested_comments: {
          nested: { path: 'comments' },
        },
      })
    })
  })

  describe('Multiple Aggregations', () => {
    it('should chain multiple aggregations', () => {
      const result = builder
        .avgAgg('avg_price', 'price')
        .sumAgg('total_sales', 'sales')
        .termsAgg('categories', 'category')
        .histogramAgg('price_dist', 'price', 50)
        .build()

      expect(result.aggs).toEqual({
        avg_price: { avg: { field: 'price' } },
        total_sales: { sum: { field: 'sales' } },
        categories: { terms: { field: 'category', size: 10 } },
        price_dist: { histogram: { field: 'price', interval: 50 } },
      })
    })
  })

  describe('Complex Aggregations', () => {
    it('should handle aggregations with queries', () => {
      const result = builder
        .match('title', 'electronics')
        .range('price', { gte: 100, lte: 1000 })
        .avgAgg('avg_price', 'price')
        .termsAgg('brands', 'brand')
        .dateHistogramAgg('sales_over_time', 'created_at', '1M')
        .build()

      expect(result.query?.bool?.must).toHaveLength(1)
      expect(result.query?.bool?.filter).toHaveLength(1)
      expect(Object.keys(result.aggs || {})).toHaveLength(3)
    })
  })
})
