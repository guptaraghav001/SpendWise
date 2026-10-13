process.env.NODE_ENV = 'test'

process.env.JWT_SECRET =
  'spendwise-isolated-jest-testing-secret-2026'

delete process.env.DATABASE_URL