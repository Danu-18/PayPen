export type UserRole = 'user' | 'admin';

export interface Wallet {
  id: number;
  wallet_code: string;
  name: string;
  type: 'user' | 'system_clearing' | 'system_revenue' | 'biller';
  status: 'active' | 'frozen';
  balance: number; // minor units
  formatted_balance: string;
  currency: string;
  created_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  is_email_verified: boolean;
  has_mpin: boolean;
  mpin_attempts: number;
  mpin_locked_until: string | null;
  is_active: boolean;
  wallet?: Wallet | null;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  wallet: Wallet | null;
}

export interface ProfileResponse {
  user: User;
  wallet: Wallet | null;
}

export type TransactionType = 'deposit' | 'p2p_transfer' | 'bill_payment' | 'money_request' | 'reversal';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
export type TransactionDirection = 'deposit' | 'sent' | 'received';

export interface Transaction {
  id: number;
  reference_id: string;
  type: TransactionType;
  direction: TransactionDirection;
  counterparty: string;
  amount: number; // minor units
  formatted_amount: string;
  fee: number; // minor units
  formatted_fee: string;
  status: TransactionStatus;
  description: string | null;
  metadata?: Record<string, any> | null;
  flagged_for_review: boolean;
  balance_after?: number | null;
  formatted_balance_after?: string | null;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationMeta;
}

export interface TransactionsFilterParams {
  start_date?: string;
  end_date?: string;
  type?: string;
  status?: string;
  page?: number;
}

export interface DepositPayload {
  amount: number; // minor units
  card_number: string;
  exp_month?: string;
  exp_year?: string;
  cvc?: string;
}

export interface TransferPayload {
  recipient_email: string;
  amount: number; // minor units
  mpin: string;
  note?: string;
}

export interface ReconciliationDiscrepancy {
  wallet_id: number;
  wallet_code: string;
  wallet_name: string;
  cached_balance: number;
  ledger_balance: number;
  drift: number;
}

export interface ReconciliationReport {
  is_balanced: boolean;
  global_drift: number;
  circulating_user_funds: number;
  formatted_circulating_user_funds: string;
  total_deposits: number;
  formatted_total_deposits: string;
  platform_fee_revenue: number;
  formatted_platform_fee_revenue: string;
  wallets_checked: number;
  discrepancies: ReconciliationDiscrepancy[];
  checked_at: string;
}

export interface ReconciliationResponse {
  status: 'balanced' | 'unbalanced';
  data: ReconciliationReport;
}

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}
