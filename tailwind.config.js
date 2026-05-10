/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0B",
        carbon: "#141416",
        steel: "#1F1F23",
        rule: "#2A2A2F",
        mute: "#6E6E76",
        bone: "#FAFAF7",
        volt: {
          DEFAULT: "#E5FF00",
          50: "#FBFFD9",
          200: "#F2FF80",
          400: "#E5FF00",
          600: "#B8CC00",
        },
        lime: { DEFAULT: "#7CFF6B", soft: "#1A2E15" },
        amber: { DEFAULT: "#FFB020", soft: "#2A1F0A" },
        scarlet: { DEFAULT: "#FF3D3D", soft: "#2E1414" },
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', "Impact", "sans-serif"],
        body: ['"Familjen Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        hero: ["clamp(4rem, 9vw, 8rem)", { lineHeight: "0.9", letterSpacing: "-0.02em", fontWeight: "900" }],
        "display-2xl": ["4rem", { lineHeight: "0.92", letterSpacing: "-0.015em", fontWeight: "800" }],
        "display-xl": ["3rem", { lineHeight: "0.95", letterSpacing: "-0.01em", fontWeight: "800" }],
        "display-lg": ["2.25rem", { lineHeight: "1", letterSpacing: "-0.005em", fontWeight: "800" }],
        display: ["1.75rem", { lineHeight: "1.05", fontWeight: "800" }],
        "display-sm": ["1.25rem", { lineHeight: "1.1", fontWeight: "700" }],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        edge: "inset 0 0 0 1px #2A2A2F",
        "edge-volt": "inset 0 0 0 1px #E5FF00",
        card: "0 1px 0 0 #2A2A2F, 0 0 0 1px #1F1F23",
        "volt-glow": "0 0 0 1px #E5FF00, 0 0 24px -4px rgba(229, 255, 0, 0.5)",
      },
      animation: {
        "voltage-flicker": "voltageFlicker 1.4s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        scan: "scan 8s linear infinite",
        blink: "blink 1.2s step-end infinite",
      },
      keyframes: {
        voltageFlicker: {
          "0%, 100%": { opacity: "1" },
          "47%": { opacity: "1" },
          "48%": { opacity: "0.55" },
          "49%": { opacity: "1" },
          "50%": { opacity: "0.7" },
          "51%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
