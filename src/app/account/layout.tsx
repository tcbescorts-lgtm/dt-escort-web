import AuthShell from "@/components/portal/AuthShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
