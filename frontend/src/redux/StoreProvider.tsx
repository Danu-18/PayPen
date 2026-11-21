'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrate } from './slices/authSlice';
import { Toaster } from 'sonner';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrate());
  }, []);

  return (
    <Provider store={store}>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </Provider>
  );
}
