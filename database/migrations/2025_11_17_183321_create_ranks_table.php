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
        Schema::create('ranks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('level');
            $table->decimal('base_salary', 10, 2);
            $table->decimal('salary_increment_percentage', 5, 2)->default(0);
            $table->integer('min_working_days')->default(22);
            $table->integer('max_late_minutes')->default(30);
            $table->text('benefits')->nullable();
            $table->boolean('is_active')->default(true);
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
        Schema::dropIfExists('ranks');
    }
};
