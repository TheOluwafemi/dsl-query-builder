# Search Query Builder

A fluent TypeScript query builder for OpenSearch/Elasticsearch DSL with built-in client and type safety.

## Features

- 🏗️ **Fluent Query Builder** - Intuitive, chainable API for building complex queries
- 🔒 **Type Safety** - Full TypeScript support with generic types for your document schemas
- 🚀 **Built-in Client** - HTTP client with retry logic, state management, and multi-search support
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔄 **Observable State** - React to search state changes for UI integration
- ⚡ **Performance** - Supports bulk operations and optimized query building

## Installation

```bash
npm install search-query-builder
# or
yarn add search-query-builder
```

## Quick Start

```typescript
import { createSearchClient, createQuery } from 'search-query-builder'

// Create a search client
const client = createSearchClient({
  endpoint: 'https://your-elasticsearch.com',
  index: 'your-index',
  token: 'your-auth-token', // optional
})

// Build and execute a query
const results = await client.search(
  createQuery()
    .match('title', 'javascript')
    .range('price', { gte: 10, lte: 100 })
    .sort('createdAt', 'desc')
    .size(20)
)

console.log(results.hits.hits) // Your search results
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
const query = createQuery().multiMatch(
  ['title', 'description'],
  'search term',
  'best_fields'
)
```

### Boolean Logic

```typescript
const query = createQuery()
  .match('category', 'electronics')
  .should((q) => q.term('brand', 'apple').term('brand', 'samsung'))
  .minimumShouldMatch(1)
  .mustNot((q) => q.term('status', 'discontinued'))
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
const query = createQuery()
  .match('category', 'products')
  .termsAgg('brands', 'brand.keyword', 10)
  .dateHistogramAgg('sales_over_time', 'createdAt', '1M', 'yyyy-MM')
  .aggregate('avg_price', { avg: { field: 'price' } })
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
// Subscribe to search state changes
const unsubscribe = client.subscribe((state) => {
  if (state.loading) console.log('Searching...')
  if (state.data) console.log('Results:', state.data)
  if (state.error) console.log('Error:', state.error)
})

// Get current state
const currentState = client.getState()
```

### Dynamic Configuration

```typescript
client.setIndex('different-index').setToken('new-auth-token')
```

## Configuration

```typescript
const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com', // Required
  index: 'default-index', // Optional
  token: 'bearer-token', // Optional
  retries: 3, // Default: 3
  timeout: 30000, // Default: 30s
  headers: {
    // Optional
    'Custom-Header': 'value',
  },
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

// Full type safety
results.hits.hits.forEach((hit) => {
  const post = hit._source // TypeScript knows this is BlogPost
  console.log(post.title) // ✅ Type safe
  console.log(post.author.name) // ✅ Type safe
  // console.log(post.foo); // ❌ TypeScript error
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
