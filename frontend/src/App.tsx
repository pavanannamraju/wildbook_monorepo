import "./index.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout.tsx";
import { RequireAdmin, RequireAuthenticated } from "./auth/RequireAdmin.tsx";
import { AccountPage } from "./pages/account/AccountPage.tsx";
import { AdminComingSoonPage } from "./pages/admin/AdminComingSoonPage.tsx";
import { AdminInquiriesPage } from "./pages/admin/AdminInquiriesPage.tsx";
import { AdminLayout } from "./pages/admin/AdminLayout.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { ExploreExpertsPage } from "./pages/ExploreExpertsPage.tsx";
import { ExpertDetailPage } from "./pages/ExpertDetailPage.tsx";
import { SharedSafarisPage } from "./pages/SharedSafarisPage.tsx";
import { HomestaysPage } from "./pages/HomestaysPage.tsx";
import { AboutUsPage } from "./pages/AboutUsPage.tsx";
import { ResponsiblePage } from "./pages/ResponsiblePage.tsx";
import { WildlifeCodePage } from "./pages/WildlifeCodePage.tsx";
import { FaqsPage } from "./pages/FaqsPage.tsx";
import { PrivacyPage } from "./pages/PrivacyPage.tsx";
import { TermsPage } from "./pages/TermsPage.tsx";
import { FeedbackPage } from "./pages/FeedbackPage.tsx";
import { ContactPage } from "./pages/ContactPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { CreateGuidePage } from "./pages/CreateGuidePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { AccommodationDetailPage } from "./pages/AccommodationDetailPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/experts" element={<ExploreExpertsPage />} />
        <Route path="/experts/:slugOrId" element={<ExpertDetailPage />} />
        <Route path="/accommodations/:slugOrId" element={<AccommodationDetailPage />} />
        <Route path="/safaris" element={<SharedSafarisPage />} />
        <Route path="/homestays" element={<HomestaysPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/responsible" element={<ResponsiblePage />} />
        <Route path="/wildlife-code" element={<WildlifeCodePage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-guide" element={<CreateGuidePage />} />
        <Route
          path="/account"
          element={
            <RequireAuthenticated>
              <AccountPage />
            </RequireAuthenticated>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="inquiries" replace />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="coming-soon" element={<AdminComingSoonPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
