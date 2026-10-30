import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHead } from "@/components/portal/ui";
import NotificationList from "@/components/portal/NotificationList";
import PushToggle from "@/components/PushToggle";
import { markAllRead } from "../_actions/misc";

export const metadata = { title: "Notifications" };

export default async function Notifications() {
  await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHead title="Notifications" actions={<form action={markAllRead}><button className="btn btn-line">Mark all as read</button></form>} />
      <div className="mb-4"><PushToggle /></div>
      <NotificationList items={data ?? []} />
    </>
  );
}
