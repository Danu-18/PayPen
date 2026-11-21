import { baseApi } from './baseApi';
import { ReconciliationResponse } from '@/src/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReconciliation: builder.query<ReconciliationResponse, void>({
      query: () => ({
        url: '/admin/reconciliation',
        method: 'GET',
      }),
      providesTags: ['Reconciliation'],
    }),
  }),
});

export const { useGetReconciliationQuery, useLazyGetReconciliationQuery } = adminApi;
