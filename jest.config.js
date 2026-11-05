module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-file-system/legacy$': '<rootDir>/src/__mocks__/expo-file-system.js',
    '^expo-file-system$': '<rootDir>/src/__mocks__/expo-file-system.js',
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.js',
    '^expo-image-manipulator$': '<rootDir>/src/__mocks__/expo-image-manipulator.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
      }
    }]
  }
};
