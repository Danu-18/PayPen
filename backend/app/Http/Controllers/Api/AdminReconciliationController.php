<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReconciliationService;
use Illuminate\Http\JsonResponse;

class AdminReconciliationController extends Controller
{
    /**
     * Run double-entry balance and ledger integrity check.
     */
    public function index(ReconciliationService $reconciliationService): JsonResponse
    {
        $report = $reconciliationService->audit();

        return response()->json([
            'status' => $report['is_balanced'] ? 'balanced' : 'unbalanced',
            'data' => $report,
        ]);
    }
}
