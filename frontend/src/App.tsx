import React, { lazy, Suspense } from 'react';
import '@/styles/globals.css';

// Build Info - Forces new hash on deploy
declare const __BUILD_DATE__: string;
const BUILD_INFO = {
  id: import.meta.env.VITE_BUILD_ID || 'local',
  date: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString(),
  version: '2.0.1-threejs'
};

// Lazy-Loading für bessere Initial Performance
const KayaPage = lazy(() => import('@/pages/KayaPage'));

function App() {
  // Log build info in development
  if (import.meta.env.DEV) {
    console.log('🔧 Build Info:', BUILD_INFO);
  }
  return (
    <div className="App">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-lc-primary-50 to-lc-gold-50">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-lc-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lc-primary-700 font-medium">KAYA lädt...</p>
          </div>
        </div>
      }>
        <KayaPage />
      </Suspense>
    </div>
  );
}

export default App;
