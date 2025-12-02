import { QueryBuilder } from './query-builder'

/**
 * E-commerce specialized query builder
 */
export class EcommerceQueryBuilder extends QueryBuilder {
  /**
   * Search for products with text, category, and price filters
   */
  searchProducts(
    searchTerm: string,
    options?: {
      category?: string
      priceRange?: { min: number; max: number }
      inStock?: boolean
      brands?: string[]
    }
  ): this {
    // Main search term
    if (searchTerm) {
      this.multiMatch(
        ['name', 'description', 'tags'],
        searchTerm,
        'best_fields'
      )
    }

    // Category filter
    if (options?.category) {
      this.term('category', options.category)
    }

    // Price range
    if (options?.priceRange) {
      const range: any = {}
      if (options.priceRange.min !== undefined)
        range.gte = options.priceRange.min
      if (options.priceRange.max !== undefined)
        range.lte = options.priceRange.max
      this.range('price', range)
    }

    // Stock filter
    if (options?.inStock !== undefined) {
      this.term('in_stock', options.inStock)
    }

    // Brand filters
    if (options?.brands && options.brands.length > 0) {
      this.terms('brand', options.brands)
    }

    return this
  }

  /**
   * Add common e-commerce aggregations
   */
  addEcommerceAggregations(): this {
    return this.termsAgg('categories', 'category.keyword', 10)
      .termsAgg('brands', 'brand.keyword', 20)
      .rangeAgg('price_ranges', 'price', [
        { to: 25, key: 'under_25' },
        { from: 25, to: 50, key: '25_to_50' },
        { from: 50, to: 100, key: '50_to_100' },
        { from: 100, to: 200, key: '100_to_200' },
        { from: 200, key: 'over_200' },
      ])
      .termsAgg('ratings', 'rating', 5)
  }

  /**
   * Sort by popularity/sales
   */
  sortByPopularity(): this {
    return this.sort('sales_count', 'desc').sort('rating', 'desc')
  }

  /**
   * Sort by price (low to high or high to low)
   */
  sortByPrice(direction: 'asc' | 'desc' = 'asc'): this {
    return this.sort('price', direction)
  }

  /**
   * Sort by newest first
   */
  sortByNewest(): this {
    return this.sort('created_at', 'desc')
  }

  /**
   * Add product recommendation query (more like this)
   */
  recommendSimilar(productId: string): this {
    return this.moreLikeThis(['name', 'description', 'category'], undefined, [
      { _index: 'products', _id: productId },
    ])
  }
}

/**
 * Logs and monitoring specialized query builder
 */
export class LogsQueryBuilder extends QueryBuilder {
  /**
   * Filter logs by time range
   */
  timeRange(from: string | Date, to: string | Date): this {
    const fromStr = from instanceof Date ? from.toISOString() : from
    const toStr = to instanceof Date ? to.toISOString() : to

    return this.range('@timestamp', { gte: fromStr, lte: toStr })
  }

  /**
   * Filter by log level
   */
  logLevel(level: 'error' | 'warn' | 'info' | 'debug' | string): this {
    return this.term('level', level)
  }

  /**
   * Filter by service name
   */
  service(serviceName: string): this {
    return this.term('service.name', serviceName)
  }

  /**
   * Filter by environment
   */
  environment(env: 'production' | 'staging' | 'development' | string): this {
    return this.term('environment', env)
  }

  /**
   * Search in log message
   */
  searchMessage(searchTerm: string): this {
    return this.match('message', searchTerm)
  }

  /**
   * Filter by specific error or exception
   */
  withError(errorType?: string): this {
    this.exists('error')
    if (errorType) {
      this.match('error.type', errorType)
    }
    return this
  }

  /**
   * Add time histogram aggregation
   */
  addTimeHistogram(interval: string = '1h'): this {
    return this.dateHistogramAgg('logs_over_time', '@timestamp', interval)
  }

  /**
   * Add common log aggregations
   */
  addLogAggregations(): this {
    return this.termsAgg('services', 'service.name.keyword', 10)
      .termsAgg('log_levels', 'level.keyword', 5)
      .termsAgg('environments', 'environment.keyword', 5)
      .termsAgg('error_types', 'error.type.keyword', 10)
  }

  /**
   * Sort by timestamp (newest first by default)
   */
  sortByTime(direction: 'asc' | 'desc' = 'desc'): this {
    return this.sort('@timestamp', direction)
  }
}

/**
 * Analytics and metrics specialized query builder
 */
