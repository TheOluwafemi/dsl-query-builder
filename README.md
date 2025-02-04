## OpenSearch Query Builder and Client

A TypeScript package to help interact with OpenSearch. It includes an `OpenSearchClient` class to manage configurations, a `QueryBuilder` for creating flexible queries, and utility functions for executing search requests. This package is designed to be framework-agnostic, with a special hook (`useOpenSearchQuery`) for easy integration with frontend frameworks like React or Vue.

## Features

- **OpenSearchClient**: A class that encapsulates OpenSearch configuration, ensuring required fields like `endpoint` and `index` are set.
- **QueryBuilder**: A flexible query builder that allows you to construct queries with `match`, `range`, `sort`, and `paginate` methods.
- **search function**: Executes the search query against an OpenSearch endpoint, with error handling and response parsing.
- **useOpenSearchQuery hook**: A framework-agnostic hook that allows you to fetch OpenSearch data with proper state management (`loading`, `error`, `results`).

## Installation

To install the package via npm:

```bash
npm install your-package-name
```

## Usage

### 1. Setting Up the Client

Create an instance of `OpenSearchClient` with the necessary configuration:

```typescript
import { OpenSearchClient } from 'your-package-name';

const client = new OpenSearchClient({
  endpoint: 'https://your-opensearch-endpoint',
  index: 'your-index-name',
});
```

### 2. Using the Query Builder

Use the `QueryBuilder` to create queries in a flexible way:

```typescript
import { QueryBuilder } from 'your-package-name';

const query = new QueryBuilder()
  .match('title', 'OpenSearch')
  .range('date', { gte: '2022-01-01' })
  .sort('date', 'desc')
  .paginate(0, 10)
  .build();
```

### 3. Executing a Search

Execute the search query with the `search` function:

```typescript
import { search } from 'your-package-name';

const results = await search(client, query);
console.log(results);
```

### 4. Using the `useOpenSearchQuery` Hook

You can use the `useOpenSearchQuery` hook in a framework-agnostic manner to manage the query lifecycle (loading, results, errors):

```typescript
import { useOpenSearchQuery } from 'your-package-name';

function MyComponent() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const query = new QueryBuilder()
    .match('title', 'OpenSearch')
    .build();

  useOpenSearchQuery(client, query, (data, err, isLoading) => {
    setResults(data);
    setError(err);
    setLoading(isLoading);
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{JSON.stringify(results)}</div>;
}
```

## API

### `OpenSearchClient`

- **constructor(config: OpenSearchConfig)**: Initializes a new OpenSearch client with the provided configuration. Requires `endpoint` and `index`.
- **getConfig()**: Returns the current configuration of the client.

### `QueryBuilder`

- **match(field: string, value: string)**: Adds a match query on the specified field and value.
- **range(field: string, options: { gte?: string; lte?: string })**: Adds a range query on the specified field with `gte` and/or `lte` options.
- **sort(field: string, order: "asc" | "desc")**: Adds a sorting option for the specified field.
- **paginate(from: number, size: number)**: Adds pagination with `from` (start) and `size` (number of results).
- **build()**: Builds the final query object.

### `search(client: OpenSearchClient, query: any)`

Executes the provided query against the OpenSearch endpoint specified in the `OpenSearchClient` instance.

### `useOpenSearchQuery(client: OpenSearchClient, query: any, onUpdate: (results: any, error: string | null, loading: boolean) => void)`

Framework-agnostic hook to execute a search query and manage loading, error, and results states.

## Configuration

You must provide an `endpoint` and an `index` when initializing the `OpenSearchClient`. Optionally, you can include `cache` and `retries` parameters.

Example:

```typescript
const client = new OpenSearchClient({
  endpoint: 'https://your-opensearch-endpoint',
  index: 'your-index',
  cache: true,
  retries: 3,
});
```

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Let me know if you'd like to modify anything!