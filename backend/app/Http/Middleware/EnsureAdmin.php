<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request to ensure user has administrative privileges.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Administrative privileges are required.',
                'code' => 'UNAUTHORIZED_ADMIN_ACCESS',
            ], 403);
        }

        return $next($request);
    }
}
