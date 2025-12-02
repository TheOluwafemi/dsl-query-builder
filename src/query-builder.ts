import { QueryDSL, SortOrder, SortOption, RangeQuery } from './types'
import {
  validateFieldName,
  validateQueryValue,
  validatePaginationParams,
  validateSortOrder,
  validateRangeQuery,
  validateStringArray,
  validateMultiMatchType,
  validateAggregationName,
} from './validation'

export class QueryBuilder {
  private query: QueryDSL = {
    query: {
      bool: {
        must: [],
        filter: [],
        should: [],
        must_not: [],
      },
    },
  }

  constructor() {}

  /**
   * Set pagination - from offset
   */
  from(value: number): this {
    validatePaginationParams(value, undefined)
    this.query.from = value
    return this
  }

  /**
   * Set pagination - size/limit
   */
  size(value: number): this {
    validatePaginationParams(undefined, value, 'size')
    this.query.size = value
    return this
  }

  /**
   * Add a match query to must clause
   */
  match(field: string, value: any, operator?: 'and' | 'or'): this {
    validateFieldName(field, 'match query')
    validateQueryValue(value, 'match query')
    this.ensureBoolQuery()
    const matchQuery: any = { match: { [field]: { query: value } } }
    if (operator) {
      matchQuery.match[field].operator = operator
    }
    this.query.query!.bool!.must!.push(matchQuery)
    return this
  }

  /**
   * Add a match_phrase query to must clause
   */
  matchPhrase(field: string, value: string): this {
    validateFieldName(field, 'match_phrase query')
    validateQueryValue(value, 'match_phrase query')
    this.ensureBoolQuery()
    this.query.query!.bool!.must!.push({
      match_phrase: { [field]: value },
    })
    return this
  }

  /**
   * Add a term query to filter clause
   * Automatically appends '.keyword' to field name for exact matching
   */
  term(field: string, value: any): this {
    validateFieldName(field, 'term query')
    validateQueryValue(value, 'term query')
    this.ensureBoolQuery()

    // Append .keyword if not already present
    const fieldName = field.endsWith('.keyword') ? field : `${field}.keyword`

    this.query.query!.bool!.filter!.push({
      term: { [fieldName]: value },
    })
    return this
  }

