import type { Config } from 'tailwindcss'
import { lookrentPreset } from '@lookrent/config/tailwind'

const config: Config = {
  presets: [lookrentPreset as Config],
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
