# Test Coverage Report

This directory contains test coverage reports for the Device Loan Service.

## Coverage Thresholds

The project maintains the following minimum coverage requirements:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Running Tests Locally

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Concurrency tests only
npm run test:concurrency
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Structure

```
tests/
├── unit/                    # Unit tests with mocks
│   ├── domain/             # Domain entity tests
│   └── useCases/           # Use case logic tests
├── integration/            # End-to-end workflow tests
├── concurrency/            # Concurrency and race condition tests
├── mocks/                  # Mock implementations
│   ├── MockLoanRepository.ts
│   ├── MockDeviceSnapshotRepository.ts
│   └── MockLoanEventPublisher.ts
└── fixtures/               # Test data fixtures
    ├── deviceFixtures.ts
    └── loanFixtures.ts
```

## Viewing Coverage Reports

After running `npm run test:coverage`, open:
```
./coverage/index.html
```

## CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, or `Develop` branches
- Pull requests to these branches
- Manual workflow dispatch

Coverage reports are uploaded to Codecov and attached to GitHub Actions artifacts.

## Key Test Scenarios

### Unit Tests
- Domain entity validation
- Business logic in use cases
- Error handling
- Authorization checks

### Integration Tests
- Complete loan lifecycle workflows
- Multi-user scenarios
- Event-driven workflows
- Data consistency verification

### Concurrency Tests
- Race conditions on shared resources
- Concurrent loan creation
- Idempotency verification
- High-load scenarios

## Mocking Strategy

All tests use in-memory mocks - no external dependencies required:
- **MockLoanRepository**: Simulates Cosmos DB operations
- **MockDeviceSnapshotRepository**: Device inventory mock
- **MockLoanEventPublisher**: Event Grid mock
- All mocks track call counts for verification
