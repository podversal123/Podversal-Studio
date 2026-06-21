'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterWrapper() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#181818',
          color: '#fff',
          border: '1px solid #2a2a2a',
          borderRadius: 0,
        },
      }}
    />
  );
}
