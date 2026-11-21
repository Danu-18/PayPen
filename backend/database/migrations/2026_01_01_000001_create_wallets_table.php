<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('wallet_code')->unique();
            $table->string('name');
            $table->enum('type', ['user', 'system_clearing', 'system_revenue', 'biller']);
            $table->enum('status', ['active', 'frozen'])->default('active');
            $table->bigInteger('balance')->default(0); // minor units, NEVER float
            $table->char('currency', 3)->default('PKR');
            $table->timestamps();

            $table->index(['type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
