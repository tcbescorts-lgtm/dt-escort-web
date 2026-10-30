import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/portal/ui";
import CustomerForm from "../CustomerForm";

export const metadata = { title: "Add customer" };

export default async function NewCustomer() {
  await requireStaff();
  return (
    <>
      <PageHead title="Add customer" />
      <CustomerForm />
    </>
  );
}
