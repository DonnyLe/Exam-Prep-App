import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AuthButton from "@/components/AuthButton";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Exam Prep",
  description: "Never cram for your exams again",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <SidebarProvider className="h-screen w-screen">
          <AppSidebar />

          <main className="h-full w-full">
            <div className="flex flex-grow flex-col rounded-full">
              <nav className="w-full flex h-24 justify-between items-center">
                <SidebarTrigger />
                <AuthButton />
              </nav>
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
