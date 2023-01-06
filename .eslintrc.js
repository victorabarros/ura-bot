// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "quotes": ["error", "double"],
    "semi": ["error", "never"],
    "default-case": ["off"],
    "react/prop-types": ["off"],
    "react/jsx-filename-extension": ["off"],
    "react/jsx-props-no-spreading": ["off"],
    "no-floating-decimal": ["off"],
    "func-names": ["off"],
    "no-unused-expressions": ["off"]
  }
}
