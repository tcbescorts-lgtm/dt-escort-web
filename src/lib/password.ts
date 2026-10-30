const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "letmein1",
  "welcome1", "iloveyou1", "admin123", "changeme1", "dtescort1", "escort123", "trucking1",
]);

/** Returns a list of problems; empty means the password is acceptable. */
export function passwordProblems(pw: string, email = ""): string[] {
  const out: string[] = [];
  if (pw.length < 10) out.push("Use at least 10 characters.");
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) out.push("Mix at least three of: lowercase, uppercase, numbers, symbols.");
  if (COMMON.has(pw.toLowerCase())) out.push("That password is too common.");
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && pw.toLowerCase().includes(local)) out.push("Don't include your email name.");
  if (/^(.)\1+$/.test(pw)) out.push("Don't repeat one character.");
  return out;
}

/** Unique, readable temporary password for a new account (e.g. "Rig-7413-Hawk-Lane"). */
export function tempPassword(): string {
  const words = ["Rig", "Hawk", "Lane", "Mile", "Pole", "Flag", "Gold", "Delta", "Route", "Haul", "Cone", "Beam", "Pier", "Ridge", "Mesa", "Bayou"];
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const w = (i: number) => words[bytes[i] % words.length];
  const n = String(1000 + (bytes[1] % 9000));
  return `${w(0)}-${n}-${w(2)}-${w(3)}!`;
}
