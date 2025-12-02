## [1.4.3](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.4.2...v1.4.3) (2025-12-02)


### Bug Fixes

* prevent runtime errors from undefined properties in validation and error handling ([c3f20de](https://github.com/TheOluwafemi/dsl-query-builder/commit/c3f20de6fb5f1c4f1bd4841f245cbb2aec0f49bd))

## [1.4.2](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.4.1...v1.4.2) (2025-12-02)


### Bug Fixes

* prevent runtime errors with defensive array and string checking ([defd32a](https://github.com/TheOluwafemi/dsl-query-builder/commit/defd32a85f1d0b725bd27f9c683a5d9cda444cfe))

## [1.4.1](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.4.0...v1.4.1) (2025-12-02)


### Bug Fixes

* replace Array.includes() with indexOf() to prevent runtime errors ([bbf3dea](https://github.com/TheOluwafemi/dsl-query-builder/commit/bbf3deac32c36c519101d6638ede7de3d8bc2453))

# [1.4.0](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.3.0...v1.4.0) (2025-12-01)


### Features

* enhance validation system with comprehensive error tracking ([2c8b8b4](https://github.com/TheOluwafemi/dsl-query-builder/commit/2c8b8b4ecb4098b368890c2f997a1e61a520fb82))

# [1.3.0](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.2.0...v1.3.0) (2025-12-01)


### Features

* add configurable token authentication types ([9d758b4](https://github.com/TheOluwafemi/dsl-query-builder/commit/9d758b4852995c44d4d59f4432ffcb92bfc6534c))

# [1.2.0](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.1.0...v1.2.0) (2025-12-01)


### Features

* support direct endpoint usage without automatic path suffixes ([c22669d](https://github.com/TheOluwafemi/dsl-query-builder/commit/c22669df57cd99bdefed197102471e623d9af308))

# [1.1.0](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.0.2...v1.1.0) (2025-12-01)


### Features

* add response transformation support for proxy services ([b9e29fe](https://github.com/TheOluwafemi/dsl-query-builder/commit/b9e29fe899165929b450e6748a7d7cf5661f07b3))
* add support for proxy services and improve search client index handling ([4a54267](https://github.com/TheOluwafemi/dsl-query-builder/commit/4a54267ff17f10aa029a02d4e524c61274251b96))

## [1.0.2](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.0.1...v1.0.2) (2025-11-22)


### Bug Fixes

* deploy package to npm registry ([f4aabd5](https://github.com/TheOluwafemi/dsl-query-builder/commit/f4aabd57a804e6e40566abf9557193c16f98d6cb))

## [1.0.1](https://github.com/TheOluwafemi/dsl-query-builder/compare/v1.0.0...v1.0.1) (2025-11-22)


### Bug Fixes

* README with improved examples, clearer instructions for client setup and deploy package. ([9c034de](https://github.com/TheOluwafemi/dsl-query-builder/commit/9c034de8dd46101712abd1d84a9454387faa6367))

# 1.0.0 (2025-11-22)

### Bug Fixes

- update README to reflect correct library name for tests ([3d744f0](https://github.com/TheOluwafemi/dsl-query-builder/commit/3d744f0ae106d3e15725378f33ac00b229dbe22f))
- update TypeScript configuration to use ES2020 and commonjs module ([bc3d79b](https://github.com/TheOluwafemi/dsl-query-builder/commit/bc3d79be4da7ddd667408ecdb26b72cc66065365))

### Features

- add issue templates, CI/CD workflows, and deployment scripts for DSL Query Builder ([49d33c6](https://github.com/TheOluwafemi/dsl-query-builder/commit/49d33c6c0fcba24e700d3451875b3dacccc96a6b))
- enhance .gitignore and .npmignore for better build and environment management ([463fe77](https://github.com/TheOluwafemi/dsl-query-builder/commit/463fe77bf2e1e176e6c109df72759bd0c2c78eac))
- enhance term query to automatically append '.keyword' for exact matching ([684ae96](https://github.com/TheOluwafemi/dsl-query-builder/commit/684ae9656d4c3c25d2cb95764a1399221d6c4cc5))
- implement SearchClient and QueryBuilder with enhanced query capabilities ([172dcc1](https://github.com/TheOluwafemi/dsl-query-builder/commit/172dcc1a9a3bf00e20f0b59d477a2d0bd0c5e630))
- improve error handling and retry logic in SearchClient ([7a4bf81](https://github.com/TheOluwafemi/dsl-query-builder/commit/7a4bf816cd71eb2ff9591a471d2f50bf3532b7b4))
- migrate to semantic-release for versioning and release management ([08abe75](https://github.com/TheOluwafemi/dsl-query-builder/commit/08abe7525e8eb82a2bc470ecb9b0875d666921f5))
- open search client & query-builder ([ad500b0](https://github.com/TheOluwafemi/dsl-query-builder/commit/ad500b0968885c0cac74d7b4cd71f1a95698192b))
- update build process and add validation utilities ([4d8062e](https://github.com/TheOluwafemi/dsl-query-builder/commit/4d8062e2753e8f9eebd8963c42046c00325587f0))
- update term queries to use keyword fields for exact matching ([41e9f94](https://github.com/TheOluwafemi/dsl-query-builder/commit/41e9f942fc045472b040ed65a7ea22cbf241eb9d))
- update workflows and tests for DSL Query Builder package ([f7e30bf](https://github.com/TheOluwafemi/dsl-query-builder/commit/f7e30bf3a56f5b3444febd4773cd7089a62f7d53))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of DSL Query Builder
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
