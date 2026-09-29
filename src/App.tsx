import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { SourceDrawer } from './components/SourceDrawer.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { ChatPage } from './pages/ChatPage.tsx';
import { StandardsPage } from './pages/StandardsPage.tsx';
import { CertificationPage } from './pages/CertificationPage.tsx';
import { VerifyPage } from './pages/VerifyPage.tsx';
import { ComplaintPage } from './pages/ComplaintPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-150">
            <Navbar />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/standards" element={<StandardsPage />} />
                <Route path="/certification" element={<CertificationPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/complaint" element={<ComplaintPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>

            <Footer />
            <MobileBottomNav />
            <SourceDrawer />
          </div>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
