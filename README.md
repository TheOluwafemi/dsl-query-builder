# DSL Query Builder

A fluent TypeScript query builder for OpenSearch/Elasticsearch DSL with built-in client and type safety.

## Features

- 🏗️ **Fluent API** - Chainable query builder with intuitive syntax
- 🔒 **Type Safety** - Full TypeScript support with generics
- 🚀 **Built-in Client** - HTTP client with retry logic and state management
- 🌐 **Proxy Support** - Works with enterprise proxy services
- 📦 **Zero Config** - Sensible defaults, minimal setup
- 🔄 **Reactive** - Observable state for UI integration

## Installation

```bash
npm install dsl-query-builder
```

## Quick Start

```typescript
import { createSearchClient, createQuery } from 'dsl-query-builder'

const client = createSearchClient({
  endpoint: 'https://your-elasticsearch.com',
  index: 'products',
})

const results = await client.search(
  createQuery()
    .match('title', 'laptop')
    .range('price', { gte: 100, lte: 1000 })
    .sort('createdAt', 'desc')
)

console.log(`Found ${results.hits.total.value} products`)
```

## Query Builder

### Basic Queries

```typescript
const query = createQuery()
  .match('title', 'search term')
  .matchPhrase('description', 'exact phrase')
  .term('status', 'published')
  .terms('tags', ['tech', 'programming'])
  .range('price', { gte: 10, lte: 100 })
  .exists('author')
  .wildcard('title', 'java*')
  .prefix('title', 'java')
```

### Boolean Logic

```typescript
const query = createQuery()
  .match('category', 'electronics')
  .should((q) => q.term('brand', 'apple').term('brand', 'samsung'))
  .minimumShouldMatch(1)
  .mustNot((q) => q.term('status', 'discontinued'))
```

### Advanced Features

```typescript
const query = createQuery()
  .multiMatch(['title', 'description'], 'search term', 'best_fields')
  .sort('price', 'asc')
  .sortBy({ rating: { order: 'desc', missing: '_last' } })
  .from(0)
  .size(20)
  .source(['title', 'price', 'createdAt'])
  .highlight(['title', 'content'])
  .termsAgg('brands', 'brand.keyword', 10)
  .dateHistogramAgg('sales', 'createdAt', '1M')
```

## Client Configuration

### Basic Setup

```typescript
const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com',
  index: 'my-index',
  token: 'your-token',
  tokenType: 'bearer', // or 'raw' for proxy services
  retries: 3,
  timeout: 5000,
  headers: { 'Custom-Header': 'value' },
})
```

### Authentication Types

```typescript
// Standard Bearer token (default)
const esClient = createSearchClient({
  endpoint: 'https://elasticsearch.example.com',
  token: 'your-api-token',
})

// Raw token for proxy services
const proxyClient = createSearchClient({
  endpoint: 'https://proxy-service.company.com',
  token: 'session-key-abc123',
  tokenType: 'raw',
})
```

### Proxy Services

```typescript
import { ResponseTransformers } from 'dsl-query-builder'

// For non-standard response formats
const client = createSearchClient({
  endpoint: 'https://your-proxy-service.com',
  tokenType: 'raw',
  responseTransformer: ResponseTransformers.fromSimplified,
})

// Custom transformer
const customClient = createSearchClient({
  endpoint: 'https://legacy-api.com',
  responseTransformer: <T>(response: any) => ({
    took: response.timing?.duration || 0,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: response.meta?.total || 0, relation: 'eq' },
      max_score: null,
      hits: response.items.map((item: any, index: number) => ({
        _index: 'api-results',
        _id: item.uuid || String(index),
        _score: 1.0,
        _source: item as T,
      })),
    },
  }),
})
```

## Client API

### Search Operations

```typescript
// Basic search
const results = await client.search<Product>(query)

// Count documents
const count = await client.count(query)

// Multi-search
const [products, users] = await client.msearch([
  { index: 'products', query: productQuery },
  { index: 'users', query: userQuery },
])

// Search with index override
const results = await client.search(query, 'specific-index')
```

### State Management

```typescript
// Subscribe to state changes
const unsubscribe = client.subscribe((state) => {
  if (state.loading) showSpinner()
  if (state.data) displayResults(state.data)
  if (state.error) showError(state.error)
})

// Get current state
const state = client.getState()

// Update configuration
client.setIndex('new-index').setToken('new-token')
```

## Framework Integration

### React

```typescript
import { useState, useEffect } from 'react'

function SearchComponent() {
  const [state, setState] = useState(client.getState())

  useEffect(() => {
    return client.subscribe(setState)
  }, [])

  return (
    <div>
      {state.loading && <div>Loading...</div>}
      {state.data && <Results data={state.data} />}
      {state.error && <div>Error: {state.error.message}</div>}
    </div>
  )
}
```

### Vue

```typescript
import { reactive, onMounted } from 'vue'

export default {
  setup() {
    const state = reactive(client.getState())

    onMounted(() => {
      client.subscribe((newState) => Object.assign(state, newState))
    })

    return { state }
  },
}
```

## TypeScript Support

```typescript
interface Product {
  id: string
  title: string
  price: number
  category: string
}

const results = await client.search<Product>(
  createQuery().match('title', 'laptop')
)

results.hits.hits.forEach((hit) => {
  const product = hit._source // TypeScript knows this is Product
  console.log(product.title, product.price)
})
```

## Error Handling

```typescript
try {
  const results = await client.search(query)
} catch (error) {
  console.error('Search failed:', error.message, error.status)
}
```

## Advanced Usage

### Raw Queries

```typescript
const query = createQuery()
  .raw({ fuzzy: { title: { value: 'javascript', fuzziness: 'AUTO' } } })
  .setQuery({ match_all: {} })
```

### Query Cloning

```typescript
const baseQuery = createQuery()
  .match('category', 'electronics')
  .range('price', { gte: 100 })

const mobileQuery = baseQuery.clone().term('type', 'mobile')
const laptopQuery = baseQuery.clone().term('type', 'laptop')
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
