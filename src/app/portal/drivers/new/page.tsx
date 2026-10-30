import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/portal/ui";
import NewDriverForm from "./NewDriverForm";

export const metadata = { title: "Add driver" };

export default async function NewDriver() {
  await requireStaff();
  return (
    <>
      <PageHead title="Add driver" sub="Creates the driver's sign-in. They must choose their own password the first time they sign in." />
      <NewDriverForm />
    </>
  );
}
