<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\UserObserver;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'role',
        'mpin_hash',
        'mpin_attempts',
        'mpin_locked_until',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'mpin_hash',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'has_mpin',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mpin_locked_until' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'mpin_attempts' => 'integer',
        ];
    }

    /**
     * Check if user has an MPIN set.
     */
    public function getHasMpinAttribute(): bool
    {
        return !empty($this->mpin_hash);
    }

    /**
     * User's single primary wallet.
     */
    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    /**
     * Transactions initiated by this user.
     */
    public function transactionsInitiated(): HasMany
    {
        return $this->hasMany(Transaction::class, 'initiated_by_user_id');
    }

    /**
     * Audit logs for actions taken by this user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    /**
     * Money requests created/sent by this user.
     */
    public function sentMoneyRequests(): HasMany
    {
        return $this->hasMany(MoneyRequest::class, 'requester_user_id');
    }

    /**
     * Money requests received where this user is the payer.
     */
    public function receivedMoneyRequests(): HasMany
    {
        return $this->hasMany(MoneyRequest::class, 'payer_user_id');
    }

    /**
     * Utility bills paid by this user.
     */
    public function paidUtilityBills(): HasMany
    {
        return $this->hasMany(UtilityBill::class, 'paid_by_user_id');
    }
}
