import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Opens a private file through a short-lived signed URL. Storage RLS decides who may. */
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get("bucket") ?? "";
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!["driver-docs", "run-sheet-files"].includes(bucket) || !path) return new NextResponse("Not found", { status: 404 });
  const sb = await supabaseServer();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60);
  if (error || !data) return new NextResponse("Not allowed", { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
