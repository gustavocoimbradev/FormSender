import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ScrollRoot } from "@/components/ScrollRoot";

export const metadata: Metadata = {
  title: "FormSender",
  description: "Send email from your website forms, with no back end to write.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07070d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ScrollRoot>{children}</ScrollRoot>
      </body>
    </html>
  );
}
