<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyMiddleware
{
    /**
     * Handle an incoming financial request ensuring idempotency guarantees.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only enforce on mutating HTTP methods
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        $idempotencyKey = $request->header('Idempotency-Key');

        // 1. Enforce presence and UUID validity
        if (empty($idempotencyKey) || ! Str::isUuid($idempotencyKey)) {
            return response()->json([
                'message' => 'Idempotency-Key header is required and must be a valid RFC 4122 UUID.',
                'code' => 'INVALID_IDEMPOTENCY_KEY',
            ], 400);
        }

        $user = $request->user();
        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        $endpoint = $request->path();
        // Compute canonical deterministic SHA-256 hash of the request payload
        $payload = $request->all();
        ksort($payload);
        $requestHash = hash('sha256', (string) json_encode($payload));

        // 2. Check for existing idempotency key for this user
        /** @var IdempotencyKey|null $existingRecord */
        $existingRecord = IdempotencyKey::where('user_id', $user->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existingRecord) {
            // If request payload matches, return cached response immediately
            if ($existingRecord->request_hash === $requestHash) {
                return response()->json(
                    $existingRecord->response_body,
                    $existingRecord->response_status,
                    ['X-Idempotent-Replay' => 'true']
                );
            }

            // Key was already used with a different request payload -> 409 Conflict
            return response()->json([
                'message' => 'Idempotency key already used for a different request payload.',
                'code' => 'IDEMPOTENCY_CONFLICT',
            ], 409);
        }

        // 3. Execute downstream controller
        /** @var Response $response */
        $response = $next($request);

        // 4. Cache response for subsequent idempotent requests (if not a 5xx server error)
        if ($response->getStatusCode() < 500) {
            $responseBody = [];
            if ($response instanceof JsonResponse) {
                $responseBody = $response->getData(true);
            } else {
                $decoded = json_decode((string) $response->getContent(), true);
                $responseBody = is_array($decoded) ? $decoded : ['content' => $response->getContent()];
            }

            IdempotencyKey::create([
                'user_id' => $user->id,
                'idempotency_key' => $idempotencyKey,
                'endpoint' => $endpoint,
                'request_hash' => $requestHash,
                'response_status' => $response->getStatusCode(),
                'response_body' => $responseBody,
                'created_at' => now(),
            ]);
        }

        return $response;
    }
}
