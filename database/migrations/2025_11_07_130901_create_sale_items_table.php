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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();

            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->unsignedBigInteger('stock_id')->nullable();

            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed');

            $table->decimal('shadow_unit_price', 10, 2)->default(0);
            $table->decimal('shadow_total_price', 10, 2)->default(0);


            $table->string('item_type')->default('real');
            $table->string('product_name')->nullable();
            $table->string('brand')->nullable();
            $table->string('variant_name')->nullable();
            $table->unsignedBigInteger('purchase_item_id')->nullable();

            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->foreignId('product_id')->nullable()->change();
            $table->foreignId('variant_id')->nullable()->change();

            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');

            $table->unsignedBigInteger('unit_id')->nullable();
            $table->decimal('sale_quantity', 15, 6)->default(1);
            $table->decimal('base_quantity', 15, 6)->default(1);

            $table->string('unit')->default('piece'); 

            $table->decimal('unit_quantity', 15, 6)->default(1);

            $table->decimal('unit_price', 15, 4)->default(0);
            $table->decimal('converted_unit_price', 15, 4)->default(0);

            $table->decimal('total_price', 15, 4)->default(0);

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
