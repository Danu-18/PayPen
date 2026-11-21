<?php

namespace App\Services\Gateways;

interface PaymentGatewayInterface
{
    /**
     * Charge a payment method for the specified amount in minor currency units.
     */
    public function charge(int $amountMinor, array $paymentDetails): GatewayResponse;
}
