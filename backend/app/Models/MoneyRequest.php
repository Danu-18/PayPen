<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoneyRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_user_id',
        'payer_user_id',
        'amount',
        'note',
        'status',
        'expires_at',
        'transaction_id',
        'responded_at',
    ];

    protected $appends = [
        'formatted_amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount / 100, 2, '.', ',');
    }

    public function requesterUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_user_id');
    }

    public function payerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_user_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
