<?php

namespace App\Exceptions;

class InsufficientFundsException extends FintechException
{
    public function __construct(string $message = 'Insufficient funds in wallet.', string $errorCode = 'INSUFFICIENT_FUNDS', int $statusCode = 422)
    {
        parent::__construct($message, $errorCode, $statusCode);
    }
}
