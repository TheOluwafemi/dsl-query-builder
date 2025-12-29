# DSL Query Builder

**Lightweight, zero-dependency TypeScript query builder for Elasticsearch/OpenSearch DSL**

## Why Choose This?

- **Lightweight**: <15KB, zero dependencies (was 65KB with axios)
- **Type-safe**: Full TypeScript support with generic types
- **Fast**: No HTTP overhead, pure query building performance
- **Focused**: Does one thing extremely well - building queries
- **Universal**: Works with ANY HTTP client (fetch, axios, ky, etc.)
- **Enhanced**: Advanced queries, geo search, nested queries, and more

## Quick Reference

| Category        | Method              | Example                                            |
| --------------- | ------------------- | -------------------------------------------------- |
| **Text Search** | `match()`           | `query.match('title', 'javascript')`               |
|                 | `matchPhrase()`     | `query.matchPhrase('title', 'getting started')`    |
|                 | `multiMatch()`      | `query.multiMatch(['title', 'content'], 'search')` |
| **Exact Match** | `term()`            | `query.term('status', 'published')`                |
|                 | `terms()`           | `query.terms('tags', ['js', 'react'])`             |
|                 | `range()`           | `query.range('price', { gte: 10, lte: 100 })`      |
| **Patterns**    | `wildcard()`        | `query.wildcard('filename', '*.js')`               |
|                 | `prefix()`          | `query.prefix('title', 'getting')`                 |
|                 | `fuzzy()`           | `query.fuzzy('title', 'javscript')`                |
| **Boolean**     | `should()`          | `query.should(q => q.term('category', 'tech'))`    |
|                 | `mustNot()`         | `query.mustNot(q => q.term('status', 'draft'))`    |
| **Geo**         | `geoDistance()`     | `query.geoDistance('location', '10km', lat, lon)`  |
| **Control**     | `from()` / `size()` | `query.from(20).size(10)`                          |
|                 | `sort()`            | `query.sort('createdAt', 'desc')`                  |

## Installation

```bash
npm install dsl-query-builder
```

## Quick Start

```typescript
import { createQuery } from 'dsl-query-builder'

const query = createQuery()
  .match('title', 'javascript tutorial')
  .range('publishedAt', { gte: '2023-01-01' })
  .sort('_score', 'desc')
  .size(10)

const dsl = query.build()

const results = await fetch('/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dsl),
}).then((r) => r.json())
```

## Core Query Methods

### Text Search

```typescript
const query = createQuery()
  .match('title', 'javascript tutorial')
  .match('description', 'react vue', 'and')
  .matchPhrase('title', 'complete guide')
  .multiMatch(['title', 'description'], 'search term', 'best_fields')
  .wildcard('filename', '*.js')
  .prefix('title', 'getting started')
  .queryString('javascript AND (react OR vue)', {
    fields: ['title', 'content'],
    default_operator: 'AND',
  })
  .simpleQueryString('javascript +tutorial -deprecated')
```

### Exact Matching & Filtering

```typescript
const query = createQuery()
  .term('status', 'published')
  .term('category.keyword', 'programming')
  .terms('tags', ['javascript', 'typescript', 'react'])
  .range('price', { gte: 10, lte: 100 })
  .range('publishedAt', { gte: 'now-30d' })
  .exists('author')
  .exists('featuredImage')
```

### Boolean Logic

```typescript
const query = createQuery()
  .match('title', 'javascript')
  .should((q) => {
    q.term('category', 'tutorial').term('category', 'guide')
  })
  .minimumShouldMatch(1)
  .mustNot((q) => {
    q.term('status', 'draft').term('visibility', 'private')
  })
```

### Pagination & Sorting

```typescript
const query = createQuery()
  .match('category', 'electronics')
  .from(20)
  .size(10)
  .sort('createdAt', 'desc')
  .sort('price', 'asc')
  .sortBy({
    _score: { order: 'desc' },
    popularity: { order: 'desc', missing: 0 },
  })
  .clearSort()
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

## Specialized Query Builders

### E-commerce Search

```typescript
import { createEcommerceQuery } from 'dsl-query-builder'

