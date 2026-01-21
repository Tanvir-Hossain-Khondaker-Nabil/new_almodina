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
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            
            // Subscription owner (who purchased the subscription)
            $table->unsignedBigInteger('user_id')->nullable();

            // Outlet basic info
            $table->string('name');
            $table->string('code')->nullable()->unique(); // outlet code / branch code
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();

            // Business / POS related
            $table->string('currency', 10)->default('BDT');
            $table->string('timezone')->default('Asia/Dhaka');

            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_main')->default(false); // main/head outlet

            $table->string('created_by');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outlets');
    }
};
