<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * Record an immutable audit log entry.
     */
    public static function record(
        string $action,
        ?int $actorUserId = null,
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ipAddress = null
    ): AuditLog {
        if ($ipAddress === null && request() instanceof Request) {
            $ipAddress = request()->ip();
        }

        return AuditLog::create([
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);
    }
}
