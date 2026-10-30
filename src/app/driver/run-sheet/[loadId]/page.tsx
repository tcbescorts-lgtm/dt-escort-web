import { notFound } from "next/navigation";
import { requireDriver } from "@/lib/auth";
import { runSheetBundle } from "@/lib/runsheet-data";
import RunSheetForm from "@/components/runsheet/RunSheetForm";

export const metadata = { title: "Run sheet" };

export default async function DriverRunSheet({ params }: { params: Promise<{ loadId: string }> }) {
  const me = await requireDriver();
  const { loadId } = await params;
  const b = await runSheetBundle(loadId, me.driverId);
  if (!b) notFound();
  return (
    <>
      <h1 className="sr-only">Run sheet for {b.load.load_no}</h1>
      <RunSheetForm mode="driver" {...b} />
    </>
  );
}
