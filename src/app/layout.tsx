import type { Metadata } from "next";
import "./globals.css";
import { AnalysisProvider } from "../context/AnalysisContext";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";

export const metadata: Metadata = {
  title: "Snackible Nutrition Platform",
  description: "Internal nutrition compliance, packaging QC & market intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalysisProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 ml-60 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6" style={{ background: "#F4F7F5" }}>
                {children}
              </main>
            </div>
          </div>
        </AnalysisProvider>
      </body>
    </html>
  );
}
