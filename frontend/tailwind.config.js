/** @type {import('tailwindcss').Config} */
import formsPlugin from '@tailwindcss/forms';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "var(--primary)",
        "primary-container": "var(--primary-container)",
        "on-primary": "var(--on-primary)",
        "on-primary-container": "var(--on-primary-container)",
        "inverse-primary": "#bcc7de",
        "primary-fixed": "#d8e3fb",
        "primary-fixed-dim": "#bcc7de",
        "on-primary-fixed": "#111c2d",
        "on-primary-fixed-variant": "#3c475a",
        
        "secondary": "var(--secondary)",
        "secondary-container": "#d0e1fb",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#54647a",
        "secondary-fixed": "#d3e4fe",
        "secondary-fixed-dim": "#b7c8e1",
        "on-secondary-fixed": "#0b1c30",
        "on-secondary-fixed-variant": "#38485d",

        "tertiary": "#00190e",
        "tertiary-container": "#00301e",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#00a472",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#005236",

        "error": "var(--error)",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "background": "var(--background)",
        "on-background": "var(--on-background)",

        "surface": "var(--surface)",
        "on-surface": "var(--on-surface)",
        "surface-dim": "#dcd9db",
        "surface-bright": "#fbf8fa",
        "surface-variant": "#e4e2e3",
        "on-surface-variant": "var(--on-surface-variant)",

        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",

        "outline": "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        "inverse-surface": "#303032",
        "inverse-on-surface": "#f3f0f2",
        "surface-tint": "#545f73",
      },
      borderRadius: {
        "sm": "0.25rem",
        "DEFAULT": "0.5rem",
        "md": "0.5rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px",
      },
      spacing: {
        "base": "4px",
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "gutter": "24px",
      },
      fontFamily: {
        "sans": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "data-mono": ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [formsPlugin],
}
