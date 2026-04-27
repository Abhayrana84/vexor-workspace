// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          0: '#0a0b0f',
          1: '#0f1117',
          2: '#14161e',
          3: '#1a1d28',
          4: '#1f2333',
          5: '#252940',
        },
        accent: {
          DEFAULT: '#6d6afe',
          2: '#8b89ff',
          bg: 'rgba(109,106,254,0.1)',
          border: 'rgba(109,106,254,0.25)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          2: 'rgba(255,255,255,0.09)',
          3: 'rgba(255,255,255,0.15)',
        },
        txt: {
          0: '#f0f2ff',
          1: '#c8ccdd',
          2: '#8890aa',
          3: '#555c78',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
        modal: '0 8px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}

export default config
