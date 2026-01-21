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
        Schema::create('employee_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('award_id')->constrained()->onDelete('cascade');
            $table->date('award_date');
            $table->text('achievement_reason');
            $table->decimal('cash_amount', 10, 2)->default(0);
            $table->boolean('is_paid')->default(false);
            $table->date('paid_date')->nullable();
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
        Schema::dropIfExists('employee_awards');
    }
};
