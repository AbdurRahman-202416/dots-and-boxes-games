import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "ink-*" used to be the dark UI surfaces. On the parchment theme we
        // keep the class names but flip them to map onto warm tan tones so the
        // existing `bg-ink-800/40`, `border-ink-500` style attributes still
        // produce a coherent (now light) result.
        ink: {
          900: "#FAF1D6",
          800: "#F2E5B9",
          700: "#E7D5A1",
          600: "#D6C089",
          500: "#C9B580",
          400: "#A38B57",
        },
        // "bone-*" used to be the light text tones. Now they describe the
        // dark warm-ink text that sits on top of parchment.
        bone: {
          DEFAULT: "#1C1605",
          dim: "#5A4623",
          mute: "#8A7547",
        },
        acid: "#7A8F00",
        coral: "#B91C1C",
        sky: "#1E40AF",
        amber: "#B45309",
      },
      fontFamily: {
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.05em",
        wider2: "0.18em",
      },
      keyframes: {
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "20%": { transform: "translate(-15%, 5%)" },
          "30%": { transform: "translate(7%, -25%)" },
          "40%": { transform: "translate(-5%, 25%)" },
          "50%": { transform: "translate(-15%, 10%)" },
          "60%": { transform: "translate(15%, 0%)" },
          "70%": { transform: "translate(0%, 15%)" },
          "80%": { transform: "translate(3%, 35%)" },
          "90%": { transform: "translate(-10%, 10%)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        grain: "grain 8s steps(10) infinite",
        glow: "glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
