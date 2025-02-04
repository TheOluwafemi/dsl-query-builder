export interface OpenSearchConfig {
  endpoint: string
  index: string
  cache?: boolean
  retries?: number
}

export class OpenSearchClient {
  private config: OpenSearchConfig

  constructor(config: OpenSearchConfig) {
    if (!config.endpoint) {
      throw new Error(
        "OpenSearchClient Error: 'endpoint' is required in the configuration."
      )
    }
    if (!config.index) {
      throw new Error(
        "OpenSearchClient Error: 'index' is required in the configuration."
      )
    }
    this.config = config
  }

  getConfig() {
    return this.config
  }
}
