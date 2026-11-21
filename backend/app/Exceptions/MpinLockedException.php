<?php

namespace App\Exceptions;

class MpinLockedException extends FintechException
{
    public function __construct(string $message = 'Account MPIN is locked for 15 minutes due to multiple failed attempts.', string $errorCode = 'MPIN_LOCKED', int $statusCode = 422)
    {
        parent::__construct($message, $errorCode, $statusCode);
    }
}