  /**
   * Add a terms query to filter clause
   */
  terms(field: string, values: any[]): this {
    validateFieldName(field, 'terms query')
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('terms query values must be a non-empty array')
    }
    this.ensureBoolQuery()
    this.query.query!.bool!.filter!.push({
      terms: { [field]: values },
    })
    return this
  }

  /**
   * Add a range query to filter clause
   */
  range(field: string, range: RangeQuery): this {
    validateFieldName(field, 'range query')
    validateRangeQuery(range)
    this.ensureBoolQuery()
    this.query.query!.bool!.filter!.push({
      range: { [field]: range },
    })
    return this
  }

  /**
   * Add a exists query to filter clause
   */
  exists(field: string): this {
    validateFieldName(field, 'exists query')
    this.ensureBoolQuery()
    this.query.query!.bool!.filter!.push({
      exists: { field },
    })
    return this
  }

  /**
   * Add a wildcard query to must clause
   */
  wildcard(field: string, value: string): this {
    validateFieldName(field, 'wildcard query')
    validateQueryValue(value, 'wildcard query')
    this.ensureBoolQuery()
    this.query.query!.bool!.must!.push({
      wildcard: { [field]: value },
    })
    return this
  }

  /**
   * Add a prefix query to must clause
   */
  prefix(field: string, value: string): this {
    validateFieldName(field, 'prefix query')
    validateQueryValue(value, 'prefix query')
    this.ensureBoolQuery()
    this.query.query!.bool!.must!.push({
      prefix: { [field]: value },
    })
    return this
  }

  /**
   * Add a should clause (OR condition)
   */
  should(callback: (builder: QueryBuilder) => void): this {
    this.ensureBoolQuery()
    const subBuilder = new QueryBuilder()
    callback(subBuilder)

    const subQuery = subBuilder.build()
    if (subQuery.query?.bool?.must && subQuery.query.bool.must.length > 0) {
      this.query.query!.bool!.should!.push(...subQuery.query.bool.must)
    }
    if (subQuery.query?.bool?.filter && subQuery.query.bool.filter.length > 0) {
      this.query.query!.bool!.should!.push(...subQuery.query.bool.filter)
    }

    return this
  }

  /**
   * Set minimum_should_match for should clauses
   */
  minimumShouldMatch(value: number): this {
    this.ensureBoolQuery()
    this.query.query!.bool!.minimum_should_match = value
    return this
  }

  /**
   * Add a must_not clause
   */
  mustNot(callback: (builder: QueryBuilder) => void): this {
    this.ensureBoolQuery()
    const subBuilder = new QueryBuilder()
    callback(subBuilder)

    const subQuery = subBuilder.build()
    if (subQuery.query?.bool?.must && subQuery.query.bool.must.length > 0) {
      this.query.query!.bool!.must_not!.push(...subQuery.query.bool.must)
    }
    if (subQuery.query?.bool?.filter && subQuery.query.bool.filter.length > 0) {
      this.query.query!.bool!.must_not!.push(...subQuery.query.bool.filter)
    }

    return this
  }

  /**
   * Add multi_match query
   */
  multiMatch(fields: string[], value: string, type?: string): this {
    validateStringArray(fields, 'multi_match fields')
    validateQueryValue(value, 'multi_match query')
    if (type !== undefined) {
      validateMultiMatchType(type)
    }
    this.ensureBoolQuery()
    const multiMatchQuery: any = {
      multi_match: {
        query: value,
        fields,
      },
    }
    if (type) {
      multiMatchQuery.multi_match.type = type
    }
    this.query.query!.bool!.must!.push(multiMatchQuery)
    return this
  }

  /**
   * Add sorting
   */
  sort(field: string, order: SortOrder = 'asc'): this {
    validateFieldName(field, 'sort')
    validateSortOrder(order)
    if (!this.query.sort) {
      this.query.sort = []
    }
    this.query.sort.push({ [field]: order })
    return this
  }

  /**
   * Add complex sorting with options
   */
  sortBy(options: SortOption): this {
    if (!this.query.sort) {
      this.query.sort = []
    }
    this.query.sort.push(options)
    return this
  }

  /**
   * Clear all sorting
   */
  clearSort(): this {
    this.query.sort = []
    return this
  }

  /**
   * Set source fields to return
   */
  source(fields: string[] | boolean): this {
    this.query._source = fields
    return this
  }

  /**
   * Add aggregation
   */
  aggregate(name: string, aggregation: any): this {
    validateAggregationName(name)
    if (!aggregation || typeof aggregation !== 'object') {
      throw new Error('Aggregation must be an object')
    }
    if (!this.query.aggs) {
      this.query.aggs = {}
    }
    this.query.aggs[name] = aggregation
    return this
  }

  /**
   * Add terms aggregation helper
   */
  termsAgg(name: string, field: string, size: number = 10): this {
    validateFieldName(field, 'terms aggregation')
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Terms aggregation size must be a positive integer')
    }
    return this.aggregate(name, {
      terms: { field, size },
    })
  }

  /**
   * Add date histogram aggregation helper
   */
  dateHistogramAgg(
    name: string,
    field: string,
    interval: string,
    format?: string
  ): this {
    validateFieldName(field, 'date histogram aggregation')
    if (
      !interval ||
      typeof interval !== 'string' ||
      interval.trim().length === 0
    ) {
      throw new Error('Date histogram interval must be a non-empty string')
    }
    const agg: any = {
      date_histogram: {
        field,
        calendar_interval: interval,
      },
    }
    if (format) {
      agg.date_histogram.format = format
    }
    return this.aggregate(name, agg)
  }

  /**
   * Add highlighting
   */
  highlight(fields: string[] | Record<string, any>): this {
    if (Array.isArray(fields)) {
      this.query.highlight = {
        fields: fields.reduce((acc, field) => {
          acc[field] = {}
          return acc
        }, {} as Record<string, any>),
      }
    } else {
      this.query.highlight = { fields }
    }
    return this
  }

  /**
   * Track total hits
   */
  trackTotalHits(value: boolean = true): this {
    this.query.track_total_hits = value
    return this
  }

  /**
   * Add a raw query to must clause
   */
  raw(
    query: any,
    clause: 'must' | 'filter' | 'should' | 'must_not' = 'must'
  ): this {
    this.ensureBoolQuery()
    this.query.query!.bool![clause]!.push(query)
    return this
  }

  /**
   * Replace the entire query object
   */
  setQuery(query: any): this {
    this.query.query = query
    return this
  }

  /**
   * Match all documents
   */
  matchAll(): this {
    this.query.query = { match_all: {} }
    return this
  }

  /**
   * Reset/clear the query builder
   */
  reset(): this {
    this.query = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
          must_not: [],
        },
      },
    }
    return this
  }

  /**
   * Build and return the final query DSL
   */
  build(): QueryDSL {
    // Clean up empty arrays
    const cleanedQuery = JSON.parse(JSON.stringify(this.query))

    if (cleanedQuery.query?.bool) {
      const bool = cleanedQuery.query.bool
      if (bool.must?.length === 0) delete bool.must
      if (bool.filter?.length === 0) delete bool.filter
      if (bool.should?.length === 0) delete bool.should
      if (bool.must_not?.length === 0) delete bool.must_not

      // If bool is empty, remove it
      if (Object.keys(bool).length === 0) {
        cleanedQuery.query = { match_all: {} }
      }
    }

    if (cleanedQuery.sort?.length === 0) {
      delete cleanedQuery.sort
    }

    return cleanedQuery
  }

  /**
   * Clone the current query builder
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder()
    cloned.query = JSON.parse(JSON.stringify(this.query))
    return cloned
  }

  // ========================================
  // ADVANCED QUERY TYPES
  // ========================================

  /**
   * Add a fuzzy query
   */
  fuzzy(
    field: string,
    value: string,
    options?: { fuzziness?: string | number; boost?: number }
  ): this {
    validateFieldName(field, 'fuzzy query')
    validateQueryValue(value, 'fuzzy query')
    this.ensureBoolQuery()

    const fuzzyQuery: any = { fuzzy: { [field]: { value } } }
    if (options?.fuzziness)
      fuzzyQuery.fuzzy[field].fuzziness = options.fuzziness
    if (options?.boost) fuzzyQuery.fuzzy[field].boost = options.boost

    this.query.query!.bool!.must!.push(fuzzyQuery)
    return this
  }

  /**
   * Add a regexp query
   */
  regexp(field: string, value: string, flags?: string): this {
    validateFieldName(field, 'regexp query')
    validateQueryValue(value, 'regexp query')
    this.ensureBoolQuery()

    const regexpQuery: any = { regexp: { [field]: { value } } }
    if (flags) regexpQuery.regexp[field].flags = flags

    this.query.query!.bool!.must!.push(regexpQuery)
    return this
  }

  /**
   * Add a query string query
   */
  queryString(
    queryStr: string,
    options?: { fields?: string[]; default_operator?: 'AND' | 'OR' }
  ): this {
    validateQueryValue(queryStr, 'query_string query')
    this.ensureBoolQuery()

    const queryStringQuery: any = { query_string: { query: queryStr } }
    if (options?.fields) queryStringQuery.query_string.fields = options.fields
    if (options?.default_operator)
      queryStringQuery.query_string.default_operator = options.default_operator

    this.query.query!.bool!.must!.push(queryStringQuery)
    return this
  }

  /**
   * Add a simple query string query
   */
  simpleQueryString(queryStr: string, fields?: string[]): this {
    validateQueryValue(queryStr, 'simple_query_string query')
    this.ensureBoolQuery()

    const simpleQuery: any = { simple_query_string: { query: queryStr } }
    if (fields) simpleQuery.simple_query_string.fields = fields

    this.query.query!.bool!.must!.push(simpleQuery)
    return this
  }

  /**
   * Add a nested query
   */
  nested(path: string, callback: (builder: QueryBuilder) => void): this {
    validateFieldName(path, 'nested query')
    this.ensureBoolQuery()

    const nestedBuilder = new QueryBuilder()
    callback(nestedBuilder)

    const nestedQuery = {
      nested: {
        path,
        query: nestedBuilder.build().query,
      },
    }

    this.query.query!.bool!.must!.push(nestedQuery)
    return this
  }

  /**
   * Add a has_child query
   */
  hasChild(type: string, callback: (builder: QueryBuilder) => void): this {
    validateQueryValue(type, 'has_child query')
    this.ensureBoolQuery()

    const childBuilder = new QueryBuilder()
    callback(childBuilder)

    const hasChildQuery = {
      has_child: {
        type,
        query: childBuilder.build().query,
      },
    }

    this.query.query!.bool!.must!.push(hasChildQuery)
    return this
  }

  /**
   * Add a has_parent query
   */
  hasParent(type: string, callback: (builder: QueryBuilder) => void): this {
    validateQueryValue(type, 'has_parent query')
    this.ensureBoolQuery()

    const parentBuilder = new QueryBuilder()
    callback(parentBuilder)

    const hasParentQuery = {
      has_parent: {
        parent_type: type,
        query: parentBuilder.build().query,
      },
    }

    this.query.query!.bool!.must!.push(hasParentQuery)
    return this
  }

  // ========================================
  // GEO QUERIES
  // ========================================

  /**
   * Add a geo_distance query
   */
  geoDistance(field: string, distance: string, lat: number, lon: number): this {
    validateFieldName(field, 'geo_distance query')
    validateQueryValue(distance, 'geo_distance query')
    this.ensureBoolQuery()

    const geoDistanceQuery = {
      geo_distance: {
        distance,
        [field]: { lat, lon },
      },
    }

    this.query.query!.bool!.filter!.push(geoDistanceQuery)
    return this
  }

  /**
   * Add a geo_bounding_box query
   */
  geoBoundingBox(
    field: string,
    topLeft: [number, number],
    bottomRight: [number, number]
  ): this {
    validateFieldName(field, 'geo_bounding_box query')
    this.ensureBoolQuery()

    const geoBBoxQuery = {
      geo_bounding_box: {
        [field]: {
          top_left: { lat: topLeft[0], lon: topLeft[1] },
          bottom_right: { lat: bottomRight[0], lon: bottomRight[1] },
        },
      },
    }

    this.query.query!.bool!.filter!.push(geoBBoxQuery)
    return this
  }

  /**
   * Add a geo_polygon query
   */
  geoPolygon(field: string, points: Array<[number, number]>): this {
    validateFieldName(field, 'geo_polygon query')
    if (!Array.isArray(points) || points.length < 3) {
      throw new Error('geo_polygon query requires at least 3 points')
    }
    this.ensureBoolQuery()

    const geoPolygonQuery = {
      geo_polygon: {
        [field]: {
          points: points.map(([lat, lon]) => ({ lat, lon })),
        },
      },
    }

    this.query.query!.bool!.filter!.push(geoPolygonQuery)
    return this
  }

  // ========================================
  // SCRIPT AND FUNCTION SCORE
  // ========================================

  /**
   * Add a script query
   */
  script(script: string, params?: Record<string, any>): this {
    validateQueryValue(script, 'script query')
    this.ensureBoolQuery()

    const scriptQuery: any = { script: { script: { source: script } } }
    if (params) scriptQuery.script.script.params = params

    this.query.query!.bool!.must!.push(scriptQuery)
    return this
  }

  /**
   * Add a more_like_this query
   */
  moreLikeThis(fields: string[], texts?: string[], docs?: any[]): this {
    validateStringArray(fields, 'more_like_this fields')
    this.ensureBoolQuery()

    const mltQuery: any = { more_like_this: { fields } }
    if (texts && texts.length > 0) mltQuery.more_like_this.like = texts
    if (docs && docs.length > 0) {
      mltQuery.more_like_this.like = mltQuery.more_like_this.like || []
      mltQuery.more_like_this.like.push(...docs)
    }

    this.query.query!.bool!.must!.push(mltQuery)
    return this
  }

  /**
   * Apply function score to the query
   */
  functionScore(
    functions: any[],
    options?: { boost_mode?: string; score_mode?: string }
  ): this {
    const currentQuery = this.query.query

    this.query.query = {
      function_score: {
        query: currentQuery,
        functions,
        boost_mode: options?.boost_mode || 'multiply',
        score_mode: options?.score_mode || 'multiply',
      },
    }

    return this
  }

  /**
   * Apply constant score to the query
   */
  constantScore(boost: number): this {
    const currentQuery = this.query.query

    this.query.query = {
      constant_score: {
        filter: currentQuery,
        boost,
      },
    }

    return this
  }

  // ========================================
  // ENHANCED AGGREGATIONS
  // ========================================

  /**
   * Add average aggregation
   */
  avgAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'avg aggregation')
    return this.aggregate(name, { avg: { field } })
  }

  /**
   * Add sum aggregation
   */
  sumAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'sum aggregation')
    return this.aggregate(name, { sum: { field } })
  }

  /**
   * Add max aggregation
   */
  maxAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'max aggregation')
    return this.aggregate(name, { max: { field } })
  }

  /**
   * Add min aggregation
   */
  minAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'min aggregation')
    return this.aggregate(name, { min: { field } })
  }

  /**
   * Add cardinality aggregation
   */
  cardinalityAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'cardinality aggregation')
    return this.aggregate(name, { cardinality: { field } })
  }

  /**
   * Add value count aggregation
   */
  valueCountAgg(name: string, field: string): this {
    validateAggregationName(name)
    validateFieldName(field, 'value_count aggregation')
    return this.aggregate(name, { value_count: { field } })
  }

  /**
   * Add histogram aggregation
   */
  histogramAgg(name: string, field: string, interval: number): this {
    validateAggregationName(name)
    validateFieldName(field, 'histogram aggregation')
    if (!Number.isInteger(interval) || interval <= 0) {
      throw new Error('Histogram interval must be a positive integer')
    }
    return this.aggregate(name, { histogram: { field, interval } })
  }

  /**
   * Add range aggregation
   */
  rangeAgg(
    name: string,
    field: string,
    ranges: Array<{ from?: number; to?: number; key?: string }>
  ): this {
    validateAggregationName(name)
    validateFieldName(field, 'range aggregation')
    if (!Array.isArray(ranges) || ranges.length === 0) {
      throw new Error('Range aggregation requires at least one range')
    }
    return this.aggregate(name, { range: { field, ranges } })
  }

  /**
   * Add filters aggregation
   */
  filtersAgg(name: string, filters: Record<string, any>): this {
    validateAggregationName(name)
    if (!filters || typeof filters !== 'object') {
      throw new Error('Filters aggregation requires filters object')
    }
    return this.aggregate(name, { filters: { filters } })
  }

  /**
   * Add nested aggregation
   */
  nestedAgg(name: string, path: string): this {
    validateAggregationName(name)
    validateFieldName(path, 'nested aggregation')
    return this.aggregate(name, { nested: { path } })
  }

  // ========================================
  // QUERY UTILITIES
  // ========================================

  /**
   * Apply boost to the entire query
   */
  boost(value: number): this {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error('Boost value must be a positive number')
    }

    if (this.query.query && typeof this.query.query === 'object') {
      // Apply boost to the current query structure
      const currentQuery = this.query.query
      this.query.query = { ...currentQuery, boost: value }
    }

    return this
  }

  /**
   * Add explain flag
   */
  explain(): this {
    (this.query as any).explain = true
    return this
  }

  /**
   * Add profiling
   */
  profile(): this {
    (this.query as any).profile = true
    return this
  }

  /**
   * Validate the current query structure
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const built = this.build()
      if (!built.query) {
        errors.push('Query is missing query clause')
      }

      if (built.from && (built.from < 0 || !Number.isInteger(built.from))) {
        errors.push('from parameter must be a non-negative integer')
      }

      if (built.size && (built.size <= 0 || !Number.isInteger(built.size))) {
        errors.push('size parameter must be a positive integer')
      }
    } catch (error) {
      errors.push((error as Error).message)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get estimated query complexity
   */
  getComplexity(): number {
    const built = this.build()
    let complexity = 1

    if (built.query?.bool) {
      const bool = built.query.bool
      complexity += bool.must?.length || 0
      complexity += bool.filter?.length || 0
      complexity += bool.should?.length || 0
      complexity += bool.must_not?.length || 0
    }

    if (built.aggs) {
      complexity += Object.keys(built.aggs).length * 2
    }

    if (built.sort) {
      complexity += built.sort.length
    }

    return complexity
  }

  /**
   * Get query as formatted JSON string
   */
  toJSON(pretty: boolean = false): string {
    return pretty
      ? JSON.stringify(this.build(), null, 2)
      : JSON.stringify(this.build())
  }

  private ensureBoolQuery(): void {
    if (!this.query.query) {
      this.query.query = {}
    }
    if (!this.query.query.bool) {
      this.query.query.bool = {
        must: [],
        filter: [],
        should: [],
        must_not: [],
      }
    }
    if (!this.query.query.bool.must) this.query.query.bool.must = []
    if (!this.query.query.bool.filter) this.query.query.bool.filter = []
    if (!this.query.query.bool.should) this.query.query.bool.should = []
    if (!this.query.query.bool.must_not) this.query.query.bool.must_not = []
  }
}
