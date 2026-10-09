/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  watchman: false,
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  
};