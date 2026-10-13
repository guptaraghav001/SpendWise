module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  setupFiles: ['./tests/setupEnv.js'],
  setupFilesAfterEnv: ['./tests/setupMocks.js']
}