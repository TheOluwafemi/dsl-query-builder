import { QueryDSL, SortOrder, SortOption, RangeQuery } from './types'

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
    this.query.from = value
    return this
  }

  /**
   * Set pagination - size/limit
   */
  size(value: number): this {
    this.query.size = value
    return this
  }

  /**
   * Add a match query to must clause
   */
  match(field: string, value: any, operator?: 'and' | 'or'): this {
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
    this.ensureBoolQuery()
    this.query.query!.bool!.must!.push({
      match_phrase: { [field]: value },
    })
    return this
  }

  /**
   * Add a term query to filter clause
   */
  term(field: string, value: any): this {
    this.ensureBoolQuery()
    this.query.query!.bool!.filter!.push({
      term: { [field]: value },
    })
    return this
  }

  /**
   * Add a terms query to filter clause
   */
  terms(field: string, values: any[]): this {
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
