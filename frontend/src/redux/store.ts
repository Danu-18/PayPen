import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import { baseApi } from './api/baseApi';

const appReducer = combineReducers({
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: Action) => {
  if (action.type === 'auth/logout') {
    // When logging out, reset all state to undefined so reducers initialize cleanly.
    // authReducer's logout action will safely set isHydrated = true through Immer.
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
