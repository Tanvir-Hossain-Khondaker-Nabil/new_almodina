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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('account_number')->nullable();
            $table->enum('type', ['cash', 'bank', 'mobile_banking'])->default('cash');
            $table->string('bank_name')->nullable();
            $table->string('mobile_provider')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->unsignedBigInteger('user_id');      // owner

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
