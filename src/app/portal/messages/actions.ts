"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function markCommsRead() {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("comms").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/portal/messages");
}
