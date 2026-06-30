/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // Tắt reset CSS mặc định của Tailwind để không đụng độ Antd
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

