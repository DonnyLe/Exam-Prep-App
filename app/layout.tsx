import { GeistSans } from "geist/font/sans";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import "./globals.css";
export const metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "Exam Prep · A little practice, a lot of progress",
  description: "A personal study plan that grows with you.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <Suspense fallback={<main>{children}</main>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
