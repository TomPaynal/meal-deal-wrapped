import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  /*
   * GitHub Pages will host this project at:
   *
   * https://TomPaynal.github.io/meal-deal-wrapped/
   */
  base: '/meal-deal-wrapped/',
})