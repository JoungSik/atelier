module.exports = {
  extension: ['ts'],
  spec: 'test/unit/**/*.test.ts',
  require: 'ts-node/register',
  reporter: 'spec',
  timeout: 5000,
};
