jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}))