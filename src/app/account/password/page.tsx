import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import PasswordForm from "./PasswordForm";

export const metadata: Metadata = { title: "Set your password", robots: { index: false } };

export default async function PasswordPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 className="display-2">{me.mustChangePassword ? "Set a new password" : "Change password"}</h1>
      {me.mustChangePassword && (
        <p className="mt-3 text-muted">
          You signed in with a temporary password. Choose your own before using the portal.
        </p>
      )}
      <PasswordForm email={me.email} />
    </div>
  );
}
