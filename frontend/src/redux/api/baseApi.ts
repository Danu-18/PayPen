import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { logout } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;
    const data = result.error.data as { code?: string; message?: string } | undefined;

    // 401 Unauthorized -> clear state and redirect to login
    if (status === 401) {
      api.dispatch(logout());
      api.dispatch(baseApi.util.resetApiState());
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.replace('/login');
      }
    }

    // 403 EMAIL_UNVERIFIED -> redirect to verify-email
    if (status === 403 && data?.code === 'EMAIL_UNVERIFIED') {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/verify-email')) {
        window.location.replace('/verify-email');
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile', 'Wallet', 'Transactions'],
  endpoints: () => ({}),
});
