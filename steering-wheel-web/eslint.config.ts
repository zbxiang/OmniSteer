/// <reference types="node" />

import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import parserVue from 'vue-eslint-parser';
import js from '@eslint/js';
import n from 'eslint-plugin-n';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
        ActiveXObject: 'readonly',
        /* Vue / vue-router / pinia：由源码中的 import 提供，勿在此声明为全局，否则会误判 import 未使用 */
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        defineComponent: 'readonly',
        resolveComponent: 'readonly',
        ElMessage: 'readonly',
        ElMessageBox: 'readonly',
        ElNotification: 'readonly',
        redirectToSso: 'readonly',
      },
      ecmaVersion: 2020,
      parser: parserVue,
      parserOptions: {
        parser: tsParser,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      n,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-components-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-valid-default-prop': 'warn',
      'vue/no-side-effects-in-computed-properties': 'warn',
      'vue/no-deprecated-filter': 'warn',
      'vue/no-dupe-keys': 'warn',
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
      camelcase: 'off',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-tabs': 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-labels': 'warn',
      'no-implied-eval': 'warn',
      'no-prototype-builtins': 'warn',
      'no-array-constructor': 'warn',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'prefer-promise-reject-errors': 'warn',
      'prefer-regex-literals': 'warn',
      'array-callback-return': 'warn',
      'no-mixed-operators': 'warn',
      'n/handle-callback-err': 'warn',
      'vue/html-indent': 'off',
      'vue/no-v-html': 'off',
      'vue/require-prop-types': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/attributes-order': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/no-template-shadow': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/html-quotes': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/block-order': ['error', {
        order: ['template', 'script', 'style'],
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: false,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
    },
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tsParser } },
  },
  // 忽略规则文件
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/public/**',
      '**/.vscode/**',
      '**/src/components/svg/**',
      'vite.config.ts',
      'build',
      '*.min.js',
      '.d.ts',
      'html',
    ],
  },
);
