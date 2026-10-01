import { hairlineWidth } from "nativewind/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The theme is toggled from Settings via setColorScheme, which needs class mode;
  // it's also what makes the `.dark:root` variables in global.css apply.
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // RemindU-specific tokens (see src/global.css)
        cocoa: "hsl(var(--label))", // field labels
        walnut: "hsl(var(--body))", // body copy
        takeover: "hsl(var(--takeover))",
        "switch-off": "hsl(var(--switch-off))",
        dashline: "hsl(var(--dashed))", // dashed utility button border
        success: {
          DEFAULT: "hsl(var(--success))",
          bg: "hsl(var(--success-bg))",
        },
        "error-bg": "hsl(var(--error-bg))",
      },
      // Type scale from the design system (size / line height)
      fontSize: {
        display: ["34px", "40px"],
        quote: ["30px", "36px"],
        title: ["28px", "34px"],
        section: ["22px", "28px"],
        button: ["16px", "20px"],
        body: ["15px", "22px"],
        label: ["13px", "18px"],
        caption: ["12px", "16px"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        field: "10px", // stepper field
        tile: "12px", // icon tile
        row: "14px", // inline row
        input: "16px", // input, list row
        card: "20px", // card
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
