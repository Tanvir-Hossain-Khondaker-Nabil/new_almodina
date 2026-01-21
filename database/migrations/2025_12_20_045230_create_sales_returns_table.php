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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->decimal('refunded_amount', 15, 2)->default(0);
            $table->decimal('shadow_refunded_amount', 15, 2)->default(0);
            $table->enum('return_type', ['money_back', 'product_replacement', 'adjustment']);
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->date('return_date')->nullable();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('replacement_total', 15, 2)->default(0)->nullable();
            $table->decimal('shadow_replacement_total', 15, 2)->default(0)->nullable();
            $table->string('type')->default('sale_return'); // sale_return, damaged, replacement
            $table->integer('return_quantity')->default(0);
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};
