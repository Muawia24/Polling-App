# Testing Guide for Polling App

## Overview

This document provides information about the testing setup for the Polling App project. The project uses Jest as the testing framework along with React Testing Library for component testing.

## Running Tests

To run all tests in the project, use the following command:

```bash
npm test
```

This will execute all test files that match the pattern specified in the Jest configuration.

## Test Structure

Tests are organized following the same structure as the source code:

- `src/lib/__tests__/` - Tests for utility functions and server actions
- `src/app/__tests__/` - Integration tests for app routes and features
- `src/components/__tests__/` - Tests for React components (to be added)

## Server Actions Testing

Server actions in `src/lib/actions.ts` are tested using Jest mocks to simulate Supabase database interactions. The tests verify:

1. Input validation (missing fields, invalid data)
2. Authorization checks
3. Error handling
4. Successful operations

## Unit Tests

Unit tests focus on testing individual functions in isolation. Examples include:

- `src/lib/__tests__/actions.test.ts` - Tests for server actions like creating, updating, and deleting polls
- `src/lib/__tests__/polls.test.ts` - Tests for poll-related functions like fetching a poll by ID and listing all polls

## Integration Tests

Integration tests verify that different parts of the application work together correctly:

- `src/app/__tests__/polls-integration.test.ts` - Tests the complete poll update flow, including data fetching, updating, and path revalidation

## Adding New Tests

When adding new functionality, follow these guidelines for creating tests:

1. Create test files with the `.test.ts` or `.test.tsx` extension
2. Place test files in a `__tests__` directory adjacent to the code being tested
3. Use descriptive test names that explain the expected behavior
4. Mock external dependencies (database, authentication, etc.)
5. Test both success and failure scenarios

## Mocks

The project uses several mocks to isolate tests from external dependencies:

- `jest.setup.js` - Contains global mocks and setup code
- `src/lib/__mocks__/` - Contains mocks for specific modules
- `__mocks__/` - Contains mocks for Next.js modules

## Test Configuration

Test configuration is defined in `jest.config.js` at the root of the project. This includes:

- Test environment setup
- Module path mapping
- Test file patterns
- Setup files