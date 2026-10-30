// WCAG 2.2 contrast check for the design tokens in src/app/globals.css.
// Run: npm run contrast   (exits 1 if any required pairing fails)
const themes = {
  dark: {
    bg: "#0b0b0c", surface: "#141416", surface2: "#1c1c1f", field: "#6b6b72",
    text: "#f5f1e6", muted: "#b9b4a6", gold: "#d4af37", goldFill: "#d4af37",
    onGold: "#0b0b0c", error: "#ff9b8f", success: "#8fd8a6", focus: "#d4af37", goldEdge: "#d4af37",
  },
  light: {
    bg: "#faf8f3", surface: "#ffffff", surface2: "#f2eee4", field: "#8a8578",
    text: "#1a1a1a", muted: "#4a4a4a", gold: "#7d610d", goldFill: "#d4af37",
    onGold: "#1a1a1a", error: "#b3261e", success: "#1e6b3a", focus: "#7d610d", goldEdge: "#7d610d",
  },
};

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum, purpose]
const checks = [
  ["text", "bg", 4.5, "body text"], ["text", "surface", 4.5, "body text on panels"],
  ["text", "surface2", 4.5, "body text on alt panels"],
  ["muted", "bg", 4.5, "secondary text"], ["muted", "surface", 4.5, "secondary text on panels"],
  ["muted", "surface2", 4.5, "secondary text on alt panels"],
  ["gold", "bg", 4.5, "gold links/text"], ["gold", "surface", 4.5, "gold links on panels"],
  ["gold", "surface2", 4.5, "gold text on alt panels"],
  ["onGold", "goldFill", 4.5, "button label"],
  ["field", "bg", 3, "input/control borders"], ["field", "surface", 3, "input borders on panels"],
  ["error", "bg", 4.5, "error text"], ["error", "surface", 4.5, "error text on panels"],
  ["success", "bg", 4.5, "success text"], ["success", "surface", 4.5, "success text on panels"],
  ["focus", "bg", 3, "focus ring"], ["focus", "surface", 3, "focus ring on panels"],
  ["goldEdge", "bg", 3, "gold button outline vs page"], ["goldEdge", "surface", 3, "gold button outline on panels"],
];

let failed = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min, why] of checks) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg}  ${why}`);
  }
}
if (failed) {
  console.error(`\n${failed} pairing(s) fail.`);
  process.exit(1);
}
console.log("\nAll pairings pass WCAG 2.2 AA.");
