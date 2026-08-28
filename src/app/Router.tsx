import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import LandingPage from "@/pages/landing/LandingPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
