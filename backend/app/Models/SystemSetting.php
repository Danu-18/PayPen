<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;

    public const CREATED_AT = null;
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'key',
        'value',
        'description',
        'updated_at',
    ];

    /**
     * Get a setting value by key, with optional fallback default.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->find($key);
        return $setting ? $setting->value : $default;
    }
}
