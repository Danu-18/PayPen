<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_id',
        'initiated_by_user_id',
        'type',
        'amount',
        'fee',
        'status',
        'description',
        'metadata',
        'flagged_for_review',
        'flag_reason',
        'reversed_transaction_id',
    ];

    protected $appends = [
        'formatted_amount',
        'formatted_fee',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'fee' => 'integer',
            'metadata' => 'array',
            'flagged_for_review' => 'boolean',
        ];
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount / 100, 2, '.', ',');
    }

    public function getFormattedFeeAttribute(): string
    {
        return number_format($this->fee / 100, 2, '.', ',');
    }

    public function initiatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_user_id');
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function reversedTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'reversed_transaction_id');
    }

    public function reversalTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'reversed_transaction_id');
    }

    public function utilityBills(): HasMany
    {
        return $this->hasMany(UtilityBill::class);
    }

    public function moneyRequests(): HasMany
    {
        return $this->hasMany(MoneyRequest::class);
    }
}
