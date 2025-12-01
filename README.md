# DSL Query Builder

A fluent TypeScript query builder for OpenSearch/Elasticsearch DSL with built-in client and type safety.

## Features

- 🏗️ **Fluent Query Builder** - Intuitive, chainable API for building complex queries
- 🔒 **Type Safety** - Full TypeScript support with generic types for your document schemas
- 🚀 **Built-in Client** - HTTP client with retry logic, state management, and multi-search support
- 🌐 **Proxy Service Support** - Works with enterprise proxy services that handle index routing
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔄 **Observable State** - React to search state changes for UI integration
- ⚡ **Performance** - Supports bulk operations and optimized query building

## Installation

```bash
npm install dsl-query-builder
# or
yarn add dsl-query-builder
```

## Quick Start

```typescript
import { createSearchClient, createQuery } from 'dsl-query-builder'

// 1. Create a client
const client = createSearchClient({
  endpoint: 'https://your-elasticsearch.com',
  index: 'products',
})

// 2. Search for products
const results = await client.search(createQuery().match('title', 'laptop'))

console.log(`Found ${results.hits.total.value} products`)
```

### More Complex Example

```typescript
// Build complex queries with chaining
const results = await client.search(
  createQuery()
    .match('title', 'javascript')
    .range('price', { gte: 10, lte: 100 })
    .sort('createdAt', 'desc')
    .size(20)
)
```

### Proxy Service Support

```typescript
// For enterprises with proxy services that handle index routing
const client = createSearchClient({
  endpoint: 'https://your-proxy-service.com',
  // No index specified - requests go directly to /_search
})

// Searches will use /_search endpoint
const results = await client.search(createQuery().match('title', 'search term'))

// You can also specify index per search if needed
const specificResults = await client.search(
  createQuery().match('title', 'search term'),
  'specific-index'
)
```

### Custom Response Transformation

```typescript
import { createSearchClient, ResponseTransformers } from 'dsl-query-builder'

// If your proxy service returns a different response format
const client = createSearchClient({
  endpoint: 'https://your-proxy-service.com',
  responseTransformer: ResponseTransformers.fromSimplified,
})

// Now the client will transform responses like:
// { results: [...], total: 100 } -> standard Elasticsearch format
const results = await client.search(createQuery().match('title', 'laptop'))
// results.hits.hits will work as expected
```

## Query Builder API

### Basic Queries

```typescript
const query = createQuery()
  .match('title', 'search term') // Full text search
  .matchPhrase('description', 'exact phrase') // Phrase search
  .term('status', 'published') // Exact term match
  .terms('tags', ['tech', 'programming']) // Multiple terms
  .range('price', { gte: 10, lte: 100 }) // Range query
  .exists('author') // Field exists
  .wildcard('title', 'java*') // Wildcard search
  .prefix('title', 'java') // Prefix search
```

### Multi-field Search

```typescript
// Search across multiple fields (e.g., search in both title and description)
const query = createQuery().multiMatch(
  ['title', 'description'],
  'search term',
  'best_fields' // Scoring strategy
)
```

### Boolean Logic

```typescript
// Find electronics that are either Apple OR Samsung, but NOT discontinued
const query = createQuery()
  .match('category', 'electronics') // Must match
  .should((q) => q.term('brand', 'apple').term('brand', 'samsung')) // At least one should match
  .minimumShouldMatch(1)
  .mustNot((q) => q.term('status', 'discontinued')) // Must NOT match
```

### Sorting & Pagination

```typescript
const query = createQuery()
  .match('category', 'books')
  .sort('price', 'asc')
  .sortBy({ rating: { order: 'desc', missing: '_last' } })
  .from(0)
  .size(20)
```

### Aggregations

```typescript
// Get products with analytics: top brands, sales over time, average price
const query = createQuery()
  .match('category', 'products')
  .termsAgg('brands', 'brand.keyword', 10) // Top 10 brands
  .dateHistogramAgg('sales_over_time', 'createdAt', '1M', 'yyyy-MM') // Monthly sales
  .aggregate('avg_price', { avg: { field: 'price' } }) // Average price
```

### Source Filtering & Highlighting

```typescript
const query = createQuery()
  .match('content', 'important information')
  .source(['title', 'summary', 'createdAt']) // Only return specific fields
  .highlight(['title', 'content']) // Highlight matching terms
  .trackTotalHits(true) // Get accurate total count
```

## Search Client API

### Basic Search

```typescript
interface Product {
  id: string
  title: string
  price: number
}

// Type-safe search
const results = await client.search<Product>(query)
results.hits.hits.forEach((hit) => {
  console.log(hit._source.title) // TypeScript knows this is a string
})
```

### Count Documents

```typescript
const count = await client.count(createQuery().match('status', 'published'))
console.log(`Found ${count} documents`)
```

### Multi-Search

```typescript
const [products, users, orders] = await client.msearch([
  { index: 'products', query: productQuery },
  { index: 'users', query: userQuery },
  { index: 'orders', query: orderQuery },
])
```

### State Management

```typescript
// Basic subscription
const unsubscribe = client.subscribe((state) => {
  if (state.loading) showSpinner()
  if (state.data) displayResults(state.data)
  if (state.error) showError(state.error.message)
})

// Get current state
const currentState = client.getState()
```

### React Integration

```typescript
const [searchState, setSearchState] = useState(client.getState())

useEffect(() => {
  const unsubscribe = client.subscribe(setSearchState)
  return unsubscribe
}, [])

return (
  <div>
    {searchState.loading && <div>Loading...</div>}
    {searchState.data && <Results data={searchState.data} />}
    {searchState.error && <div>Error: {searchState.error.message}</div>}
  </div>
)
```

