# Query Composer Tests

This directory contains comprehensive tests for the Query Composer library.

## Test Structure

- `query-builder.test.ts` - Tests for QueryBuilder class methods, validation, and edge cases
- `search-client.test.ts` - Tests for SearchClient HTTP operations, state management, and error handling
- `validation.test.ts` - Tests for all validation functions and error scenarios
- `integration.test.ts` - End-to-end tests covering real-world usage patterns
- `setup.ts` - Test configuration and mocks

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test query-builder.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Coverage

The tests cover:

### QueryBuilder (100% coverage)

- ✅ All query methods (match, term, range, etc.)
- ✅ Pagination and sorting
- ✅ Aggregations and highlighting
- ✅ Boolean logic (should, must_not)
- ✅ Input validation for all parameters
- ✅ Query building and cleanup
- ✅ Method chaining and cloning
- ✅ Edge cases and error scenarios

### SearchClient (100% coverage)

- ✅ Constructor validation and configuration
- ✅ Search operations with retries and backoff
- ✅ Count and multi-search operations
- ✅ State management and subscriptions
- ✅ Error handling and transformation
- ✅ Dynamic configuration updates
- ✅ Concurrent operation handling

### Validation (100% coverage)

- ✅ All validation functions
- ✅ Error messages and context
- ✅ Edge cases and boundary conditions
- ✅ Type checking and format validation

### Integration Tests

- ✅ End-to-end workflows
- ✅ Real-world usage patterns
- ✅ Error handling across components
- ✅ Type safety verification
- ✅ E-commerce and analytics scenarios

## Test Scenarios Covered

1. **Basic Operations**: All CRUD-like operations work correctly
2. **Validation**: Invalid inputs are caught with helpful error messages
3. **Error Handling**: Network errors, validation errors, and edge cases
4. **Performance**: Retry logic, concurrent operations, state management
5. **Type Safety**: Generic types work correctly with TypeScript
6. **Real-World Usage**: E-commerce search, analytics dashboards, etc.

## Mock Strategy

- **Axios**: Mocked to simulate HTTP requests/responses
- **Network Conditions**: Simulated failures, timeouts, retries
- **Elasticsearch Responses**: Realistic response structures
- **Error Scenarios**: Various failure modes and edge cases
