/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: false,
  extends: [
    "./base.cjs",
    "next/core-web-vitals",
  ],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
