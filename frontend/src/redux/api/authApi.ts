import { baseApi } from './baseApi';
import { AuthResponse, User } from '@/src/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      AuthResponse,
      { name: string; email: string; password: string; password_confirmation: string }
    >({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    resendVerification: builder.mutation<{ message: string }, { email?: string } | void>({
      query: (body) => ({
        url: '/auth/email/resend',
        method: 'POST',
        body: body || {},
      }),
    }),
    verifyEmail: builder.query<{ message: string; user: User }, { id: string | number; hash: string; urlParams?: string }>({
      query: ({ id, hash, urlParams }) => ({
        url: `/auth/email/verify/${id}/${hash}${urlParams ? `?${urlParams}` : ''}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useResendVerificationMutation,
  useLazyVerifyEmailQuery,
} = authApi;
