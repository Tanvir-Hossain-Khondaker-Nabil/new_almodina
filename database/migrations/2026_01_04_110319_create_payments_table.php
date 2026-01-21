<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();

                $table->decimal('amount', 15, 2)->nullable();
                $table->decimal('shadow_amount', 15, 2)->nullable();
                $table->string('payment_method')->default('cash'); // e.g., cash, card, online
                $table->string('txn_ref')->nullable();
                $table->text('note')->nullable();
                $table->unsignedBigInteger('customer_id')->default(0)->nullable();
                $table->unsignedBigInteger('supplier_id')->default(0)->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->string('status')->default('completed'); // e.g., completed, pending, failed
                $table->unsignedBigInteger('sale_id')->default(0)->nullable();
                $table->unsignedBigInteger('created_by');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->unsignedBigInteger('outlet_id');
                $table->unsignedBigInteger('purchase_id')->default(0)->nullable();
                $table->unsignedBigInteger('account_id')->nullable();
                $table->unsignedBigInteger('salary_id')->default(0)->nullable();
                $table->unsignedBigInteger('expense_id')->default(0)->nullable();
                $table->unsignedBigInteger('product_id')->default(0)->nullable();

                $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
