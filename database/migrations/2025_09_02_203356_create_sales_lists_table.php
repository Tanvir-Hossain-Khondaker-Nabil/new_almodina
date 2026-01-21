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
        Schema::create('sales_lists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');
            $table->string('sales_id')->nullable();
            $table->json('products');
            $table->decimal('grandtotal', 10, 2);
            $table->decimal('paytotal', 10, 2)->nullable();
            $table->decimal('nextdue', 10, 2)->nullable();
            $table->enum('status', ['normal', 'exhance'])->default('normal');
            $table->json('pay')->nullable();
            $table->json('exproducts')->nullable();
            $table->unsignedBigInteger('customer')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_lists');
    }
};
