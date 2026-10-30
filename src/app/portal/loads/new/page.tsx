import { requireStaff } from "@/lib/auth";
import { loadFormData } from "../data";
import { PageHead } from "@/components/portal/ui";
import LoadForm from "../LoadForm";

export const metadata = { title: "Book a load" };

export default async function NewLoad() {
  await requireStaff();
  const data = await loadFormData();
  return (
    <>
      <PageHead title="Book a load" sub="Paste notes to fill the form, review, then save." />
      <LoadForm {...data} />
    </>
  );
}
