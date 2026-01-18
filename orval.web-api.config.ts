import { defineConfig } from 'orval';

export default defineConfig({
  omnium: {
    input: {
      target: 'src/lib/webApi/openapi.json',
    },
    output: {
      mode: 'split',
      target: 'src/lib/webApi/generated/requests.ts',
      schemas: 'src/lib/webApi/generated/models',
      client: 'axios-functions',
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: 'src/lib/webApi/webApiFetch.ts',
          name: 'webApiFetch',
        },
      },
    },
  },
});
