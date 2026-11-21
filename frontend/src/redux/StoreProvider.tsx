'use client';

import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrate } from './slices/authSlice';
import { Toaster } from 'sonner';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  if (!initialized.current) {
    store.dispatch(hydrate());
    initialized.current = true;
  }

  useEffect(() => {
    // re-run hydration check on mount for safety
    store.dispatch(hydrate());
  }, []);

  return (
    <Provider store={store}>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </Provider>
  );
}
