# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Search Query Builder
- Fluent TypeScript query builder for OpenSearch/Elasticsearch DSL
- Built-in HTTP client with retry logic and state management
- Full TypeScript support with generic types
- Comprehensive test suite with 100% coverage
- Multi-search support for bulk operations
- Observable state management for UI integration

### Features

- **Query Builder**: Support for all major Elasticsearch query types

  - Match, term, range, wildcard, prefix queries
  - Boolean logic with should, must, must_not clauses
  - Multi-field search with multi_match
  - Aggregations (terms, date histogram, custom)
  - Sorting, pagination, source filtering
  - Highlighting support

- **Search Client**: Production-ready HTTP client

  - Automatic retry with exponential backoff
  - State management with observable pattern
  - Multi-search operations
  - Count queries
  - Dynamic configuration updates
  - Type-safe results with generics

- **Developer Experience**:
  - Full TypeScript integration
  - Comprehensive validation with helpful error messages
  - Fluent API with method chaining
  - Query cloning and reuse
  - Zero configuration with sensible defaults

## [1.0.0] - 2025-01-XX

### Added

- Initial stable release
- Complete feature set for production use
- Comprehensive documentation and examples
- GitHub Actions CI/CD pipeline
- NPM publishing automation
