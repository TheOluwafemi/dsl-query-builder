import axios, { AxiosInstance, AxiosError } from 'axios'
import { QueryBuilder } from './query-builder'
import {
  SearchConfig,
  SearchResponse,
  SearchError,
  SearchState,
  QueryDSL,
} from './types'

export class SearchClient {
  private config: Required<SearchConfig>
  private axiosInstance: AxiosInstance
  private state: SearchState = {
    data: null,
    error: null,
    loading: false,
  }
  private stateListeners: Set<(state: SearchState) => void> = new Set()

  constructor(config: SearchConfig) {
    this.config = {
      endpoint: config.endpoint,
      index: config.index || '',
      token: config.token || '',
      retries: config.retries || 3,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...(this.config.token && {
          Authorization: `Bearer ${this.config.token}`,
        }),
      },
    })
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
  ): Promise<SearchResponse<T>> {
    const searchIndex = index || this.config.index
    if (!searchIndex) {
      throw new Error(
        'Index must be specified either in config or search method'
      )
    }

    const dsl = query instanceof QueryBuilder ? query.build() : query

    this.updateState({ loading: true, error: null })

    let lastError: SearchError | null = null

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.axiosInstance.post<SearchResponse<T>>(
          `/${searchIndex}/_search`,
          dsl
        )

        this.updateState({ data: response.data, loading: false, error: null })
        return response.data
      } catch (error) {
        lastError = this.handleError(error as AxiosError)

        if (attempt === this.config.retries) {
          this.updateState({ loading: false, error: lastError })
          throw lastError
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)
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
    if (!searchIndex) {
      throw new Error(
        'Index must be specified either in config or count method'
      )
    }

    const dsl = query instanceof QueryBuilder ? query.build() : query
    const countQuery = { query: dsl.query }

    try {
      const response = await this.axiosInstance.post(
        `/${searchIndex}/_count`,
        countQuery
      )
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
    this.config.index = index
    return this
  }

  /**
   * Update token
   */
  setToken(token: string): this {
    this.config.token = token
    this.axiosInstance.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`
    return this
  }

  /**
   * Bulk search across multiple indices
   */
  async msearch<T = any>(
    searches: Array<{ index?: string; query: QueryBuilder | QueryDSL }>
  ): Promise<SearchResponse<T>[]> {
    const body = searches.flatMap((search) => [
      { index: search.index || this.config.index },
      search.query instanceof QueryBuilder
        ? search.query.build()
        : search.query,
    ])

    try {
      const response = await this.axiosInstance.post(
        '/_msearch',
        body.map((item) => JSON.stringify(item)).join('\n') + '\n',
        {
          headers: { 'Content-Type': 'application/x-ndjson' },
        }
      )

      return response.data.responses
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