export class AnalyticsQueryBuilder extends QueryBuilder {
  /**
   * Filter by user segment
   */
  userSegment(segment: string): this {
    return this.term('user.segment', segment)
  }

  /**
   * Filter by event type
   */
  eventType(event: string): this {
    return this.term('event.type', event)
  }

  /**
   * Filter by date range
   */
  dateRange(from: Date, to: Date): this {
    return this.range('event.timestamp', {
      gte: from.toISOString(),
      lte: to.toISOString(),
    })
  }

  /**
   * Filter by user properties
   */
  userProperty(property: string, value: any): this {
    return this.term(`user.properties.${property}`, value)
  }

  /**
   * Filter by event properties
   */
  eventProperty(property: string, value: any): this {
    return this.term(`event.properties.${property}`, value)
  }

  /**
   * Add conversion funnel tracking
   */
  conversionFunnel(steps: string[]): this {
    steps.forEach((step, index) => {
      this.termsAgg(`step_${index + 1}_${step}`, 'event.type', 1)
    })
    return this
  }

  /**
   * Add user analytics aggregations
   */
  addUserAnalytics(): this {
    return this.cardinalityAgg('unique_users', 'user.id')
      .termsAgg('user_segments', 'user.segment.keyword', 10)
      .termsAgg('user_countries', 'user.geo.country.keyword', 20)
      .termsAgg('devices', 'user.device.type.keyword', 5)
  }

  /**
   * Add time-based analytics
   */
  addTimeAnalytics(interval: string = '1d'): this {
    return this.dateHistogramAgg(
      'events_over_time',
      'event.timestamp',
      interval
    ).dateHistogramAgg('users_over_time', 'user.first_seen', interval)
  }

  /**
   * Sort by event timestamp
   */
  sortByEventTime(direction: 'asc' | 'desc' = 'desc'): this {
    return this.sort('event.timestamp', direction)
  }
}

/**
 * Content and document search specialized query builder
 */
export class ContentQueryBuilder extends QueryBuilder {
  /**
   * Full-text search across content fields
   */
  searchContent(
    searchTerm: string,
    options?: {
      fields?: string[]
      boost?: Record<string, number>
      operator?: 'and' | 'or'
    }
  ): this {
    const fields = options?.fields || [
      'title^3',
      'content',
      'tags^2',
      'description',
    ]

    if (options?.boost) {
      const boostedFields = fields.map((field) => {
        const fieldName = field.split('^')[0]
        return options.boost?.[fieldName]
          ? `${fieldName}^${options.boost[fieldName]}`
          : field
      })
      this.multiMatch(boostedFields, searchTerm, 'best_fields')
    } else {
      this.multiMatch(fields, searchTerm, 'best_fields')
    }

    if (options?.operator) {
      // Add as query_string for operator support
      this.queryString(searchTerm, {
        default_operator: options.operator.toUpperCase() as 'AND' | 'OR',
      })
    }

    return this
  }

  /**
   * Filter by content type
   */
  contentType(type: string): this {
    return this.term('content_type', type)
  }

  /**
   * Filter by author
   */
  author(authorName: string): this {
    return this.term('author.name', authorName)
  }

  /**
   * Filter by publication date range
   */
  publishedBetween(from: Date, to: Date): this {
    return this.range('published_at', {
      gte: from.toISOString(),
      lte: to.toISOString(),
    })
  }

  /**
   * Filter by tags
   */
  withTags(tags: string[]): this {
    return this.terms('tags', tags)
  }

  /**
   * Add content aggregations
   */
  addContentAggregations(): this {
    return this.termsAgg('content_types', 'content_type.keyword', 10)
      .termsAgg('authors', 'author.name.keyword', 20)
      .termsAgg('popular_tags', 'tags.keyword', 50)
      .dateHistogramAgg('published_over_time', 'published_at', '1M')
  }

  /**
   * Sort by relevance with recency boost
   */
  sortByRelevanceAndRecency(): this {
    return this.functionScore(
      [
        {
          filter: { range: { published_at: { gte: 'now-30d' } } },
          weight: 1.5,
        },
        {
          filter: { range: { view_count: { gte: 1000 } } },
          weight: 1.2,
        },
      ],
      { boost_mode: 'multiply', score_mode: 'multiply' }
    )
  }

  /**
   * Sort by popularity (views, likes, etc.)
   */
  sortByPopularity(): this {
    return this.sort('view_count', 'desc').sort('like_count', 'desc')
  }
}
