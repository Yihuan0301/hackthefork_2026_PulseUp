import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        linen: {
          50: "#FBF7F2",
          100: "#F4EDE3",
          200: "#E7D9C8",
        },
        ink: {
          DEFAULT: "#3A322C",
          soft: "#6F645B",
        },
        sage: {
          50: "#F2F6F1",
          100: "#E3EDE3",
          300: "#A9C3AA",
          500: "#6E9474",
          700: "#3F5C46",
          800: "#314736",
        },
        clay: {
          50: "#FBF3EE",
          100: "#F3E2D8",
          400: "#D4A08A",
          600: "#A86B52",
          700: "#8C5340",
        },
        honey: {
          100: "#F8EED9",
          500: "#B8893E",
        },
      },
      boxShadow: {
        card: "0 16px 40px rgba(90, 62, 40, 0.06)",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
      },
    },
  },
  plugins: [animate],
};
