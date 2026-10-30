import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex min-h-11 items-center gap-3">
            <Image src="/brand/dt-logo-nophone.png" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="font-display text-xl font-bold">D&nbsp;&amp;&nbsp;T <span className="text-gold">Portal</span></span>
          </Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="focus:outline-none">{children}</main>
    </>
  );
}
