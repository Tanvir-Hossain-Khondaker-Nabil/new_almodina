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
        Schema::create('salaries', function (Blueprint $table) {
    $table->id();
    
    // Employee reference - এটা মোস্ট ইম্পরট্যান্ট
    $table->unsignedBigInteger('employee_id');
    $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
    
    $table->integer('month');
    $table->integer('year');

    // Basic salary + allowances
    $table->decimal('basic_salary', 10, 2);
    $table->decimal('house_rent', 10, 2)->default(0);
    $table->decimal('medical_allowance', 10, 2)->default(0);
    $table->decimal('transport_allowance', 10, 2)->default(0);
    $table->decimal('other_allowance', 10, 2)->default(0);
    $table->decimal('total_allowance', 10, 2)->default(0);

    // Bonus fields
    $table->decimal('eid_bonus', 10, 2)->default(0);
    $table->decimal('festival_bonus', 10, 2)->default(0);
    $table->decimal('performance_bonus', 10, 2)->default(0);
    $table->decimal('other_bonus', 10, 2)->default(0);
    $table->decimal('total_bonus', 10, 2)->default(0);

    // Others
    $table->decimal('commission', 10, 2)->default(0);
    $table->decimal('overtime_amount', 10, 2)->default(0);

    // Deductions
    $table->decimal('late_deduction', 10, 2)->default(0);
    $table->decimal('absent_deduction', 10, 2)->default(0);
    $table->decimal('tax_deduction', 10, 2)->default(0);
    $table->decimal('provident_fund', 10, 2)->default(0);
    $table->decimal('other_deductions', 10, 2)->default(0);

    $table->decimal('total_deductions', 10, 2)->default(0);

    // Final salary amounts
    $table->decimal('gross_salary', 12, 2)->default(0);
    $table->decimal('net_salary', 12, 2)->default(0);

    // Attendance summary
    $table->integer('present_days')->nullable();
    $table->integer('absent_days')->nullable();
    $table->integer('leave_days')->nullable();
    $table->decimal('late_hours', 8, 2)->default(0);
    $table->decimal('overtime_hours', 8, 2)->default(0);
    $table->integer('working_days')->nullable();

    $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');

    $table->date('payment_date')->nullable();

    $table->text('notes')->nullable();

    $table->unsignedBigInteger('created_by');
    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
    $table->unsignedBigInteger('outlet_id');

    $table->timestamps();

    $table->unique(['employee_id', 'month', 'year']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};
