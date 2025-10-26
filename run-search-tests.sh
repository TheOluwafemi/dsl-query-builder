#!/bin/bash

# Run SearchClient tests specifically to check for fixes
echo "Running SearchClient tests..."
npm test -- tests/search-client.test.ts --verbose

echo ""
echo "If you want to run all tests:"
echo "npm test"
echo ""
echo "If you want to run tests in watch mode:"
echo "npm run test:watch"