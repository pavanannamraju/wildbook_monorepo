import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useScrollToHashOrTop } from "../hooks/useScrollToHashOrTop";

export function RootLayout() {
  useScrollToHashOrTop();

  return (
    <div className="min-h-screen bg-[#F6F4F0] flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

