import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {}
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Ensure React JSX transform works correctly in tests
    deps: {
      optimizer: {
        web: {
          include: ['react', 'react-dom', '@testing-library/react']
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'src/test/', 'src/data/']
    }
  }
})
