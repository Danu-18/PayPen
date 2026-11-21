<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepositRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WalletResource;
use App\Services\DepositService;
use Illuminate\Http\JsonResponse;

class DepositController extends Controller
{
    /**
     * Process simulated bank card deposit into user digital wallet.
     */
    public function store(DepositRequest $request, DepositService $depositService): JsonResponse
    {
        $user = $request->user();
        $amountMinor = (int) $request->input('amount');
        $cardDetails = $request->only(['card_number', 'exp_month', 'exp_year', 'cvc']);

        $tx = $depositService->deposit($user, $amountMinor, $cardDetails);

        return response()->json([
            'message' => 'Deposit completed successfully.',
            'transaction' => new TransactionResource($tx),
            'wallet' => new WalletResource($user->wallet->fresh()),
        ], 201);
    }
}
