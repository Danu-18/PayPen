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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference_id')->unique();
            $table->foreignId('initiated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['deposit', 'p2p_transfer', 'bill_payment', 'money_request', 'reversal']);
            $table->unsignedBigInteger('amount'); // minor units
            $table->unsignedBigInteger('fee')->default(0); // minor units
            $table->enum('status', ['pending', 'completed', 'failed', 'reversed']);
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('flagged_for_review')->default(false);
            $table->string('flag_reason')->nullable();
            $table->foreignId('reversed_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['type', 'created_at']);
            $table->index('flagged_for_review');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
