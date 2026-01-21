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
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_no')->unique();
            $table->unsignedBigInteger('purchase_id');
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->date('return_date');
            $table->enum('return_type', ['money_back', 'product_replacement']);
            $table->decimal('total_return_amount', 12, 2)->default(0);
            $table->decimal('refunded_amount', 12, 2)->default(0);
            $table->decimal('shadow_return_amount', 12, 2)->default(0);
            $table->decimal('shadow_refunded_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'completed', 'cancelled'])->default('pending');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->enum('user_type', ['shadow', 'general'])->default('general');
            $table->enum('payment_type', ['cash', 'card', 'mobile_banking', 'adjust_to_advance'])->nullable();
            $table->timestamps();

            $table->unsignedBigInteger('outlet_id');
            
            $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('restrict');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('restrict');
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');

            $table->decimal('replacement_total', 15, 2)->default(0);
            $table->decimal('shadow_replacement_total', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
