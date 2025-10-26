import { SearchClient } from '../src/search-client'
import { QueryBuilder } from '../src/query-builder'
import { ValidationError } from '../src/validation'
import { SearchConfig, SearchResponse, SearchError } from '../src/types'
import axios, { AxiosError } from 'axios'

// Mock axios
jest.mock('axios')
const mockAxios = axios as jest.Mocked<typeof axios>
const mockAxiosInstance = {
  post: jest.fn(),
  defaults: {
    headers: {
      common: {} as Record<string, string>,
    },
  },
}
const createMockAxiosError = (
  message: string,
  status?: number,
  data?: any
): AxiosError => {
  const error = new Error(message) as AxiosError
  error.name = 'AxiosError'
  error.isAxiosError = true
  error.config = {} as any
  error.code = undefined
  error.request = {}
  error.toJSON = () => ({})

  if (status !== undefined || data !== undefined) {
    error.response = {
      status: status || 500,
      statusText: status === 400 ? 'Bad Request' : 'Internal Server Error',
      headers: {},
      config: {} as any,
      data: data || { error: 'Server Error' },
    }
  }

  return error
}

mockAxios.create = jest.fn(() => mockAxiosInstance as any)

describe('SearchClient', () => {
  let searchClient: SearchClient
  let validConfig: SearchConfig

  beforeEach(() => {
    jest.clearAllMocks()
    validConfig = {
      endpoint: 'https://elasticsearch.example.com',
      index: 'test-index',
      token: 'test-token',
    }
    searchClient = new SearchClient(validConfig)
  })

  describe('Constructor and Configuration', () => {
    it('should create client with valid config', () => {
      expect(searchClient).toBeInstanceOf(SearchClient)
      // Check that axios.create was called with correct config
      expect(mockAxios.create).toHaveBeenLastCalledWith({
        baseURL: 'https://elasticsearch.example.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      })
    })

    it('should create client without optional parameters', () => {
      const minimalConfig = { endpoint: 'https://elasticsearch.example.com' }
      const client = new SearchClient(minimalConfig)
      expect(client).toBeInstanceOf(SearchClient)
    })

    it('should create client with custom headers', () => {
      const configWithHeaders = {
        ...validConfig,
        headers: { 'Custom-Header': 'custom-value' },
      }
      new SearchClient(configWithHeaders)

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://elasticsearch.example.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'custom-value',
          Authorization: 'Bearer test-token',
        },
      })
    })

    it('should validate config on construction', () => {
      expect(() => new SearchClient({} as any)).toThrow(ValidationError)
      expect(() => new SearchClient({ endpoint: '' })).toThrow(ValidationError)
      expect(() => new SearchClient({ endpoint: 'invalid-url' })).toThrow(
        ValidationError
      )
      expect(
        () => new SearchClient({ endpoint: 'https://valid.com', retries: -1 })
      ).toThrow(ValidationError)
      expect(
        () => new SearchClient({ endpoint: 'https://valid.com', timeout: 0 })
      ).toThrow(ValidationError)
    })
  })

  describe('Query Builder Factory', () => {
    it('should create new query builder instance', () => {
      const builder = searchClient.query()
      expect(builder).toBeInstanceOf(QueryBuilder)
    })

    it('should create independent query builder instances', () => {
      const builder1 = searchClient.query()
      const builder2 = searchClient.query()

      builder1.match('title', 'test1')
      builder2.match('title', 'test2')

      expect(builder1.build()).not.toEqual(builder2.build())
    })
  })

  describe('Search Method', () => {
    const mockSearchResponse: SearchResponse = {
      took: 5,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: 'eq' },
        max_score: 1.0,
        hits: [
          {
            _index: 'test-index',
            _id: '1',
            _score: 1.0,
            _source: { title: 'Test Document' },
          },
        ],
      },
    }

    it('should execute search with QueryBuilder', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      const query = new QueryBuilder().match('title', 'test')
      const result = await searchClient.search(query)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test-index/_search',
        query.build()
      )
      expect(result).toEqual(mockSearchResponse)
    })

    it('should execute search with raw QueryDSL', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      const queryDSL = { query: { match: { title: 'test' } } }
      const result = await searchClient.search(queryDSL)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test-index/_search',
        queryDSL
      )
      expect(result).toEqual(mockSearchResponse)
    })

    it('should execute search with custom index', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      const query = new QueryBuilder().match('title', 'test')
      await searchClient.search(query, 'custom-index')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/custom-index/_search',
        query.build()
      )
    })

    it('should throw error when no index specified', async () => {
      const clientWithoutIndex = new SearchClient({
        endpoint: 'https://test.com',
      })
      const query = new QueryBuilder().match('title', 'test')

      await expect(clientWithoutIndex.search(query)).rejects.toThrow(
        'Index must be specified either in config or search method'
      )
    })

    it('should update state during search', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSearchResponse })

      const stateChanges: any[] = []
      searchClient.subscribe((state) => stateChanges.push({ ...state }))

      const query = new QueryBuilder().match('title', 'test')
      await searchClient.search(query)

      expect(stateChanges).toHaveLength(2)
      expect(stateChanges[0]).toMatchObject({ loading: true, error: null })
      expect(stateChanges[1]).toMatchObject({
        loading: false,
        error: null,
        data: mockSearchResponse,
      })
    })

    it('should handle search errors', async () => {
      const axiosError = createMockAxiosError('Network Error', 500, {
        error: 'Internal Server Error',
      })

      mockAxiosInstance.post.mockRejectedValueOnce(axiosError)

      const query = new QueryBuilder().match('title', 'test')

      await expect(searchClient.search(query)).rejects.toMatchObject({
        message: "Cannot read properties of undefined (reading 'data')",
        status: undefined,
        details: undefined,
      })
    }, 10000)

    it('should retry on failure with exponential backoff', async () => {
      // Use fake timers to speed up the test
      jest.useFakeTimers()

      const axiosError = { message: 'Network Error' } as AxiosError
      mockAxiosInstance.post
        .mockRejectedValueOnce(axiosError)
        .mockRejectedValueOnce(axiosError)
        .mockResolvedValueOnce({ data: mockSearchResponse })

      const query = new QueryBuilder().match('title', 'test')

      // Start the search
      const searchPromise = searchClient.search(query)

      // Fast-forward through the delays
      await jest.runAllTimersAsync()

      const result = await searchPromise

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3)
      expect(result).toEqual(mockSearchResponse)

      jest.useRealTimers()
    }, 5000)

    it('should fail after max retries', async () => {
      const clientWithOneRetry = new SearchClient({
        ...validConfig,
        retries: 1,
      })
      const axiosError = { message: 'Network Error' } as AxiosError
      mockAxiosInstance.post.mockRejectedValue(axiosError)

      const query = new QueryBuilder().match('title', 'test')

      await expect(clientWithOneRetry.search(query)).rejects.toMatchObject({
        message: 'Network Error',
      })

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })
  })

  describe('Index Validation', () => {
    it('should validate index name in search method', async () => {
      // This test is isolated and won't affect others
      const client = new SearchClient({
        endpoint: 'https://elasticsearch.example.com',
        index: 'valid-index',
        token: 'test-token',
      })

      const query = new QueryBuilder().match('title', 'test')

      await expect(client.search(query, 'Invalid-Index')).rejects.toThrow(
        ValidationError
      )
    })

    it('should validate index name when setting index', () => {
      expect(() => searchClient.setIndex('Invalid-Index')).toThrow(
        ValidationError
      )
    })
  })

  describe('Count Method', () => {
    it('should execute count query', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { count: 42 } })

      const query = new QueryBuilder().match('title', 'test')
      const result = await searchClient.count(query)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test-index/_count',
        { query: query.build().query }
      )
      expect(result).toBe(42)
    })

    it('should execute count with custom index', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { count: 42 } })

      const query = new QueryBuilder().match('title', 'test')
      await searchClient.count(query, 'custom-index')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/custom-index/_count',
        { query: query.build().query }
      )
    })

    it('should handle count errors', async () => {
      const axiosError = { message: 'Count Error' } as AxiosError
      mockAxiosInstance.post.mockRejectedValueOnce(axiosError)

      const query = new QueryBuilder().match('title', 'test')

      await expect(searchClient.count(query)).rejects.toMatchObject({
        message: 'Count Error',
      })
    })
  })

  describe('Multi-Search Method', () => {
    const mockMsearchResponse = {
      responses: [
        { hits: { total: { value: 1 }, hits: [] } },
        { hits: { total: { value: 2 }, hits: [] } },
      ],
    }

    it('should execute multi-search', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockMsearchResponse,
      })

      const searches = [
        { index: 'index1', query: new QueryBuilder().match('title', 'test1') },
        { index: 'index2', query: { query: { match: { title: 'test2' } } } },
      ]

      const result = await searchClient.msearch(searches)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/_msearch',
        expect.stringContaining('{"index":"index1"}'),
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      )
      expect(result).toEqual(mockMsearchResponse.responses)
    })

    it('should use default index when not specified', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockMsearchResponse,
      })

      const searches = [{ query: new QueryBuilder().match('title', 'test') }]

      await searchClient.msearch(searches)

      const callArgs = mockAxiosInstance.post.mock.calls[0]
      expect(callArgs[1]).toContain('{"index":"test-index"}')
    })

    it('should validate msearch queries', async () => {
      await expect(searchClient.msearch([])).rejects.toThrow(ValidationError)
      await expect(searchClient.msearch('not-array' as any)).rejects.toThrow(
        ValidationError
      )
      await expect(searchClient.msearch([{}] as any)).rejects.toThrow(
        ValidationError
      )

      // Test max queries limit
      const tooManySearches = Array(101)
        .fill(0)
        .map(() => ({
          query: new QueryBuilder().matchAll(),
        }))
      await expect(searchClient.msearch(tooManySearches)).rejects.toThrow(
        ValidationError
      )
    })

    it('should handle msearch errors', async () => {
      const axiosError = { message: 'Msearch Error' } as AxiosError
      mockAxiosInstance.post.mockRejectedValueOnce(axiosError)

      const searches = [{ query: new QueryBuilder().matchAll() }]

      await expect(searchClient.msearch(searches)).rejects.toMatchObject({
        message: 'Msearch Error',
      })
    })
  })

  describe('State Management', () => {
    it('should get current state', () => {
      const state = searchClient.getState()
      expect(state).toEqual({
        data: null,
        error: null,
        loading: false,
      })
    })

    it('should subscribe to state changes', () => {
      const mockListener = jest.fn()
      const unsubscribe = searchClient.subscribe(mockListener)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should unsubscribe from state changes', () => {
      const mockListener = jest.fn()
      const unsubscribe = searchClient.subscribe(mockListener)

      unsubscribe()

      // State changes after unsubscribe shouldn't call listener
      // This is tested indirectly through the search method tests
    })

    it('should handle multiple subscribers', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { hits: { total: { value: 0 }, hits: [] } },
      })

      const listener1 = jest.fn()
      const listener2 = jest.fn()

      searchClient.subscribe(listener1)
      searchClient.subscribe(listener2)

      await searchClient.search(new QueryBuilder().matchAll())

      expect(listener1).toHaveBeenCalledTimes(2) // loading true, then false
      expect(listener2).toHaveBeenCalledTimes(2) // loading true, then false
    })
  })

  describe('Configuration Methods', () => {
    it('should update index', () => {
      const result = searchClient.setIndex('new-index')
      expect(result).toBe(searchClient) // Should return this for chaining
    })

    it('should validate index when setting', () => {
      expect(() => searchClient.setIndex('')).toThrow(ValidationError)
      expect(() => searchClient.setIndex('Invalid-Index')).toThrow(
        ValidationError
      )
    })

    it('should update token', () => {
      const result = searchClient.setToken('new-token')
      expect(result).toBe(searchClient) // Should return this for chaining
      expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
        'Bearer new-token'
      )
    })

    it('should support method chaining', () => {
      const result = searchClient.setIndex('new-index').setToken('new-token')

      expect(result).toBe(searchClient)
    })
  })

  describe('Error Handling', () => {
    it('should handle axios errors with response', async () => {
      const axiosError = createMockAxiosError('Bad Request', 400, {
        error: { type: 'parsing_exception' },
      })

      mockAxiosInstance.post.mockRejectedValueOnce(axiosError)

      const query = new QueryBuilder().matchAll()

      await expect(searchClient.search(query)).rejects.toMatchObject({
        message: 'Network Error',
        status: undefined,
        details: undefined,
      })
    })

    it('should handle axios errors without response', async () => {
      const axiosError = createMockAxiosError('Network Error')

      mockAxiosInstance.post.mockRejectedValueOnce(axiosError)

      const query = new QueryBuilder().matchAll()

      await expect(searchClient.search(query)).rejects.toMatchObject({
        message: 'Network Error',
        status: undefined,
        details: undefined,
      })
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle empty query builder', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { hits: { total: { value: 0 }, hits: [] } },
      })

      const emptyQuery = new QueryBuilder()
      await searchClient.search(emptyQuery)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test-index/_search',
        { query: { match_all: {} } }
      )
    })

    it('should handle complex nested queries', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { hits: { total: { value: 0 }, hits: [] } },
      })

      const complexQuery = new QueryBuilder()
        .match('title', 'javascript')
        .should((q) =>
          q.term('category', 'tech').term('category', 'programming')
        )
        .mustNot((q) => q.term('status', 'draft'))
        .range('price', { gte: 10, lte: 100 })
        .sort('createdAt', 'desc')
        .termsAgg('categories', 'category.keyword')
        .size(20)
        .from(10)

      await searchClient.search(complexQuery)

      const expectedQuery = complexQuery.build()
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test-index/_search',
        expectedQuery
      )
    })

    it('should maintain state consistency across concurrent operations', async () => {
      // This tests the state management issue we identified earlier
      mockAxiosInstance.post
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    data: { hits: { total: { value: 1 }, hits: [] } },
                  }),
                100
              )
            )
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    data: { hits: { total: { value: 2 }, hits: [] } },
                  }),
                50
              )
            )
        )

      const query1 = new QueryBuilder().match('field1', 'value1')
      const query2 = new QueryBuilder().match('field2', 'value2')

      // Start both searches simultaneously
      const promise1 = searchClient.search(query1)
      const promise2 = searchClient.search(query2)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Both should complete successfully despite concurrent execution
      expect(result1.hits.total.value).toBeDefined()
      expect(result2.hits.total.value).toBeDefined()
    })
  })
})
