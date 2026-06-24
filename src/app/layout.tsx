import type { Metadata } from "next";
import "./globals.css";
import NavSidebar from "../components/NavSidebar";

export const metadata: Metadata = {
  title: "Snackible Nutrition Platform",
  description: "Internal nutrition compliance, packaging QC & market intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#003433" }}>
        <NavSidebar />
        <main style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
