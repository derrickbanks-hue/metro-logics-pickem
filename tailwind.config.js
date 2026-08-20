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
        // App tokens: bright, white-forward theme per Derrick's request,
        // built entirely from the official palette above. Navy is pulled
        // back to text and the header bar; gold (accent) and blue
        // (secondary) carry the color now instead of a dark navy wash.
        turf: '#FBFAF2',
        panel: '#FFFFFF',
        panelLight: '#F2F3F2',
        chalk: '#002447',
        chalkDim: '#5C7085',
        amber: '#C18447',
        crimson: '#A5322F',
        steel: '#008FD4',
        line: '#E2DFD3',
        // Navy stays available directly for the header bar, which keeps
        // the dark navy treatment used on Metro's letterhead and business
        // cards, even though the rest of the app is now light.
        navyBar: '#002447',
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
