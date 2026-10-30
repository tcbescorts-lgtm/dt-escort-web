import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import NotificationList from "@/components/portal/NotificationList";
import PushToggle from "@/components/PushToggle";
import { markMyNotificationsRead } from "../actions";

export const metadata = { title: "Alerts" };

export default async function DriverNotifications() {
  await requireDriver();
  const sb = await supabaseServer();
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-2">Alerts</h1>
        <form action={markMyNotificationsRead}><button className="btn btn-line">Mark all read</button></form>
      </div>
      <div className="my-4"><PushToggle /></div>
      <NotificationList items={data ?? []} />
    </>
  );
}
