import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import Navbar from "../components/Navbar";
import { usePageViewAnalytics } from "../hooks/usePageViewAnalytics";
import { useScrollToHashOrTop } from "../hooks/useScrollToHashOrTop";

export function RootLayout() {
  useScrollToHashOrTop();
  usePageViewAnalytics();

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F4F0]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
