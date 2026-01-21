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
        Schema::create('provident_funds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->onDelete('cascade');

            $table->integer('month');
            $table->integer('year');

            $table->decimal('employee_contribution', 10, 2)->default(0);
            $table->decimal('employer_contribution', 10, 2)->default(0);
            $table->decimal('total_contribution', 10, 2)->default(0);
            $table->decimal('current_balance', 10, 2)->default(0);

            $table->enum('status', ['active', 'withdrawn', 'matured'])->default('active');
            $table->date('contribution_date');
            $table->text('remarks')->nullable();

            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');

            $table->timestamps();

            $table->index(['employee_id', 'month', 'year']);
            $table->unique(['employee_id', 'month', 'year']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provident_funds');
    }
};
