<?php

namespace App\Exceptions;

class WalletFrozenException extends FintechException
{
    public function __construct(string $message = 'Wallet is currently frozen.', string $errorCode = 'WALLET_FROZEN', int $statusCode = 422)
    {
        parent::__construct($message, $errorCode, $statusCode);
    }
}
