<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\AuditLog;
use App\Models\LedgerEntry;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Database\Seeders\SystemWalletSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class Sprint2LedgerEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $sender;
    protected User $recipient;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed system wallets, billers, and settings
        $this->seed(SystemWalletSeeder::class);

        $this->sender = User::create([
            'name' => 'Sender User',
            'email' => 'sender@paypen.test',
            'password' => Hash::make('Password123'),
            'role' => 'user',
            'email_verified_at' => now(),
            'mpin_hash' => Hash::make('1234'),
            'is_active' => true,
        ]);

        $this->recipient = User::create([
            'name' => 'Recipient User',
            'email' => 'recipient@paypen.test',
            'password' => Hash::make('Password123'),
            'role' => 'user',
            'email_verified_at' => now(),
            'mpin_hash' => Hash::make('4321'),
            'is_active' => true,
        ]);

        $this->admin = User::where('email', 'admin@paypen.test')->first();
    }

    public function test_deposit_happy_path_creates_double_entry_and_credits_wallet(): void
    {
        $idempotencyKey = Str::uuid()->toString();

        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/deposits', [
                'amount' => 10000, // 100.00 PKR
                'card_number' => '4242 4242 4242 4242',
                'exp_month' => '12',
                'exp_year' => '2028',
                'cvc' => '123',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Deposit completed successfully.',
                'transaction' => [
                    'amount' => 10000,
                    'fee' => 0,
                    'status' => 'completed',
                    'type' => 'deposit',
                ],
                'wallet' => [
                    'balance' => 10000,
                ],
            ]);

        // Verify database state
        $this->sender->wallet->refresh();
        $this->assertEquals(10000, $this->sender->wallet->balance);

        $clearingWallet = Wallet::where('wallet_code', 'PP-SYS-CLEARING')->first();
        $this->assertEquals(-10000, $clearingWallet->balance);

        // Verify double-entry ledger entries exist and balance
        $tx = Transaction::where('reference_id', $response->json('transaction.reference_id'))->first();
        $this->assertNotNull($tx);

        $entries = LedgerEntry::where('transaction_id', $tx->id)->get();
        $this->assertCount(2, $entries);

        $debit = $entries->firstWhere('entry_type', 'DEBIT');
        $credit = $entries->firstWhere('entry_type', 'CREDIT');

        $this->assertEquals($clearingWallet->id, $debit->wallet_id);
        $this->assertEquals(10000, $debit->amount);
        $this->assertEquals(-10000, $debit->balance_after);

        $this->assertEquals($this->sender->wallet->id, $credit->wallet_id);
        $this->assertEquals(10000, $credit->amount);
        $this->assertEquals(10000, $credit->balance_after);

        // Zero global drift
        $this->assertEquals(0, Wallet::sum('balance'));
    }

    public function test_deposit_declined_test_card_marks_failed_and_does_not_move_funds(): void
    {
        $idempotencyKey = Str::uuid()->toString();

        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/deposits', [
                'amount' => 5000,
                'card_number' => '4000 0000 0000 0002', // Declining test card
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'code' => 'INSUFFICIENT_CARD_FUNDS',
            ]);

        // Balances remain untouched
        $this->assertEquals(0, $this->sender->wallet->fresh()->balance);
        $this->assertEquals(0, Wallet::where('wallet_code', 'PP-SYS-CLEARING')->value('balance'));

        // Failed transaction record is tracked
        $failedTx = Transaction::where('initiated_by_user_id', $this->sender->id)
            ->where('status', 'failed')
            ->first();
        $this->assertNotNull($failedTx);
        $this->assertEquals('failed', $failedTx->status);
        $this->assertEquals(0, LedgerEntry::where('transaction_id', $failedTx->id)->count());
    }

    public function test_p2p_transfer_calculates_exact_integer_1_5_percent_fee_and_balances_globally(): void
    {
        // First deposit 10,000 PKR (1,000,000 minor) to sender
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 1000000,
                'card_number' => '4242424242424242',
            ]);

        $this->assertEquals(1000000, $this->sender->wallet->fresh()->balance);

        // Send 100 PKR (10,000 minor)
        // 1.5% fee on 10,000 is 150 minor units (1.50 PKR)
        // Total debit from sender: 10,150 minor units
        $transferKey = Str::uuid()->toString();

        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $transferKey])
            ->postJson('/api/transfers', [
                'recipient_email' => 'recipient@paypen.test',
                'amount' => 10000,
                'mpin' => '1234',
                'note' => 'Lunch reimbursement',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'P2P transfer completed successfully.',
                'transaction' => [
                    'amount' => 10000,
                    'fee' => 150,
                    'status' => 'completed',
                    'type' => 'p2p_transfer',
                ],
                'wallet' => [
                    'balance' => 989850, // 1,000,000 - 10,150
                ],
            ]);

        // Verify balances
        $this->assertEquals(989850, $this->sender->wallet->fresh()->balance);
        $this->assertEquals(10000, $this->recipient->wallet->fresh()->balance);

        $revenueWallet = Wallet::where('wallet_code', 'PP-SYS-REVENUE')->first();
        $this->assertEquals(150, $revenueWallet->balance);

        // Verify double-entry ledger entries for transfer
        $tx = Transaction::where('reference_id', $response->json('transaction.reference_id'))->first();
        $entries = LedgerEntry::where('transaction_id', $tx->id)->get();
        $this->assertCount(3, $entries);

        $totalDebits = $entries->where('entry_type', 'DEBIT')->sum('amount');
        $totalCredits = $entries->where('entry_type', 'CREDIT')->sum('amount');
        $this->assertEquals(10150, $totalDebits);
        $this->assertEquals(10150, $totalCredits);

        // Global sum across all wallets remains exactly zero
        $this->assertEquals(0, Wallet::sum('balance'));
    }

    public function test_transfer_insufficient_funds_returns_422_and_leaves_wallets_untouched(): void
    {
        // Sender has 0 balance, attempts to transfer 50 PKR
        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient_email' => 'recipient@paypen.test',
                'amount' => 5000,
                'mpin' => '1234',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'code' => 'INSUFFICIENT_FUNDS',
            ]);

        // Balances remain untouched
        $this->assertEquals(0, $this->sender->wallet->fresh()->balance);
        $this->assertEquals(0, $this->recipient->wallet->fresh()->balance);
        $this->assertEquals(0, Wallet::where('wallet_code', 'PP-SYS-REVENUE')->value('balance'));
    }

    public function test_duplicate_idempotency_key_returns_cached_response_without_duplicate_debits(): void
    {
        // Deposit funds first
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 500000,
                'card_number' => '4242424242424242',
            ]);

        $initialBalance = $this->sender->wallet->fresh()->balance;

        $idempotencyKey = Str::uuid()->toString();

        $payload = [
            'recipient_email' => 'recipient@paypen.test',
            'amount' => 20000,
            'mpin' => '1234',
            'note' => 'First attempt',
        ];

        // First attempt -> succeeds
        $res1 = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/transfers', $payload);

        $res1->assertStatus(201);
        $expectedBalanceAfter = $initialBalance - (20000 + 300); // 20000 + 1.5% (300)
        $this->assertEquals($expectedBalanceAfter, $this->sender->wallet->fresh()->balance);

        // Second attempt with exact same key and payload -> returns cached response
        $res2 = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/transfers', $payload);

        $res2->assertStatus(201);
        $this->assertEquals('true', $res2->headers->get('X-Idempotent-Replay'));
        $this->assertEquals($res1->json('transaction.reference_id'), $res2->json('transaction.reference_id'));

        // Balance was NOT debited a second time!
        $this->assertEquals($expectedBalanceAfter, $this->sender->wallet->fresh()->balance);
        $this->assertEquals(20000, $this->recipient->wallet->fresh()->balance);
    }

    public function test_duplicate_idempotency_key_with_different_payload_returns_409_conflict(): void
    {
        $idempotencyKey = Str::uuid()->toString();

        // Deposit
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/deposits', [
                'amount' => 10000,
                'card_number' => '4242424242424242',
            ])->assertStatus(201);

        // Try reusing same key with different amount
        $res = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->postJson('/api/deposits', [
                'amount' => 20000,
                'card_number' => '4242424242424242',
            ]);

        $res->assertStatus(409)
            ->assertJson([
                'code' => 'IDEMPOTENCY_CONFLICT',
            ]);
    }

    public function test_wrong_mpin_5_times_triggers_account_lockout(): void
    {
        // Deposit funds so balance is sufficient
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 100000,
                'card_number' => '4242424242424242',
            ]);

        for ($i = 1; $i <= 4; $i++) {
            $res = $this->actingAs($this->sender, 'sanctum')
                ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
                ->postJson('/api/transfers', [
                    'recipient_email' => 'recipient@paypen.test',
                    'amount' => 1000,
                    'mpin' => '9999', // wrong MPIN
                ]);

            $res->assertStatus(422)
                ->assertJson(['code' => 'INVALID_MPIN']);

            $this->sender->refresh();
            $this->assertEquals($i, $this->sender->mpin_attempts);
            $this->assertNull($this->sender->mpin_locked_until);
        }

        // 5th attempt triggers lockout
        $res5 = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient_email' => 'recipient@paypen.test',
                'amount' => 1000,
                'mpin' => '9999',
            ]);

        $res5->assertStatus(422)
            ->assertJson(['code' => 'MPIN_LOCKED']);

        $this->sender->refresh();
        $this->assertEquals(5, $this->sender->mpin_attempts);
        $this->assertNotNull($this->sender->mpin_locked_until);
        $this->assertTrue($this->sender->mpin_locked_until->isFuture());

        // Even with correct MPIN, locked account is rejected
        $resLocked = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient_email' => 'recipient@paypen.test',
                'amount' => 1000,
                'mpin' => '1234', // correct MPIN
            ]);

        $resLocked->assertStatus(422)
            ->assertJson(['code' => 'MPIN_LOCKED']);
    }

    public function test_transactions_index_and_csv_export_endpoint(): void
    {
        // Create 2 completed deposits and 1 transfer
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 100000,
                'card_number' => '4242424242424242',
            ]);

        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient_email' => 'recipient@paypen.test',
                'amount' => 20000,
                'mpin' => '1234',
            ]);

        // Query transactions
        $response = $this->actingAs($this->sender, 'sanctum')
            ->getJson('/api/transactions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'transactions' => [
                    '*' => [
                        'id',
                        'reference_id',
                        'type',
                        'direction',
                        'counterparty',
                        'amount',
                        'formatted_amount',
                        'fee',
                        'formatted_fee',
                        'status',
                        'balance_after',
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertEquals(2, $response->json('pagination.total'));

        // Test CSV export
        $csvResponse = $this->actingAs($this->sender, 'sanctum')
            ->get('/api/transactions/export');

        $csvResponse->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $csvResponse->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment;', (string) $csvResponse->headers->get('Content-Disposition'));
    }

    public function test_admin_reconciliation_endpoint_confirms_balanced_liquidity(): void
    {
        // Non-admin gets 403
        $this->actingAs($this->sender, 'sanctum')
            ->getJson('/api/admin/reconciliation')
            ->assertStatus(403);

        // Admin gets 200
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/reconciliation');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'balanced',
                'data' => [
                    'is_balanced' => true,
                    'global_drift' => 0,
                ],
            ]);
    }

    public function test_password_reset_flow_with_15_minute_expiry(): void
    {
        Mail::fake();

        // 1. Request forgot password
        $forgotRes = $this->postJson('/api/auth/forgot-password', [
            'email' => 'sender@paypen.test',
        ]);
        $forgotRes->assertStatus(200);

        Mail::assertSent(ResetPasswordMail::class, function ($mail) {
            return $mail->hasTo('sender@paypen.test') && str_contains($mail->resetUrl, 'token=');
        });

        $record = DB::table('password_reset_tokens')->where('email', 'sender@paypen.test')->first();
        $this->assertNotNull($record);

        // 2. Try invalid token -> 400
        $this->postJson('/api/auth/reset-password', [
            'email' => 'sender@paypen.test',
            'token' => 'invalid-token-123',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ])->assertStatus(400);

        // 3. Reset with valid token
        // Let's create an exact token
        $rawToken = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => 'sender@paypen.test'],
            ['token' => Hash::make($rawToken), 'created_at' => now()]
        );

        $resetRes = $this->postJson('/api/auth/reset-password', [
            'email' => 'sender@paypen.test',
            'token' => $rawToken,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);
        $resetRes->assertStatus(200);

        // Password updated
        $this->sender->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $this->sender->password));

        // Token consumed
        $this->assertNull(DB::table('password_reset_tokens')->where('email', 'sender@paypen.test')->first());
    }

    public function test_p2p_transfer_using_wallet_code_succeeds_and_balances_correctly(): void
    {
        // Deposit 5,000 PKR to sender
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 500000,
                'card_number' => '4242424242424242',
            ]);

        $recipientWalletCode = $this->recipient->wallet->wallet_code;

        // Send 100 PKR using recipient's Wallet ID
        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient' => $recipientWalletCode,
                'amount' => 10000,
                'mpin' => '1234',
                'note' => 'Transfer via Wallet ID',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'P2P transfer completed successfully.',
                'transaction' => [
                    'amount' => 10000,
                    'fee' => 150,
                    'status' => 'completed',
                ],
            ]);

        $this->assertEquals(10000, $this->recipient->wallet->fresh()->balance);
        $this->assertEquals(0, Wallet::sum('balance'));
    }

    public function test_p2p_transfer_using_bare_wallet_code_without_prefix_succeeds(): void
    {
        // Deposit 5,000 PKR to sender
        $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/deposits', [
                'amount' => 500000,
                'card_number' => '4242424242424242',
            ]);

        // Strip 'PP-' prefix and test case-insensitivity
        $bareCode = strtolower(str_replace('PP-', '', $this->recipient->wallet->wallet_code));

        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient' => $bareCode,
                'amount' => 5000,
                'mpin' => '1234',
            ]);

        $response->assertStatus(201);
        $this->assertEquals(5000, $this->recipient->wallet->fresh()->balance);
    }

    public function test_transfer_to_own_wallet_code_is_prohibited(): void
    {
        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient' => $this->sender->wallet->wallet_code,
                'amount' => 1000,
                'mpin' => '1234',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['recipient']);
    }

    public function test_transfer_to_invalid_wallet_code_returns_422(): void
    {
        $response = $this->actingAs($this->sender, 'sanctum')
            ->withHeaders(['Idempotency-Key' => Str::uuid()->toString()])
            ->postJson('/api/transfers', [
                'recipient' => 'PP-NONEXISTENT',
                'amount' => 1000,
                'mpin' => '1234',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['recipient']);
    }
}