### Vue Integration

```typescript
// In your Vue component
const searchState = reactive(client.getState())

onMounted(() => {
  client.subscribe((newState) => {
    Object.assign(searchState, newState)
  })
})

// Template automatically updates when searchState changes
```

### Dynamic Configuration

```typescript
client.setIndex('different-index').setToken('new-auth-token')
```

## Configuration

### Basic Setup

```typescript
// With a default index
const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com', // Required
  index: 'my-index', // Optional default index
})

// Without index (for proxy services)
const proxyClient = createSearchClient({
  endpoint: 'https://your-proxy-service.com', // Required
  // No index - uses /_search endpoint
})
```

### With Authentication

```typescript
const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com',
  index: 'my-index',
  token: 'bearer-token', // API token
})
```

### Advanced Options

```typescript
const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com',
  index: 'my-index',
  token: 'bearer-token',
  retries: 3, // Retry failed requests
  timeout: 5000, // 5 second timeout
  headers: { 'Custom-Header': 'value' },
})
```

### Proxy Service Configuration

For enterprise environments with proxy services that handle Elasticsearch routing:

```typescript
// Standard proxy service (returns Elasticsearch-compatible responses)
const client = createSearchClient({
  endpoint: 'https://your-internal-proxy.company.com',
  token: 'your-auth-token',
  headers: {
    'X-Company-Auth': 'internal-token',
    'X-Service-Name': 'my-app',
  },
})

// Custom proxy service with response transformation
import { ResponseTransformers } from 'dsl-query-builder'

const customClient = createSearchClient({
  endpoint: 'https://custom-search-api.company.com',
  token: 'your-auth-token',
  responseTransformer: ResponseTransformers.fromSimplified,
  // Transforms: { results: [...], total: 100 } -> standard ES format
})

// All searches go directly to /_search
const results = await client.search(createQuery().match('field', 'value'))

// Per-request index override still supported
const specificResults = await client.search(
  createQuery().match('field', 'value'),
  'specific-index' // Uses /specific-index/_search
)
```

### Custom Response Transformers

```typescript
// Create your own transformer for unique response formats
const customTransformer = <T>(response: any) => {
  return {
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
    aggregations: response.facets,
  }
}

const client = createSearchClient({
  endpoint: 'https://your-api.com',
  responseTransformer: customTransformer,
})
```

## TypeScript Support

Define your document interfaces for full type safety:

```typescript
interface BlogPost {
  id: string
  title: string
  content: string
  author: {
    name: string
    email: string
  }
  tags: string[]
  publishedAt: string
}

const results = await client.search<BlogPost>(
  createQuery().match('title', 'typescript').term('author.name', 'John Doe')
)

// Full type safety with standard Elasticsearch responses
results.hits.hits.forEach((hit) => {
  const post = hit._source // TypeScript knows this is BlogPost
  console.log(post.title) // ✅ Type safe
  console.log(post.author.name) // ✅ Type safe
  // console.log(post.foo); // ❌ TypeScript error
})

// For proxy services with custom response formats
// The response transformer ensures hits.hits is always available
results.hits.hits.forEach((hit) => {
  const post = hit._source // Still type-safe after transformation
  console.log(post.title) // ✅ Works regardless of original response format
})
```

## Error Handling

```typescript
try {
  const results = await client.search(query)
} catch (error) {
  console.log('Search failed:', error.message)
  console.log('Status:', error.status)
  console.log('Details:', error.details)
}
```

## Advanced Usage

### Proxy Service Examples

```typescript
import {
  createSearchClient,
  createQuery,
  ResponseTransformers,
} from 'dsl-query-builder'

// Example 1: Enterprise API that returns simplified results
const enterpriseClient = createSearchClient({
  endpoint: 'https://search-api.company.com',
  token: 'enterprise-token',
  responseTransformer: ResponseTransformers.fromSimplified,
})

// API returns: { results: [...], total: 100 }
// Library transforms to: { hits: { hits: [...], total: { value: 100 } } }
const results = await enterpriseClient.search(
  createQuery().match('title', 'quarterly report')
)

// Example 2: Microservice with nested response structure
const microserviceClient = createSearchClient({
  endpoint: 'https://content-service.company.com',
  responseTransformer: ResponseTransformers.fromNested,
})

// API returns: { data: { items: [...], metadata: { total: 50 } } }
const contentResults = await microserviceClient.search(
  createQuery().match('content', 'user manual')
)

// Example 3: Custom transformation for unique response format
const customClient = createSearchClient({
  endpoint: 'https://legacy-search.company.com',
  responseTransformer: <T>(response: any) => ({
    took: response.queryTime || 0,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: response.recordCount || 0, relation: 'eq' },
      max_score: null,
      hits: (response.records || []).map((record: any, index: number) => ({
        _index: 'legacy',
        _id: record.recordId || String(index),
        _score: 1.0,
        _source: record as T,
      })),
    },
  }),
})

// Works with any response format after transformation
customResults.hits.hits.forEach((hit) => {
  console.log(hit._source) // Always works regardless of original API format
})
```

### Raw Queries

```typescript
const query = createQuery()
  .raw({
    fuzzy: { title: { value: 'javascript', fuzziness: 'AUTO' } },
  })
  .setQuery({ match_all: {} }) // Replace entire query
```

### Query Cloning

```typescript
const baseQuery = createQuery()
  .match('category', 'electronics')
  .range('price', { gte: 100 })

const mobileQuery = baseQuery.clone().term('subcategory', 'mobile')

const laptopQuery = baseQuery.clone().term('subcategory', 'laptop')
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
