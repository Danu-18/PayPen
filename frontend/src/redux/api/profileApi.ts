import { baseApi } from './baseApi';
import { ProfileResponse, User } from '@/src/types';

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: '/profile',
        method: 'GET',
      }),
      providesTags: ['Profile', 'Wallet'],
    }),
    updateMpin: builder.mutation<
      { message: string; user: User },
      { mpin: string; mpin_confirmation: string; current_password?: string }
    >({
      query: (body) => ({
        url: '/profile/mpin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateMpinMutation } = profileApi;
