<?php

namespace App\Services\Gateways;

class GatewayResponse
{
    public function __construct(
        public readonly bool $successful,
        public readonly ?string $gatewayReference = null,
        public readonly ?string $errorCode = null,
        public readonly ?string $errorMessage = null,
        public readonly array $rawPayload = []
    ) {}

    public static function approve(string $reference, array $raw = []): self
    {
        return new self(
            successful: true,
            gatewayReference: $reference,
            rawPayload: $raw
        );
    }

    public static function decline(string $code, string $message, array $raw = []): self
    {
        return new self(
            successful: false,
            errorCode: $code,
            errorMessage: $message,
            rawPayload: $raw
        );
    }
}
