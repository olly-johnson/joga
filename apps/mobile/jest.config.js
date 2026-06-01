module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // pnpm flattens real packages under node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>,
  // so the usual `node_modules/(?!pkg)` anchor (which checks the FIRST node_modules)
  // never transforms RN/Expo packages. Anchor the allow-list at `.pnpm/` instead.
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!((jest-)?react-native|@react-native|@react-navigation|react-navigation|expo|@expo|nativewind|react-native-css-interop|@tanstack|@supabase))",
  ],
};
