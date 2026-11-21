<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class LedgerEntry extends Model
{
    use HasFactory;

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'transaction_id',
        'wallet_id',
        'entry_type',
        'amount',
        'balance_after',
        'created_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'balance_after' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Boot guard: ledger records are strictly append-only and immutable.
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

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
