/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    navy: '#021a32',
                    gold: '#c6a87c',
                    light: '#f8f8f8'
                }
            },
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
                serif: ['"Libre Baskerville"', 'serif'],
            }
        },
    },
    plugins: [],
}
