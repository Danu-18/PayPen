<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

class Sprint1AuthWalletTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_registration_creates_user_and_hashes_password_and_returns_token(): void
    {
        $payload = [
            'name' => 'Alice Doe',
            'email' => 'alice@example.com',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role', 'has_mpin'],
                'wallet' => ['id', 'wallet_code', 'balance', 'currency'],
            ]);

        $user = User::where('email', 'alice@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('SecurePass123', $user->password));
        $this->assertNotEquals('SecurePass123', $user->password);
    }

    public function test_user_observer_automatically_creates_active_zero_balance_pkr_wallet(): void
    {
        $user = User::create([
            'name' => 'Bob Smith',
            'email' => 'bob@example.com',
            'password' => Hash::make('Secret123'),
            'role' => 'user',
        ]);

        $wallet = Wallet::where('user_id', $user->id)->first();
        $this->assertNotNull($wallet);
        $this->assertStringStartsWith('PP-', $wallet->wallet_code);
        $this->assertEquals(0, $wallet->balance);
        $this->assertEquals('PKR', $wallet->currency);
        $this->assertEquals('active', $wallet->status);
        $this->assertEquals('user', $wallet->type);
    }

    public function test_unverified_user_cannot_access_profile_wallet_endpoint_and_receives_403(): void
    {
        $user = User::create([
            'name' => 'Unverified User',
            'email' => 'unverified@example.com',
            'password' => Hash::make('Password123'),
            'role' => 'user',
            'email_verified_at' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/profile');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Please verify your email address to access your wallet.',
                'code' => 'EMAIL_UNVERIFIED',
            ]);
    }

    public function test_email_verification_unlocks_profile_endpoint(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'verify.me@example.com',
            'password' => Hash::make('Password123'),
            'role' => 'user',
            'email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $verifyResponse = $this->getJson($verificationUrl);
        $verifyResponse->assertStatus(200);

        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        $profileResponse = $this->actingAs($user->fresh(), 'sanctum')->getJson('/api/profile');
        $profileResponse->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'email', 'has_mpin'],
                'wallet' => ['id', 'wallet_code', 'balance', 'formatted_balance', 'currency'],
            ]);
    }

    public function test_user_can_set_and_update_mpin_with_password_verification(): void
    {
        $user = User::create([
            'name' => 'MPIN User',
            'email' => 'mpin@example.com',
            'password' => Hash::make('Password123'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        // Step 1: Initial MPIN setup (no current_password required)
        $setResponse = $this->actingAs($user, 'sanctum')->postJson('/api/profile/mpin', [
            'mpin' => '4321',
            'mpin_confirmation' => '4321',
        ]);

        $setResponse->assertStatus(200);
        $user->refresh();
        $this->assertTrue($user->has_mpin);
        $this->assertTrue(Hash::check('4321', $user->mpin_hash));

        // Step 2: Update MPIN requires current password
        $failResponse = $this->actingAs($user, 'sanctum')->postJson('/api/profile/mpin', [
            'mpin' => '9876',
            'mpin_confirmation' => '9876',
            'current_password' => 'WrongPassword',
        ]);
        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        // Step 3: Update MPIN with correct password succeeds
        $successResponse = $this->actingAs($user, 'sanctum')->postJson('/api/profile/mpin', [
            'mpin' => '9876',
            'mpin_confirmation' => '9876',
            'current_password' => 'Password123',
        ]);
        $successResponse->assertStatus(200);
        $user->refresh();
        $this->assertTrue(Hash::check('9876', $user->mpin_hash));
    }

    public function test_ledger_entry_is_immutable_and_throws_logic_exception_on_update_or_delete(): void
    {
        $user = User::create([
            'name' => 'Ledger User',
            'email' => 'ledger@example.com',
            'password' => Hash::make('Pass1234'),
            'role' => 'user',
        ]);

        $wallet = $user->wallet;

        $transaction = Transaction::create([
            'reference_id' => (string) Str::uuid(),
            'initiated_by_user_id' => $user->id,
            'type' => 'deposit',
            'amount' => 100000,
            'fee' => 0,
            'status' => 'completed',
        ]);

        $ledgerEntry = LedgerEntry::create([
            'transaction_id' => $transaction->id,
            'wallet_id' => $wallet->id,
            'entry_type' => 'CREDIT',
            'amount' => 100000,
            'balance_after' => 100000,
        ]);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Financial ledger/audit records are immutable.');
        $ledgerEntry->update(['amount' => 200000]);
    }

    public function test_ledger_entry_throws_logic_exception_on_delete(): void
    {
        $user = User::create([
            'name' => 'Ledger User 2',
            'email' => 'ledger2@example.com',
            'password' => Hash::make('Pass1234'),
            'role' => 'user',
        ]);

        $transaction = Transaction::create([
            'reference_id' => (string) Str::uuid(),
            'initiated_by_user_id' => $user->id,
            'type' => 'deposit',
            'amount' => 50000,
            'fee' => 0,
            'status' => 'completed',
        ]);

        $ledgerEntry = LedgerEntry::create([
            'transaction_id' => $transaction->id,
            'wallet_id' => $user->wallet->id,
            'entry_type' => 'CREDIT',
            'amount' => 50000,
            'balance_after' => 50000,
        ]);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Financial ledger/audit records are immutable.');
        $ledgerEntry->delete();
    }

    public function test_audit_log_is_immutable_and_throws_logic_exception_on_update_or_delete(): void
    {
        $log = AuditLog::create([
            'action' => 'security_event',
            'created_at' => now(),
        ]);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Financial ledger/audit records are immutable.');
        $log->update(['action' => 'tampered_event']);
    }
}
