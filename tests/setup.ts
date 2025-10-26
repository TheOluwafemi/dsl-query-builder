// Test setup file
import { jest } from '@jest/globals'

// Set default timeout for all tests
jest.setTimeout(15000)

// Extend Jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Custom matchers can be added here
    }
  }
}
