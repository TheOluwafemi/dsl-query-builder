# DSL Query Builder

🏗️ **Lightweight, zero-dependency TypeScript query builder for Elasticsearch/OpenSearch DSL**

## ⭐ Why Choose This?

- 🪶 **Lightweight**: <15KB, zero dependencies (was 65KB with axios)
- 🔒 **Type-safe**: Full TypeScript support with generic types
- 🚀 **Fast**: No HTTP overhead, pure query building performance
- 🎯 **Focused**: Does one thing extremely well - building queries
- 🔧 **Universal**: Works with ANY HTTP client (fetch, axios, ky, etc.)
- 🌟 **Enhanced**: Advanced queries, geo search, nested queries, and more

## 📦 Installation

```bash
npm install dsl-query-builder
```

## 🚀 Quick Start

```typescript
import { createQuery } from 'dsl-query-builder'

const query = createQuery()
  .match('title', 'javascript tutorial')
  .range('publishedAt', { gte: '2023-01-01' })
  .sort('_score', 'desc')
  .size(10)

const dsl = query.build()

// Use with ANY HTTP client:
const results = await fetch('/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dsl),
}).then((r) => r.json())
```

## 🔗 HTTP Client Integration

### With Native Fetch

```typescript
const query = createQuery().match('title', 'react')
const response = await fetch('http://localhost:9200/articles/_search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(query.build()),
})
```

### With Axios

```typescript
import axios from 'axios'

const dsl = createQuery().match('title', 'react').build()
const response = await axios.post('/search', dsl)
```

### With Any Custom Client

```typescript
const dsl = createQuery().match('title', 'react').build()
const response = await myHttpClient.post('/search', dsl)
```

## 🎯 Specialized Query Builders

### E-commerce Search

````typescript
import { createEcommerceQuery } from 'dsl-query-builder'

const query = createEcommerceQuery()
  .searchProducts('wireless headphones', {
    category: 'electronics',
    priceRange: { min: 50, max: 300 },
    brands: ['sony', 'bose'],
    inStock: true
  })
  .addEcommerceAggregations()
  .sortByPopularity()
  .size(24)

### Log Analysis
```typescript
import { createLogsQuery } from 'dsl-query-builder'

const query = createLogsQuery()
  .timeRange('now-24h', 'now')
  .logLevel('error')
  .service('payment-service')
  .withError('SQLException')
  .addLogAggregations()
  .addTimeHistogram('1h')

const dsl = query.build()
````

### Analytics & Metrics

```typescript
import { createAnalyticsQuery } from 'dsl-query-builder'

const query = createAnalyticsQuery()
  .dateRange(new Date('2023-01-01'), new Date('2023-01-31'))
  .eventType('purchase')
  .userSegment('premium')
  .addUserAnalytics()
  .addTimeAnalytics('1d')

const dsl = query.build()
```

## 🔥 Advanced Features

### Fuzzy & Pattern Matching

```typescript
const query = createQuery()
  .fuzzy('title', 'javascript', { fuzziness: 'AUTO' })
  .regexp('tags', 'react.*')
  .wildcard('author', 'john*')
```

### Geo Queries

```typescript
const query = createQuery()
  .geoDistance('location', '10km', 40.7128, -74.006)
  .geoBoundingBox('location', [40.8, -74.1], [40.7, -73.9])
  .geoPolygon('location', [
    [40.8, -74.1],
    [40.8, -73.9],
    [40.7, -73.9],
  ])
```

### Nested & Parent-Child

```typescript
const query = createQuery()
  .nested('comments', (q) => {
    q.match('comments.message', 'excellent').range('comments.rating', {
      gte: 4,
    })
  })
  .hasChild('comment', (q) => {
    q.term('approved', true)
  })
```

### Function Scoring

```typescript
const query = createQuery()
  .match('title', 'tutorial')
  .functionScore([
    {
      filter: { range: { published_date: { gte: 'now-30d' } } },
      weight: 2.0,
    },
    {
      filter: { term: { featured: true } },
      weight: 1.5,
    },
  ])
```

### Enhanced Aggregations

```typescript
const query = createQuery()
  .match('category', 'electronics')
  // Metric aggregations
  .avgAgg('avg_price', 'price')
  .sumAgg('total_sales', 'sales')
  .cardinalityAgg('unique_users', 'user_id')
  // Bucket aggregations
  .histogramAgg('price_distribution', 'price', 100)
  .rangeAgg('price_ranges', 'price', [
    { to: 100, key: 'budget' },
    { from: 100, to: 500, key: 'mid-range' },
    { from: 500, key: 'premium' },
  ])
```

## 🔄 Migration from v1.x

### Before (HTTP Client Included)

```typescript
import { createSearchClient } from 'dsl-query-builder'

const client = createSearchClient({
  endpoint: 'https://elasticsearch.example.com',
  index: 'products',
})

const results = await client.search(query)
```

### After (Pure Query Builder)

```typescript
import { createQuery } from 'dsl-query-builder'

const query = createQuery().match('title', 'laptop').build()

// Use with your preferred HTTP client
const response = await fetch('/products/_search', {
  method: 'POST',
  body: JSON.stringify(query),
})
```

### Migration Benefits

- ✅ **~80% smaller bundle** (65KB → 12KB)
- ✅ **Zero dependencies** (removed axios dependency)
- ✅ **More flexible** (works with any HTTP client)
- ✅ **Better performance** (no HTTP client overhead)
- ✅ **Enhanced features** (advanced queries, geo search, presets)

## 📚 API Reference

### Core Query Methods

- `match(field, value)` - Full-text match
- `term(field, value)` - Exact term match
- `range(field, { gte, lte })` - Range queries
- `exists(field)` - Field existence
- `terms(field, values)` - Multiple values

### Advanced Queries

- `fuzzy(field, value, options)` - Fuzzy matching
- `regexp(field, pattern)` - Regular expressions
- `nested(path, callback)` - Nested queries
- `geoDistance(field, distance, lat, lon)` - Geo queries
- `functionScore(functions)` - Custom scoring

### Aggregations

- `termsAgg(name, field)` - Terms aggregation
- `avgAgg(name, field)` - Average values
- `histogramAgg(name, field, interval)` - Histograms
- `dateHistogramAgg(name, field, interval)` - Time series

### Utilities

- `validate()` - Query validation
- `getComplexity()` - Complexity analysis
- `toJSON(pretty?)` - JSON export
- `clone()` - Deep copy query

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the Elasticsearch/OpenSearch community**
