export interface SearchConfig {
  endpoint: string
  index?: string
  token?: string
  retries?: number
  timeout?: number
  headers?: Record<string, string>
}

export interface SearchResponse<T = any> {
  took: number
  timed_out: boolean
  _shards: {
    total: number
    successful: number
    skipped: number
    failed: number
  }
  hits: {
    total: {
      value: number
      relation: string
    }
    max_score: number | null
    hits: Array<{
      _index: string
      _id: string
      _score: number
      _source: T
    }>
  }
  aggregations?: Record<string, any>
}

export interface SearchError {
  message: string
  status?: number
  details?: any
}

export interface SearchState<T = any> {
  data: SearchResponse<T> | null
  error: SearchError | null
  loading: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  [field: string]: SortOrder | { order: SortOrder; [key: string]: any }
}

export interface QueryDSL {
  from?: number
  size?: number
  query?: {
    bool?: {
      must?: any[]
      filter?: any[]
      should?: any[]
      must_not?: any[]
      minimum_should_match?: number
    }
    match_all?: {}
    [key: string]: any
  }
  sort?: SortOption[]
  _source?: string[] | boolean
  aggs?: Record<string, any>
  highlight?: any
  track_total_hits?: boolean
}

export interface RangeQuery {
  gte?: any
  gt?: any
  lte?: any
  lt?: any
  boost?: number
}

export { ValidationError } from './validation'
