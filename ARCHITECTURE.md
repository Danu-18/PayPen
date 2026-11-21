# PayPen Fintech Platform - Architectural Specification

## 1. System Overview
PayPen is an institutional-grade, closed-loop digital wallet and financial ledger platform built with Laravel 12 (backend) and Next.js 16 (frontend). It enforces strict double-entry bookkeeping, absolute immutability of financial records, zero floating-point balance arithmetic, 4-digit MPIN transaction authorization, signed email verification gates, and idempotency guarantees.

---

## 2. Technical Stack
- **Backend Framework**: Laravel 12 (PHP 8.2+)
- **Authentication**: Laravel Sanctum with Bearer Tokens
- **Database Engine**: MySQL 8.0+ / InnoDB (tested & compatible with SQLite for in-memory testing)
- **Frontend Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **State Management**: Redux Toolkit & RTK Query
- **Styling**: Tailwind CSS v4, Lucide Icons, Sonner Notifications

---

## 3. Mandatory Fintech & Database Constraints
1. **Precision & Integer Storage**:
   - All balances, fees, and transaction amounts are stored in **minor currency units** (`BIGINT` in database, integer in code).
   - `1 PKR = 100 minor units` (Paisa). Floating-point types are strictly forbidden for currency values.
2. **Double-Entry Bookkeeping**:
   - Every financial transaction generates matching `DEBIT` and `CREDIT` entries in `ledger_entries`.
   - The ledger is append-only (`created_at` timestamp only, NO `updated_at`).
   - `LedgerEntry` and `AuditLog` Eloquent models throw `LogicException('Financial ledger/audit records are immutable.')` upon any `updating` or `deleting` event.
3. **Automated Wallet Provisioning**:
   - Every user with `role === 'user'` receives a linked wallet created automatically via `UserObserver`.
   - Wallet codes follow the format `PP-XXXXXXXX` (e.g., `PP-8F3A91C2`).
   - Wallets are initialized with `0` balance and status `active`.
4. **Idempotency Protection**:
   - All mutating financial operations require an `Idempotency-Key` header stored in the `idempotency_keys` table.
5. **Signed Email Verification Gate**:
   - Unverified users receive HTTP `403` with code `EMAIL_UNVERIFIED` on wallet/profile routes.
   - Links log to `storage/logs/laravel.log` in local environments (`MAIL_MAILER=log`).
6. **4-Digit MPIN Authorization**:
   - Critical operations (P2P transfers, bill payments) require a 4-digit numeric MPIN hashed with bcrypt.
   - Updating an existing MPIN strictly requires verifying the user's current account password.

---

## 4. Complete Database Schema (Phase 1, 2, and 3)
1. **`users`**: User identities, roles (`user`, `admin`), email verification, bcrypt password, `mpin_hash`, `mpin_attempts`, `mpin_locked_until`, `is_active`.
2. **`wallets`**: Single primary wallet per user plus system wallets (`PP-SYS-CLEARING`, `PP-SYS-REVENUE`) and 4 biller wallets (`PP-BILL-KE`, `PP-BILL-SSGC`, `PP-BILL-PTCL`, `PP-BILL-JAZZ`).
3. **`transactions`**: UUID `reference_id`, `initiated_by_user_id`, `type` (`deposit`, `p2p_transfer`, `bill_payment`, `money_request`, `reversal`), `amount`, `fee`, `status`, `metadata`, `flagged_for_review`, `reversed_transaction_id`.
4. **`ledger_entries`**: Immutable, append-only entries linking `transaction_id`, `wallet_id`, `entry_type` (`DEBIT`, `CREDIT`), `amount`, and `balance_after`.
5. **`idempotency_keys`**: `user_id`, `idempotency_key`, `endpoint`, `request_hash`, `response_status`, `response_body`.
6. **`system_settings`**: Global platform controls (`fee_percentage`, `max_single_transfer_minor`, `daily_transfer_limit_minor`, `fraud_flag_threshold_minor`).
7. **`audit_logs`**: Immutable security and event trace log (`actor_user_id`, `action`, `old_values`, `new_values`, `ip_address`).
8. **`utility_bills`**: 8 seeded bills across 4 billers (`KE-1001`, `KE-1002`, `SSGC-2001`, `SSGC-2002`, `PTCL-3001`, `PTCL-3002`, `JAZZ-4001`, `JAZZ-4002`).
9. **`money_requests`**: Peer payment requests with requester, payer, amount, note, status, expiry, and linked transaction.
10. **`personal_access_tokens`**: Laravel Sanctum bearer token management.

---

## 5. Sprint Roadmap
- **Sprint 1 (Current)**: Sanctum authentication, UserObserver wallet provisioning, email verification gate, profile & wallet inspection, 4-digit MPIN setup/update, responsive Next.js frontend design system.
- **Sprint 2**: P2P transfers, bank deposit simulation, utility bill inquiry & payment execution, double-entry balance updates, and idempotency validation.
- **Sprint 3**: Money requests (accept/reject/cancel), administrative monitoring, fraud flagging, system fee collection, and transaction reversals.
