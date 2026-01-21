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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->float('price', 8, 2);
            $table->integer('plan_type')->nullable()->comment("1= FREE, 2=PAID");
            $table->integer('validity')->default(0);
            $table->text('description')->nullable();
            $table->json('features')->nullable(); 
            $table->enum('status', [1, 2]) // 1 = active // 2 = inactive
            ->default(1)
            ->comment('1=active, 2=inactive');
            $table->integer('total_sell')->nullable()->default(0);
            $table->integer('product_range')->nullable()->default(20);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
