<?php

namespace App\Services\Gateways;

use Illuminate\Support\Str;

class SandboxGatewayAdapter implements PaymentGatewayInterface
{
    /**
     * Charge simulated card in sandbox environment.
     */
    public function charge(int $amountMinor, array $paymentDetails): GatewayResponse
    {
        $rawCardNumber = $paymentDetails['card_number'] ?? '';
        $cardNumber = preg_replace('/\D/', '', (string) $rawCardNumber);

        if (strlen($cardNumber) !== 16) {
            return GatewayResponse::decline(
                code: 'INVALID_CARD_FORMAT',
                message: 'Card number must be exactly 16 numeric digits.'
            );
        }

        // 1. Success test card
        if ($cardNumber === '4242424242424242') {
            $ref = 'SBX-DEP-' . strtoupper(Str::random(12));
            return GatewayResponse::approve(
                reference: $ref,
                raw: [
                    'card_last4' => '4242',
                    'amount_minor' => $amountMinor,
                    'auth_code' => 'AUTH_' . rand(100000, 999999),
                    'network' => 'VISA',
                ]
            );
        }

        // 2. Insufficient card funds test card
        if ($cardNumber === '4000000000000002') {
            return GatewayResponse::decline(
                code: 'INSUFFICIENT_CARD_FUNDS',
                message: 'Payment card declined: Insufficient card funds.'
            );
        }

        // 3. Any other card -> Invalid test card
        return GatewayResponse::decline(
            code: 'INVALID_TEST_CARD',
            message: 'Payment card declined: Unrecognized test card number.'
        );
    }
}
