<?php

namespace App\Exceptions;

class InvalidMpinException extends FintechException
{
    public function __construct(string $message = 'Incorrect 4-digit MPIN.', string $errorCode = 'INVALID_MPIN', int $statusCode = 422)
    {
        parent::__construct($message, $errorCode, $statusCode);
    }
}
