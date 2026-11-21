<?php

namespace App\Exceptions;

class PaymentDeclinedException extends FintechException
{
    public function __construct(string $message = 'Payment card was declined.', string $errorCode = 'PAYMENT_DECLINED', int $statusCode = 422)
    {
        parent::__construct($message, $errorCode, $statusCode);
    }
}
