import { createSearchClient, createQuery, ValidationError } from '../src/index'
import { QueryBuilder } from '../src/query-builder'
import { SearchClient } from '../src/search-client'
import axios from 'axios'

// Mock axios
const mockAxios = axios as jest.Mocked<typeof axios>
const mockAxiosInstance = {
  post: jest.fn(),
  defaults: { headers: { common: {} as Record<string, string> } },
}
mockAxios.create = jest.fn(() => mockAxiosInstance as any)

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Factory Functions', () => {
    it('should create search client with factory function', () => {
      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'test-index',
      })

      expect(client).toBeInstanceOf(SearchClient)
    })

    it('should create query builder with factory function', () => {
      const query = createQuery()
      expect(query).toBeInstanceOf(QueryBuilder)
    })
  })

  describe('End-to-End Search Flow', () => {
    interface Product {
      id: string
      name: string
      price: number
      category: string
      inStock: boolean
    }

    const mockSearchResponse = {
      took: 5,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 2, relation: 'eq' },
        max_score: 1.0,
        hits: [
          {
            _index: 'products',
            _id: '1',
            _score: 1.0,
            _source: {
              id: '1',
              name: 'Laptop',
              price: 999,
              category: 'electronics',
              inStock: true,
            },
          },
          {
            _index: 'products',
            _id: '2',
            _score: 0.8,
            _source: {
              id: '2',
              name: 'Phone',
              price: 699,
              category: 'electronics',
              inStock: false,
            },
          },
        ],
      },
    }

    it('should perform complete search workflow with type safety', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      // Create client
      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'products',
        token: 'test-token',
      })

      // Build complex query
      const query = createQuery()
        .match('name', 'laptop')
        .term('category', 'electronics')
        .range('price', { gte: 100, lte: 2000 })
        .should((q) => q.term('inStock', true).term('featured', true))
        .minimumShouldMatch(1)
        .sort('price', 'asc')
        .termsAgg('categories', 'category.keyword', 10)
        .size(20)
        .from(0)

      // Execute search with type safety
      const results = await client.search<Product>(query)

      // Verify results with full type safety
      expect(results.hits.total.value).toBe(2)
      expect(results.hits.hits).toHaveLength(2)

      // TypeScript knows these are Product objects
      const firstProduct = results.hits.hits[0]._source
      expect(firstProduct.name).toBe('Laptop')
      expect(firstProduct.price).toBe(999)
      expect(firstProduct.inStock).toBe(true)

      // Verify the query was built correctly
      const expectedQuery = query.build()
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/products/_search',
        expectedQuery
      )
    })

    it('should handle search state updates during workflow', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'products',
      })

      const stateChanges: any[] = []
      client.subscribe((state) => stateChanges.push({ ...state }))

      const query = createQuery().match('name', 'laptop')
      await client.search<Product>(query)

      expect(stateChanges).toHaveLength(2)
      expect(stateChanges[0]).toMatchObject({ loading: true, error: null })
      expect(stateChanges[1]).toMatchObject({
        loading: false,
        error: null,
        data: mockSearchResponse,
      })
    })
  })

  describe('Multi-Search Workflow', () => {
    it('should perform multi-search across different indices', async () => {
      const mockMsearchResponse = {
        responses: [
          { hits: { total: { value: 10 }, hits: [] } },
          { hits: { total: { value: 5 }, hits: [] } },
          { hits: { total: { value: 3 }, hits: [] } },
        ],
      }

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockMsearchResponse,
      })

      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
      })

      const searches = [
        {
          index: 'products',
          query: createQuery().match('category', 'electronics'),
        },
        {
          index: 'users',
          query: createQuery().term('active', true),
        },
        {
          index: 'orders',
          query: createQuery().range('createdAt', { gte: '2024-01-01' }),
        },
      ]

      const results = await client.msearch(searches)

      expect(results).toHaveLength(3)
      expect(results[0].hits.total.value).toBe(10)
      expect(results[1].hits.total.value).toBe(5)
      expect(results[2].hits.total.value).toBe(3)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle validation errors in complete workflow', async () => {
      // Test client creation validation
      expect(() =>
        createSearchClient({
          endpoint: 'invalid-url',
        })
      ).toThrow(ValidationError)

      // Test query building validation
      const query = createQuery()
      expect(() => query.match('', 'value')).toThrow(ValidationError)
      expect(() => query.range('field', {})).toThrow(ValidationError)
      expect(() => query.size(-1)).toThrow(ValidationError)

      // Test search method validation
      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
      })

      await expect(client.search(query, 'Invalid-Index')).rejects.toThrow(
        ValidationError
      )
    })

    it('should handle network errors gracefully', async () => {
      mockAxiosInstance.post.mockImplementation(() => {
        return Promise.reject(new Error('Network Error'))
      })

      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'test-index',
        retries: 1,
      })

      const query = createQuery().matchAll()

      await expect(client.search(query)).rejects.toMatchObject({
        message: 'Network Error',
      })
    })
  })

  describe('Real-World Usage Patterns', () => {
    it('should support e-commerce search scenario', async () => {
      const mockResponse = {
        hits: { total: { value: 50 }, hits: [] },
        aggregations: {
          categories: { buckets: [{ key: 'electronics', doc_count: 20 }] },
          price_ranges: { buckets: [{ key: '0-100', doc_count: 15 }] },
        },
      }

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'products',
      })

      // E-commerce search with filters and aggregations
      const searchQuery = createQuery()
        .multiMatch(['name', 'description'], 'smartphone', 'best_fields')
        .terms('brand', ['apple', 'samsung', 'google'])
        .range('price', { gte: 100, lte: 1000 })
        .term('inStock', true)
        .should((q) => q.term('featured', true).range('rating', { gte: 4.0 }))
        .minimumShouldMatch(1)
        .termsAgg('categories', 'category.keyword', 10)
        .termsAgg('brands', 'brand.keyword', 20)
        .aggregate('price_ranges', {
          range: {
            field: 'price',
            ranges: [
              { to: 100 },
              { from: 100, to: 500 },
              { from: 500, to: 1000 },
              { from: 1000 },
            ],
          },
        })
        .highlight(['name', 'description'])
        .sort('_score', 'desc')
        .sort('price', 'asc')
        .size(24)
        .from(0)

      const results = await client.search(searchQuery)

      expect(results.hits.total.value).toBe(50)
      expect(results.aggregations).toBeDefined()
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/products/_search',
        searchQuery.build()
      )
    })

    it('should support analytics/dashboard scenario', async () => {
      const mockMsearchResponse = {
        responses: [
          {
            hits: { total: { value: 1000 } },
            aggregations: { sales: { value: 50000 } },
          },
          { hits: { total: { value: 150 } } },
          { aggregations: { daily_sales: { buckets: [] } } },
        ],
      }

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockMsearchResponse,
      })

      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
      })

      // Dashboard queries
      const dashboardQueries = [
        {
          index: 'orders',
          query: createQuery()
            .range('createdAt', { gte: 'now-30d' })
            .aggregate('total_sales', { sum: { field: 'amount' } })
            .size(0),
        },
        {
          index: 'users',
          query: createQuery().range('registeredAt', { gte: 'now-7d' }).size(0),
        },
        {
          index: 'orders',
          query: createQuery()
            .dateHistogramAgg('daily_sales', 'createdAt', '1d', 'yyyy-MM-dd')
            .size(0),
        },
      ]

      const results = await client.msearch(dashboardQueries)

      expect(results).toHaveLength(3)
      // Total sales
      expect(results[0].hits.total.value).toBe(1000)
      // New users
      expect(results[1].hits.total.value).toBe(150)
      // Daily sales trend
      expect(results[2].aggregations?.daily_sales).toBeDefined()
    })
  })

  describe('Configuration and Flexibility', () => {
    it('should support dynamic configuration changes', async () => {
      const client = createSearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'initial-index',
      })

      // Change configuration at runtime
      client.setIndex('new-index').setToken('new-token')

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { hits: { total: { value: 0 }, hits: [] } },
      })

      await client.search(createQuery().matchAll())

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/new-index/_search',
        expect.any(Object)
      )
      expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
        'Bearer new-token'
      )
    })

    it('should support query cloning and reuse', () => {
      const baseQuery = createQuery()
        .term('category', 'electronics')
        .range('price', { gte: 100 })

      const laptopQuery = baseQuery
        .clone()
        .match('name', 'laptop')
        .sort('price', 'asc')

      const phoneQuery = baseQuery
        .clone()
        .match('name', 'phone')
        .sort('rating', 'desc')

      const baseResult = baseQuery.build()
      const laptopResult = laptopQuery.build()
      const phoneResult = phoneQuery.build()

      // Base query should be unchanged
      expect(baseResult.query?.bool?.must).toBeUndefined()

      // Cloned queries should have their specific modifications
      expect(laptopResult.query?.bool?.must).toContainEqual({
        match: { name: { query: 'laptop' } },
      })
      expect(phoneResult.query?.bool?.must).toContainEqual({
        match: { name: { query: 'phone' } },
      })
    })
  })
})
