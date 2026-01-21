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
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_return_id');
            $table->unsignedBigInteger('purchase_item_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id');
            $table->integer('return_quantity')->default(0);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('shadow_unit_price', 10, 2)->default(0);
            $table->decimal('sale_price', 10, 2)->default(0);
            $table->decimal('shadow_sale_price', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->decimal('shadow_total_price', 10, 2)->default(0);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');
            
            $table->foreign('purchase_return_id')->references('id')->on('purchase_returns')->onDelete('cascade');
            $table->foreign('purchase_item_id')->references('id')->on('purchase_items')->onDelete('restrict');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            $table->foreign('variant_id')->references('id')->on('variants')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
    }
};
