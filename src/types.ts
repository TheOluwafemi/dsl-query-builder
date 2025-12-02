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

// Fuzzy query options
export interface FuzzyQuery {
  value: string
  fuzziness?: string | number
  max_expansions?: number
  prefix_length?: number
  transpositions?: boolean
  boost?: number
}

// Geo query interfaces
export interface GeoPoint {
  lat: number
  lon: number
}

export interface GeoDistance {
  distance: string
  [field: string]: GeoPoint | string
}

export interface GeoBoundingBox {
  [field: string]: {
    top_left: GeoPoint
    bottom_right: GeoPoint
  }
}

export interface GeoPolygon {
  [field: string]: {
    points: GeoPoint[]
  }
}

// Nested query interface
export interface NestedQuery {
  path: string
  query: any
  score_mode?: 'avg' | 'sum' | 'max' | 'min' | 'none'
}

// Function score interfaces
export interface FunctionScore {
  functions: Array<{
    filter?: any
    weight?: number
    field_value_factor?: {
      field: string
      factor?: number
      modifier?: string
    }
    script_score?: {
      script: string
    }
  }>
  boost_mode?: 'multiply' | 'replace' | 'sum' | 'avg' | 'max' | 'min'
  score_mode?: 'multiply' | 'sum' | 'avg' | 'first' | 'max' | 'min'
}

// Aggregation interfaces
export interface TermsAggregation {
  field: string
  size?: number
  order?: Record<string, SortOrder>
  include?: string | string[]
  exclude?: string | string[]
}

export interface DateHistogramAggregation {
  field: string
  calendar_interval?: string
  fixed_interval?: string
  format?: string
  time_zone?: string
  min_doc_count?: number
}

export interface RangeAggregation {
  field: string
  ranges: Array<{
    from?: number
    to?: number
    key?: string
  }>
}

export interface HistogramAggregation {
  field: string
  interval: number
  min_doc_count?: number
}

// Re-export validation error
export { ValidationError } from './validation'
