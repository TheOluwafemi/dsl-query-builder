import { SearchClient } from '../src/search-client'
import { ResponseTransformers } from '../src/response-transformers'
import { createQuery } from '../src/index'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockAxios = axios as jest.Mocked<typeof axios>
const mockAxiosInstance = {
  post: jest.fn(),
  defaults: { headers: { common: {} as Record<string, string> } },
}
mockAxios.create = jest.fn(() => mockAxiosInstance as any)

describe('Response Transformers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ResponseTransformers.fromSimplified', () => {
    it('should transform simplified proxy response to standard format', () => {
      const proxyResponse = {
        results: [
          { id: '1', title: 'Test Document 1', score: 0.9 },
          { id: '2', title: 'Test Document 2', score: 0.7 },
        ],
        total: 2,
        took: 5,
      }

      const standardResponse =
        ResponseTransformers.fromSimplified(proxyResponse)

      expect(standardResponse).toMatchObject({
        took: 5,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 2, relation: 'eq' },
          max_score: null,
          hits: [
            {
              _index: 'unknown',
              _id: '1',
              _score: 0.9,
              _source: { id: '1', title: 'Test Document 1', score: 0.9 },
            },
            {
              _index: 'unknown',
              _id: '2',
              _score: 0.7,
              _source: { id: '2', title: 'Test Document 2', score: 0.7 },
            },
          ],
        },
      })
    })

    it('should pass through standard Elasticsearch responses unchanged', () => {
      const standardResponse = {
        took: 5,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 1, relation: 'eq' },
          max_score: 1.0,
          hits: [
            {
              _index: 'test',
              _id: '1',
              _score: 1.0,
              _source: { title: 'Test' },
            },
          ],
        },
      }

      const result = ResponseTransformers.fromSimplified(standardResponse)
      expect(result).toEqual(standardResponse)
    })
  })

  describe('ResponseTransformers.fromNested', () => {
    it('should transform nested proxy response format', () => {
      const nestedResponse = {
        data: {
          items: [{ id: 'doc1', data: { title: 'Nested Document' } }],
          metadata: {
            total: 1,
            took: 10,
            index: 'nested-index',
          },
        },
      }

      const standardResponse = ResponseTransformers.fromNested(nestedResponse)

      expect(standardResponse.hits.hits[0]).toMatchObject({
        _index: 'nested-index',
        _id: 'doc1',
        _source: { title: 'Nested Document' },
      })
      expect(standardResponse.hits.total.value).toBe(1)
      expect(standardResponse.took).toBe(10)
    })
  })

  describe('SearchClient with Response Transformer', () => {
    it('should use response transformer for search results', async () => {
      const proxyResponse = {
        results: [{ id: '1', title: 'Transformed Document' }],
        total: 1,
      }

      mockAxiosInstance.post.mockResolvedValueOnce({ data: proxyResponse })

      const client = new SearchClient({
        endpoint: 'https://proxy-service.com',
        responseTransformer: ResponseTransformers.fromSimplified,
      })

      const result = await client.search(createQuery().match('title', 'test'))

      // Should have standard Elasticsearch structure after transformation
      expect(result.hits).toBeDefined()
      expect(result.hits.hits).toHaveLength(1)
      expect(result.hits.hits[0]._source).toEqual({
        id: '1',
        title: 'Transformed Document',
      })
      expect(result.hits.total.value).toBe(1)
    })

    it('should use response transformer for msearch results', async () => {
      const msearchProxyResponse = {
        responses: [
          {
            results: [{ id: '1', title: 'Multi-search Result 1' }],
            total: 1,
          },
          {
            results: [{ id: '2', title: 'Multi-search Result 2' }],
            total: 1,
          },
        ],
      }

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: msearchProxyResponse,
      })

      const client = new SearchClient({
        endpoint: 'https://proxy-service.com',
        responseTransformer: ResponseTransformers.fromSimplified,
      })

      const results = await client.msearch([
        { index: 'index1', query: createQuery().match('title', 'test1') },
        { index: 'index2', query: createQuery().match('title', 'test2') },
      ])

      // Both results should be transformed to standard format
      expect(results).toHaveLength(2)
      expect(results[0].hits.hits[0]._source.title).toBe(
        'Multi-search Result 1'
      )
      expect(results[1].hits.hits[0]._source.title).toBe(
        'Multi-search Result 2'
      )
    })

    it('should work without response transformer (pass-through)', async () => {
      const standardResponse = {
        took: 5,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 1, relation: 'eq' },
          max_score: 1.0,
          hits: [
            {
              _index: 'test',
              _id: '1',
              _score: 1.0,
              _source: { title: 'Standard Response' },
            },
          ],
        },
      }

      mockAxiosInstance.post.mockResolvedValueOnce({ data: standardResponse })

      const client = new SearchClient({
        endpoint: 'https://elasticsearch.com',
        // No response transformer - should pass through unchanged
      })

      const result = await client.search(createQuery().match('title', 'test'))

      expect(result).toEqual(standardResponse)
    })
  })
})