const query = createEcommerceQuery()
  .searchProducts('wireless headphones', {
    category: 'electronics',
    priceRange: { min: 50, max: 300 },
    brands: ['sony', 'bose'],
    inStock: true,
  })
  .addEcommerceAggregations()
  .sortByPopularity()
  .size(24)

const dsl = query.build()
```

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

## Advanced Features

### Fuzzy & Pattern Matching

```typescript
const query = createQuery()
  .fuzzy('title', 'javscript', { fuzziness: 'AUTO', boost: 1.5 })
  .fuzzy('description', 'tutorial', { fuzziness: 2 })
  .regexp('tags', 'react.*', 'i')
  .regexp('filename', '.*\\.(js|ts)$')
  .wildcard('author', 'john*')
  .wildcard('email', '*@company.com')
  .prefix('title', 'getting started')
```

### Geo-Spatial Queries

```typescript
const query = createQuery()
  .geoDistance('location', '10km', 40.7128, -74.006)
  .geoDistance('store_location', '5mi', 37.7749, -122.4194)
  .geoBoundingBox('location', [40.8, -74.1], [40.7, -73.9])
  .geoPolygon('delivery_zone', [
    [40.8, -74.1],
    [40.8, -73.9],
    [40.7, -73.9],
    [40.7, -74.1],
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
  .avgAgg('avg_price', 'price')
  .sumAgg('total_sales', 'sales')
  .cardinalityAgg('unique_users', 'user_id')
  .histogramAgg('price_distribution', 'price', 100)
  .rangeAgg('price_ranges', 'price', [
    { to: 100, key: 'budget' },
    { from: 100, to: 500, key: 'mid-range' },
    { from: 500, key: 'premium' },
  ])
```

## 🛠️ Query Utilities & Management

### Query Validation & Analysis

```typescript
const query = createQuery()
  .match('title', 'javascript')
  .range('price', { gte: 10, lte: 100 })

const validation = query.validate()
if (!validation.valid) {
  console.log('Errors:', validation.errors)
}

const complexity = query.getComplexity()
console.log('Query complexity score:', complexity)

const prettyJson = query.toJSON(true)
console.log(prettyJson)
```

### Query Manipulation

```typescript
const baseQuery = createQuery()
  .match('category', 'electronics')
  .range('price', { gte: 100 })

const laptopQuery = baseQuery.clone().term('type', 'laptop')
const phoneQuery = baseQuery.clone().term('type', 'smartphone')

const customQuery = createQuery()
  .match('title', 'tutorial')
  .raw(
    {
      function_score: {
        boost_mode: 'multiply',
        functions: [{ weight: 2.0 }],
      },
    },
    'must'
  )

const reusableQuery = createQuery()
  .match('temp', 'value')
  .reset()
  .match('title', 'new search')
```

### Advanced Query Features

```typescript
const query = createQuery()
  .match('title', 'tutorial')
  .highlight(['title', 'content'])
  .highlight({
    title: { number_of_fragments: 3 },
    content: { fragment_size: 150 },
  })
  .source(['title', 'summary', 'publishedAt'])
  .source(false)
  .trackTotalHits(true)
  .explain()
  .profile()
```

## Migration from v1.x

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

- **~80% smaller bundle** (65KB → 12KB)
- **Zero dependencies** (removed axios dependency)
- **More flexible** (works with any HTTP client)
- **Better performance** (no HTTP client overhead)
- **Enhanced features** (advanced queries, geo search, presets)

## 📚 API Reference

### Text Search Methods

- `match(field, value, operator?)` - Full-text search with optional AND/OR operator
- `matchPhrase(field, value)` - Exact phrase matching
- `multiMatch(fields[], value, type?)` - Multi-field search with type ('best_fields', 'most_fields', etc.)
- `queryString(query, options?)` - Lucene query string syntax with field targeting
- `simpleQueryString(query, fields?)` - Simplified query string for user input

### Pattern Matching

- `wildcard(field, pattern)` - Wildcard patterns (\* and ?)
- `prefix(field, value)` - Prefix matching
- `regexp(field, pattern, flags?)` - Regular expression search
- `fuzzy(field, value, options?)` - Fuzzy/typo-tolerant matching

### Exact Matching & Filtering

- `term(field, value)` - Exact value match (auto-adds .keyword)
- `terms(field, values[])` - Match any of multiple values
- `range(field, { gte?, lte?, gt?, lt? })` - Numeric/date ranges
- `exists(field)` - Field presence check

### Boolean Logic

- `should(callback)` - OR conditions (add multiple queries)
- `mustNot(callback)` - Exclusion conditions (NOT)
- `minimumShouldMatch(count)` - Minimum should clause matches

### Geo-Spatial Queries

- `geoDistance(field, distance, lat, lon)` - Distance-based search
- `geoBoundingBox(field, topLeft, bottomRight)` - Rectangular area
- `geoPolygon(field, points[])` - Polygon area search

### Nested & Hierarchical

- `nested(path, callback)` - Query nested objects
- `hasChild(type, callback)` - Parent-child relationships
- `hasParent(type, callback)` - Child-parent relationships

### Advanced Scoring

- `functionScore(functions[], options?)` - Custom scoring functions
- `constantScore(boost)` - Apply constant score
- `boost(value)` - Boost entire query
- `moreLikeThis(fields[], texts?, docs?)` - Find similar documents

### Aggregations - Metrics

- `avgAgg(name, field)` - Average values
- `sumAgg(name, field)` - Sum values
- `minAgg(name, field)` - Minimum values
- `maxAgg(name, field)` - Maximum values
- `cardinalityAgg(name, field)` - Unique value count
- `valueCountAgg(name, field)` - Field value count

### Aggregations - Buckets

- `termsAgg(name, field, size?)` - Group by field values
- `dateHistogramAgg(name, field, interval, format?)` - Time-based grouping
- `histogramAgg(name, field, interval)` - Numeric histogram
- `rangeAgg(name, field, ranges[])` - Custom ranges
- `filtersAgg(name, filters{})` - Custom filter buckets
- `nestedAgg(name, path)` - Nested object aggregations

### Result Control

- `from(offset)` - Result offset for pagination
- `size(limit)` - Number of results to return
- `sort(field, order?)` - Simple sorting (asc/desc)
- `sortBy(options{})` - Advanced sorting with missing value handling
- `clearSort()` - Remove all sorting
- `source(fields[] | boolean)` - Control returned fields
- `highlight(fields[] | config{})` - Result highlighting
- `trackTotalHits(boolean)` - Enable total hit counting

### Query Management

- `validate()` - Check query validity, returns { valid, errors[] }
- `getComplexity()` - Get numeric complexity score
- `toJSON(pretty?)` - Export as JSON string
- `clone()` - Create deep copy of query builder
- `reset()` - Clear all query conditions
- `build()` - Generate final Elasticsearch DSL

### Raw & Advanced

- `raw(query, clause?)` - Add raw Elasticsearch query to specific clause
- `setQuery(query)` - Replace entire query object
- `matchAll()` - Match all documents
- `script(script, params?)` - Script-based queries
- `explain()` - Add score explanation to results
- `profile()` - Enable query profiling

### Factory Functions

- `createQuery()` - Create basic query builder
- `createEcommerceQuery()` - E-commerce specialized builder
- `createLogsQuery()` - Log analysis specialized builder
- `createAnalyticsQuery()` - Analytics specialized builder
- `createContentQuery()` - Content management specialized builder

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the Elasticsearch/OpenSearch community**
