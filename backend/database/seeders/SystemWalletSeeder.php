<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UtilityBill;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SystemWalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed System Admin
        User::updateOrCreate(
            ['email' => 'admin@paypen.test'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('Admin@1234'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'mpin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );

        // 2. Seed System Wallets
        $clearingWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-SYS-CLEARING'],
            [
                'name' => 'System Clearing Wallet',
                'type' => 'system_clearing',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        $revenueWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-SYS-REVENUE'],
            [
                'name' => 'System Revenue Wallet',
                'type' => 'system_revenue',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        // 3. Seed 4 Biller Wallets
        $keWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-BILL-KE'],
            [
                'name' => 'K-Electric',
                'type' => 'biller',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        $ssgcWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-BILL-SSGC'],
            [
                'name' => 'SSGC',
                'type' => 'biller',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        $ptclWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-BILL-PTCL'],
            [
                'name' => 'PTCL',
                'type' => 'biller',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        $jazzWallet = Wallet::updateOrCreate(
            ['wallet_code' => 'PP-BILL-JAZZ'],
            [
                'name' => 'Jazz Prepaid',
                'type' => 'biller',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]
        );

        // 4. Seed Default System Settings
        $settings = [
            [
                'key' => 'fee_percentage',
                'value' => '1.5',
                'description' => 'Standard transaction fee percentage applied to non-exempt transfers',
            ],
            [
                'key' => 'max_single_transfer_minor',
                'value' => '5000000',
                'description' => 'Maximum allowed single transfer amount in minor units (PKR 50,000.00)',
            ],
            [
                'key' => 'daily_transfer_limit_minor',
                'value' => '10000000',
                'description' => 'Maximum daily cumulative transfer limit in minor units (PKR 100,000.00)',
            ],
            [
                'key' => 'fraud_flag_threshold_minor',
                'value' => '2500000',
                'description' => 'Single transaction fraud inspection threshold in minor units (PKR 25,000.00)',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'description' => $setting['description'],
                    'updated_at' => now(),
                ]
            );
        }

        // 5. Seed 8 Realistic Unpaid Utility Bills
        $bills = [
            [
                'biller_wallet_id' => $keWallet->id,
                'biller_name' => 'K-Electric',
                'category' => 'electricity',
                'consumer_number' => 'KE-1001',
                'billing_month' => '2026-11',
                'amount' => 1250000, // PKR 12,500.00
                'due_date' => '2026-11-28',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $keWallet->id,
                'biller_name' => 'K-Electric',
                'category' => 'electricity',
                'consumer_number' => 'KE-1002',
                'billing_month' => '2026-11',
                'amount' => 845000, // PKR 8,450.00
                'due_date' => '2026-11-29',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $ssgcWallet->id,
                'biller_name' => 'SSGC',
                'category' => 'gas',
                'consumer_number' => 'SSGC-2001',
                'billing_month' => '2026-11',
                'amount' => 320000, // PKR 3,200.00
                'due_date' => '2026-11-25',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $ssgcWallet->id,
                'biller_name' => 'SSGC',
                'category' => 'gas',
                'consumer_number' => 'SSGC-2002',
                'billing_month' => '2026-11',
                'amount' => 495000, // PKR 4,950.00
                'due_date' => '2026-11-27',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $ptclWallet->id,
                'biller_name' => 'PTCL',
                'category' => 'internet',
                'consumer_number' => 'PTCL-3001',
                'billing_month' => '2026-11',
                'amount' => 550000, // PKR 5,500.00
                'due_date' => '2026-11-30',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $ptclWallet->id,
                'biller_name' => 'PTCL',
                'category' => 'internet',
                'consumer_number' => 'PTCL-3002',
                'billing_month' => '2026-11',
                'amount' => 380000, // PKR 3,800.00
                'due_date' => '2026-11-26',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $jazzWallet->id,
                'biller_name' => 'Jazz Prepaid',
                'category' => 'mobile_topup',
                'consumer_number' => 'JAZZ-4001',
                'billing_month' => '2026-11',
                'amount' => 100000, // PKR 1,000.00
                'due_date' => '2026-11-24',
                'status' => 'unpaid',
            ],
            [
                'biller_wallet_id' => $jazzWallet->id,
                'biller_name' => 'Jazz Prepaid',
                'category' => 'mobile_topup',
                'consumer_number' => 'JAZZ-4002',
                'billing_month' => '2026-11',
                'amount' => 200000, // PKR 2,000.00
                'due_date' => '2026-11-25',
                'status' => 'unpaid',
            ],
        ];

        foreach ($bills as $bill) {
            UtilityBill::updateOrCreate(
                [
                    'category' => $bill['category'],
                    'consumer_number' => $bill['consumer_number'],
                    'billing_month' => $bill['billing_month'],
                ],
                $bill
            );
        }
    }
}
