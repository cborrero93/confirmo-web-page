/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        background: "#FAF9F5",
        cards: "#F5F4ED",
        primary: "#FFFFFF",
        text: "#3C3D3A",
        accent: "#C96442",
        border: "#D9D7D2",
        icons: "#B6B6B5",
        yellow: "#D9B366",
        red: "#a5321bff",
        green: "#2E7D32",
        placeholder: "#999999",
        toast: {
          success: "#2E7D32",
          error: "#C96442",
          info: "#B6B6B5",
          warning: "#D9B366",
        },
      },
    },
  },
  plugins: [],
}
