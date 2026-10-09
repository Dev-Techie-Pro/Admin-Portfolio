import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: ['public/js/**', '.next/**', 'node_modules/**'],
  },
  {
    rules: {
      '@next/next/no-page-custom-font': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default config;
