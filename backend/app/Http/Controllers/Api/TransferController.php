<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WalletResource;
use App\Services\TransferService;
use Illuminate\Http\JsonResponse;

class TransferController extends Controller
{
    /**
     * Process P2P transfer between registered PayPen users.
     */
    public function store(TransferRequest $request, TransferService $transferService): JsonResponse
    {
        $sender = $request->user();
        $recipientIdentifier = (string) ($request->input('recipient') ?: $request->input('recipient_email'));
        $amountMinor = (int) $request->input('amount');
        $mpin = (string) $request->input('mpin');
        $note = $request->input('note');

        $tx = $transferService->transfer(
            sender: $sender,
            recipientIdentifier: $recipientIdentifier,
            amountMinor: $amountMinor,
            mpin: $mpin,
            note: $note
        );

        return response()->json([
            'message' => 'P2P transfer completed successfully.',
            'transaction' => new TransactionResource($tx),
            'wallet' => new WalletResource($sender->wallet->fresh()),
        ], 201);
    }
}
