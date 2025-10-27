import React, { lazy, Suspense } from 'react';
import '@/styles/globals.css';

// Lazy-Loading für bessere Initial Performance
const KayaPage = lazy(() => import('@/pages/KayaPage'));

function App() {
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
