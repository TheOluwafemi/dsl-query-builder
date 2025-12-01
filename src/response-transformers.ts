import { SearchResponse } from './types'

/**
 * Common response transformers for proxy services
 */
export class ResponseTransformers {
  /**
   * Transform a simplified proxy response to standard Elasticsearch format
   * Example: { results: [...], total: 100 } -> { hits: { hits: [...], total: { value: 100 } } }
   */
  static fromSimplified<T>(response: any): SearchResponse<T> {
    if (response.hits && response.hits.hits) {
      // Already in standard format
      return response
    }

    // Transform simplified format
    return {
      took: response.took || 0,
      timed_out: response.timed_out || false,
      _shards: response._shards || {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: {
          value: response.total || response.count || 0,
          relation: 'eq',
        },
        max_score: response.max_score || null,
        hits: (response.results || response.hits || []).map(
          (item: any, index: number) => ({
            _index: response.index || 'unknown',
            _id: item.id || item._id || String(index),
            _score: item.score || item._score || 1.0,
            _source: item.data || item._source || item,
          })
        ),
      },
      aggregations: response.aggregations || response.aggs,
    }
  }

  /**
   * Transform a nested proxy response format
   * Example: { data: { items: [...], metadata: { total: 100 } } }
   */
  static fromNested<T>(response: any): SearchResponse<T> {
    const data = response.data || response
    const items = data.items || data.results || data.documents || []
    const metadata = data.metadata || data.meta || {}

    return {
      took: metadata.took || data.took || 0,
      timed_out: metadata.timed_out || data.timed_out || false,
      _shards: metadata._shards || {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: {
          value: metadata.total || metadata.count || items.length,
          relation: 'eq',
        },
        max_score: metadata.max_score || null,
        hits: items.map((item: any, index: number) => ({
          _index: metadata.index || 'unknown',
          _id: item.id || item._id || String(index),
          _score: item.score || item._score || 1.0,
          _source: item.data || item._source || item,
        })),
      },
      aggregations: data.aggregations || data.aggs,
    }
  }

  /**
   * Transform a GraphQL-style response
   * Example: { searchResults: { edges: [...], pageInfo: {...} } }
   */
  static fromGraphQL<T>(response: any): SearchResponse<T> {
    const searchData =
      response.data?.searchResults || response.searchResults || response
    const edges = searchData.edges || []
    const pageInfo = searchData.pageInfo || {}

    return {
      took: response.extensions?.took || 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: {
          value: pageInfo.totalCount || edges.length,
          relation: 'eq',
        },
        max_score: null,
        hits: edges.map((edge: any, index: number) => ({
          _index: 'unknown',
          _id: edge.node.id || String(index),
          _score: edge.node.score || 1.0,
          _source: edge.node,
        })),
      },
      aggregations: searchData.aggregations,
    }
  }

  /**
   * Pass-through transformer for standard Elasticsearch responses
   */
  static standard<T>(response: any): SearchResponse<T> {
    return response
  }
}
