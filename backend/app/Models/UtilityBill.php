<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilityBill extends Model
{
    use HasFactory;

    protected $fillable = [
        'biller_wallet_id',
        'biller_name',
        'category',
        'consumer_number',
        'billing_month',
        'amount',
        'due_date',
        'status',
        'paid_by_user_id',
        'transaction_id',
        'paid_at',
    ];

    protected $appends = [
        'formatted_amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount / 100, 2, '.', ',');
    }

    public function billerWallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'biller_wallet_id');
    }

    public function paidByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by_user_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
