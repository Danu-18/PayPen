<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FintechException extends Exception
{
    protected string $errorCode;
    protected int $statusCode;

    public function __construct(string $message, string $errorCode = 'FINTECH_ERROR', int $statusCode = 422)
    {
        parent::__construct($message, $statusCode);
        $this->errorCode = $errorCode;
        $this->statusCode = $statusCode;
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => $this->errorCode,
        ], $this->statusCode);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}
