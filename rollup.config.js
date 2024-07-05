import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import terser from '@rollup/plugin-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.node.js',
        format: 'cjs'
      },
      {
        file: 'dist/index.js',
        format: 'es'
      },
      {
        file: 'dist/generic-router.umd.js',
        name: 'YUM',
        extend: true,
        format: 'umd'
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      terser()
    ]
  },
  {
    input: resolve(__dirname, 'dist/index.d.ts'),
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts({ respectExternal: true })]
  }
];
