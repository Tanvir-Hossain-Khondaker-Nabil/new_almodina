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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_no')->unique();
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->date('purchase_date');
            $table->decimal('grand_total', 12, 2);
            $table->decimal('shadow_grand_total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('shadow_paid_amount', 12, 2)->default(0);
            $table->decimal('due_amount', 12, 2)->default(0);
            $table->decimal('shadow_due_amount', 12, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->enum('shadow_payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->enum('user_type', ['shadow', 'general'])->default('general');
            $table->enum('payment_type', ['cash', 'bank' ,'mobile_banking','advance_adjustment'])->default('cash');
            $table->timestamps();

            $table->unsignedBigInteger('outlet_id');
            
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');

            $table->boolean('is_pickup_sale_purchase')->default(false); 
            $table->unsignedBigInteger('pickup_sale_id')->nullable(); 
            $table->foreign('pickup_sale_id')->references('id')->on('sales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
