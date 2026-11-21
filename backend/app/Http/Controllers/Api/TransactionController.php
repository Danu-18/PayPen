<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    /**
     * Get paginated ledger transaction history with direction and counterparty.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $wallet = $user->wallet;

        $query = $this->buildFilteredQuery($request, $user, $wallet?->id);

        $transactions = $query->paginate(10);

        return response()->json([
            'transactions' => TransactionResource::collection($transactions),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Stream transactions as downloadable CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $wallet = $user->wallet;

        $query = $this->buildFilteredQuery($request, $user, $wallet?->id);

        $filename = 'paypen_transactions_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $user, $wallet) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header Row
            fputcsv($handle, [
                'Date',
                'Reference',
                'Type',
                'Counterparty',
                'Direction',
                'Amount (PKR)',
                'Fee (PKR)',
                'Status',
                'Balance After (PKR)',
            ]);

            $query->chunk(100, function ($transactions) use ($handle, $user, $wallet) {
                foreach ($transactions as $tx) {
                    $resource = (new TransactionResource($tx))->toArray(request());

                    fputcsv($handle, [
                        $tx->created_at?->format('Y-m-d H:i:s'),
                        $resource['reference_id'],
                        ucfirst(str_replace('_', ' ', $resource['type'])),
                        $resource['counterparty'],
                        ucfirst($resource['direction']),
                        $resource['formatted_amount'],
                        $resource['formatted_fee'],
                        ucfirst($resource['status']),
                        $resource['formatted_balance_after'] ?? 'N/A',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Build base query for user's relevant transactions with filters.
     */
    protected function buildFilteredQuery(Request $request, $user, ?int $walletId)
    {
        $query = Transaction::with(['initiatedByUser', 'ledgerEntries'])
            ->where(function ($q) use ($user, $walletId) {
                $q->where('initiated_by_user_id', $user->id);
                if ($walletId) {
                    $q->orWhereHas('ledgerEntries', function ($lq) use ($walletId) {
                        $lq->where('wallet_id', $walletId);
                    });
                }
            });

        // Filter: Start Date
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        // Filter: End Date
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Filter: Type
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter: Status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');
    }
}
