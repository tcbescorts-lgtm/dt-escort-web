import Link from "next/link";
import { dateTime } from "@/lib/format";

export default function NotificationList({ items }: { items: any[] }) {
  if (!items.length) return <p className="text-muted">No notifications yet.</p>;
  return (
    <ul className="divide-y divide-rule rounded-md border border-rule">
      {items.map((n) => (
        <li key={n.id} className={`p-3 ${n.read_at ? "" : "bg-surface"}`}>
          <p className={n.read_at ? "" : "font-semibold"}>
            {!n.read_at && <span className="sr-only">Unread: </span>}
            {n.link ? <Link href={n.link} className="underline-offset-4 hover:underline">{n.title}</Link> : n.title}
          </p>
          {n.body && <p className="text-muted">{n.body}</p>}
          <p className="text-sm text-muted">{dateTime(n.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}
