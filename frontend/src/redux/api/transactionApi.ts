import { baseApi } from './baseApi';
import {
  TransactionsResponse,
  TransactionsFilterParams,
  DepositPayload,
  TransferPayload,
  Transaction,
  Wallet,
} from '@/src/types';

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<TransactionsResponse, TransactionsFilterParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.start_date) queryParams.set('start_date', params.start_date);
        if (params?.end_date) queryParams.set('end_date', params.end_date);
        if (params?.type && params.type !== 'all') queryParams.set('type', params.type);
        if (params?.status && params.status !== 'all') queryParams.set('status', params.status);

        const qs = queryParams.toString();
        return {
          url: `/transactions${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Transactions'],
    }),

    deposit: builder.mutation<
      { message: string; transaction: Transaction; wallet: Wallet },
      { data: DepositPayload; idempotencyKey: string }
    >({
      query: ({ data, idempotencyKey }) => ({
        url: '/deposits',
        method: 'POST',
        body: data,
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }),
      invalidatesTags: ['Transactions', 'Wallet', 'Profile', 'Reconciliation'],
    }),

    transfer: builder.mutation<
      { message: string; transaction: Transaction; wallet: Wallet },
      { data: TransferPayload; idempotencyKey: string }
    >({
      query: ({ data, idempotencyKey }) => ({
        url: '/transfers',
        method: 'POST',
        body: data,
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }),
      invalidatesTags: ['Transactions', 'Wallet', 'Profile', 'Reconciliation'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useDepositMutation,
  useTransferMutation,
} = transactionApi;
