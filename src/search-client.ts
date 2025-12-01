import axios, { AxiosInstance, AxiosError } from 'axios'
import { QueryBuilder } from './query-builder'
import {
  SearchConfig,
  ResolvedSearchConfig,
  SearchResponse,
  FlexibleSearchResponse,
  SearchError,
  SearchState,
  QueryDSL,
} from './types'
import {
  validateSearchConfig,
  validateIndexName,
  validateMsearchQueries,
} from './validation'

export class SearchClient {
  private config: ResolvedSearchConfig
  private axiosInstance: AxiosInstance
  private state: SearchState = {
    data: null,
    error: null,
    loading: false,
  }
  private stateListeners: Set<(state: SearchState) => void> = new Set()

  constructor(config: SearchConfig) {
    validateSearchConfig(config)

    this.config = {
      endpoint: config.endpoint,
      index: config.index || '',
      token: config.token || '',
      tokenType: config.tokenType || 'bearer',
      retries: config.retries || 3,
      timeout: config.timeout || 5000,
      headers: config.headers || {},
      responseTransformer:
        config.responseTransformer || ((response) => response),
    }

    // Build authorization header based on tokenType
    const authHeaders = this.config.token
      ? this.config.tokenType === 'bearer'
        ? { Authorization: `Bearer ${this.config.token}` }
        : { Authorization: this.config.token }
      : {}

    this.axiosInstance = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...authHeaders,
      },
    })
  }

  private transformResponse<T>(response: any): SearchResponse<T> {
    if (this.config.responseTransformer) {
      return this.config.responseTransformer<T>(response)
    }
    // Return as-is for standard Elasticsearch responses
    return response
  }

  /**
   * Create a new query builder instance
   */
  query(): QueryBuilder {
    return new QueryBuilder()
  }

  /**
   * Execute a search with the built query
   */
  async search<T = any>(
    query: QueryBuilder | QueryDSL,
    index?: string
  ): Promise<FlexibleSearchResponse<T>> {
    const searchIndex = index || this.config.index

    // If index is provided, validate it
    if (searchIndex) {
      validateIndexName(searchIndex, 'search method')
    }

    const dsl = query instanceof QueryBuilder ? query.build() : query

    this.updateState({ loading: true, error: null })

    let lastError: SearchError | null = null

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Use index as path if provided, otherwise use root endpoint
        const path = searchIndex ? `/${searchIndex}` : ''

        const response = await this.axiosInstance.post<any>(path, dsl)

        const transformedData = this.transformResponse<T>(response.data)
        this.updateState({ data: transformedData, loading: false, error: null })
        return transformedData
      } catch (error) {
        lastError = this.handleError(error as AxiosError)

        // Check if error is retryable
        if (
          !this.isRetryableError(lastError) ||
          attempt === this.config.retries
        ) {
          this.updateState({ loading: false, error: lastError })
          throw lastError
        }

        // Improved retry delay with jitter and max cap
        const baseDelay = Math.min(1000 * Math.pow(1.5, attempt), 5000) // Cap at 5s
        const jitter = Math.random() * 200 // Add 0-200ms jitter
        const delay = baseDelay + jitter

        await this.delay(delay)
      }
    }

    // This should never be reached, but TypeScript needs it
    this.updateState({ loading: false, error: lastError })
    throw lastError!
  }

  /**
   * Execute a count query
   */
  async count(query: QueryBuilder | QueryDSL, index?: string): Promise<number> {
    const searchIndex = index || this.config.index

    // If index is provided, validate it
    if (searchIndex) {
      validateIndexName(searchIndex, 'count method')
    }

    const dsl = query instanceof QueryBuilder ? query.build() : query
    const countQuery = { query: dsl.query }

    try {
      // Use index as path if provided, otherwise use root endpoint
      const path = searchIndex ? `/${searchIndex}` : ''

      const response = await this.axiosInstance.post(path, countQuery)
      return response.data.count
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  /**
   * Get current state
   */
  getState(): SearchState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SearchState) => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Update index
   */
  setIndex(index: string): this {
    validateIndexName(index, 'setIndex method')
    this.config.index = index
    return this
  }

  /**
   * Update token
   */
  setToken(token: string): this {
    this.config.token = token
    const authValue =
      this.config.tokenType === 'bearer' ? `Bearer ${token}` : token
    this.axiosInstance.defaults.headers.common['Authorization'] = authValue
    return this
  }

  /**
   * Bulk search across multiple indices
   */
  async msearch<T = any>(
    searches: Array<{ index?: string; query: QueryBuilder | QueryDSL }>
  ): Promise<FlexibleSearchResponse<T>[]> {
    validateMsearchQueries(searches)

    const body = searches.flatMap((search) => [
      { index: search.index || this.config.index },
      search.query instanceof QueryBuilder
        ? search.query.build()
        : search.query,
    ])

    try {
      const response = await this.axiosInstance.post(
        '',
        body.map((item) => JSON.stringify(item)).join('\n') + '\n',
        {
          headers: { 'Content-Type': 'application/x-ndjson' },
        }
      )

      // Transform each response if transformer is provided
      const transformedResponses = response.data.responses.map((resp: any) =>
        this.transformResponse<T>(resp)
      )

      return transformedResponses
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  private updateState(partial: Partial<SearchState>): void {
    this.state = { ...this.state, ...partial }
    this.stateListeners.forEach((listener) => listener(this.state))
  }

  private handleError(error: AxiosError): SearchError {
    const searchError: SearchError = {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data,
    }

    return searchError
  }

  private isRetryableError(error: SearchError): boolean {
    // Don't retry on client errors (4xx) except for specific cases
    if (error.status && error.status >= 400 && error.status < 500) {
      // Retry on rate limiting and timeouts
      return error.status === 429 || error.status === 408
    }

    // Retry on server errors (5xx) and network errors
    if (error.status && error.status >= 500) {
      return true
    }

    // Retry on network errors (no status)
    if (!error.status) {
      // Check for specific network error patterns
      const networkErrors = [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
      ]
      return networkErrors.some((netError) => error.message.includes(netError))
    }

    return false
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
