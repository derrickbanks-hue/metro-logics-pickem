/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official Metro Logics brand colors (Metro_Logics_Brand_Guidance.pdf).
        // Do not alter these even if a nearby shade looks similar.
        metroPrimary: '#002447',
        metroSecondary: '#008FD4',
        metroAccent: '#C18447',
        metroNeutral: '#F2F3F2',
        metroAccentWhite: '#FBFAF2',
        // App tokens mapped onto the brand palette, kept football-friendly
        // via a subtle yard-line texture (see index.css) and the accent
        // (leather/pigskin) tone used for CTAs.
        turf: '#002447',
        panel: '#012C57',
        panelLight: '#0B3D6E',
        chalk: '#FBFAF2',
        chalkDim: '#9FB3C8',
        amber: '#C18447',
        crimson: '#A5322F',
        steel: '#008FD4',
        line: '#0B3D6E',
      },
      fontFamily: {
        // Poppins per brand guidelines: Bold for headings/CTAs, Regular for
        // body/captions. Calibri is the specified fallback.
        display: ['"Poppins"', 'Calibri', 'sans-serif'],
        body: ['"Poppins"', 'Calibri', 'sans-serif'],
        mono: ['"Poppins"', 'Calibri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
