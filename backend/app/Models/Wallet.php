<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'wallet_code',
        'name',
        'type',
        'status',
        'balance',
        'currency',
    ];

    protected $appends = [
        'formatted_balance',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'integer',
        ];
    }

    /**
     * Human-friendly formatted balance (minor units / 100).
     */
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->balance / 100, 2, '.', ',');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function utilityBills(): HasMany
    {
        return $this->hasMany(UtilityBill::class, 'biller_wallet_id');
    }
}
