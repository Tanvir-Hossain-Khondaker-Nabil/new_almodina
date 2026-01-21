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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->integer('quantity')->default(0);
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('sale_price', 10, 2)->default(0);
            $table->decimal('shadow_purchase_price', 10, 2)->default(0);
            $table->decimal('shadow_sale_price', 10, 2)->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('batch_no')->nullable();
            $table->string('barcode')->nullable();
            $table->string('barcode_path')->nullable();
            $table->timestamps();

            $table->unsignedBigInteger('outlet_id');
            $table->unsignedBigInteger('purchase_id')->nullable();

            $table->decimal('base_quantity', 12, 4)->default(0); // Base unit এ মোট পরিমাণ
            $table->decimal('available_base_quantity', 12, 4)->default(0); // Base unit এ অবশিষ্ট পরিমাণ

            $table->index(['warehouse_id', 'product_id', 'variant_id', 'batch_no']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
