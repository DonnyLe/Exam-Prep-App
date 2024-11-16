import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <SidebarProvider>
  //     <AppSidebar />
  //     <main>
  //       <SidebarTrigger />
  //       {children}
  //     </main>
  //   </SidebarProvider>
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="w-screen">
        <SidebarProvider>
          <AppSidebar />

          <main className="flex flex-grow">
            <SidebarTrigger />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
