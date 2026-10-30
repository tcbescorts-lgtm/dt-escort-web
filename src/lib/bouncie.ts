import "server-only";

export type BouncieVehicle = {
  nickName?: string;
  vin: string;
  imei: string;
  model?: { make?: string; name?: string; year?: number };
  stats?: {
    lastUpdated?: string;
    isRunning?: boolean;
    speed?: number;
    fuelLevel?: number;
    location?: { lat: number; lon: number; heading?: number; address?: string | null };
  };
};

let cached: { token: string; until: number } | null = null;

export const bouncieConfigured = () =>
  Boolean(process.env.BOUNCIE_CLIENT_ID && process.env.BOUNCIE_CLIENT_SECRET && process.env.BOUNCIE_AUTH_CODE);

/** Bouncie access tokens are short-lived; the authorization code from the developer portal is exchanged for a fresh one. */
async function token() {
  if (cached && cached.until > Date.now()) return cached.token;
  const res = await fetch("https://auth.bouncie.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.BOUNCIE_CLIENT_ID!,
      client_secret: process.env.BOUNCIE_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: process.env.BOUNCIE_AUTH_CODE!,
      redirect_uri: process.env.BOUNCIE_REDIRECT_URI ?? "https://dtescortservice.com/portal/map",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bouncie sign-in failed (${res.status})`);
  const j = await res.json();
  cached = { token: j.access_token, until: Date.now() + Math.max(60, (j.expires_in ?? 3600) - 120) * 1000 };
  return cached.token;
}

export async function bouncieVehicles(): Promise<{ vehicles: BouncieVehicle[]; error?: string }> {
  if (!bouncieConfigured()) return { vehicles: [] };
  try {
    const res = await fetch("https://api.bouncie.dev/v1/vehicles", { headers: { Authorization: await token() }, cache: "no-store" });
    if (!res.ok) return { vehicles: [], error: `Bouncie returned ${res.status}` };
    return { vehicles: await res.json() };
  } catch (e) {
    return { vehicles: [], error: e instanceof Error ? e.message : "Bouncie error" };
  }
}
