/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E8F3FF",
          100: "#BEDAFF",
          200: "#94BFFF",
          300: "#6AA2FF",
          400: "#4080FF",
          500: "#165DFF",
          600: "#0E42D2",
          700: "#0A34A5",
          800: "#062579",
          900: "#03174C",
        },
        danger: {
          500: "#F53F3F",
          600: "#CB2634",
        },
        warning: {
          500: "#FF7D00",
        },
        success: {
          500: "#00B42A",
        },
        neutral: {
          50: "#F7F8FA",
          100: "#F2F3F5",
          200: "#E5E6EB",
          300: "#C9CDD4",
          400: "#86909C",
          500: "#4E5969",
          600: "#272E3B",
          700: "#1D2129",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "PingFang SC",
          "Microsoft YaHei",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "card-hover": "0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseBadge: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.24s ease-out both",
        "pulse-badge": "pulseBadge 2s ease-in-out infinite",
        "slide-in": "slideIn 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
