// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";
import ScrollToTop from "./components/utils/ScrollToTop";
import Simulator from "./pages/Simulator";
import Results from "./pages/Result";
import History from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/simulator" replace />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
