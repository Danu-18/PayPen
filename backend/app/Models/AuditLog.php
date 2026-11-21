<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuditLog extends Model
{
    use HasFactory;

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'actor_user_id',
        'action',
        'target_type',
        'target_id',
        'old_values',
        'new_values',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'target_id' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Boot guard: audit logs are strictly append-only and immutable.
     */
    protected static function booted(): void
    {
        static::updating(function ($model) {
            throw new LogicException('Financial ledger/audit records are immutable.');
        });

        static::deleting(function ($model) {
            throw new LogicException('Financial ledger/audit records are immutable.');
        });
    }

    public function actorUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
