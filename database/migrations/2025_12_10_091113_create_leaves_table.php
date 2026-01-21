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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();

            // Employee reference
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');

            // Leave details
            $table->enum('type', ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid']);
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_days', 5, 2);
            $table->text('reason');

            // Status
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');

            // Approval info
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Half day
            $table->boolean('is_half_day')->default(false);
            $table->enum('half_day_type', ['first_half', 'second_half'])->nullable();

            // Attachment
            $table->string('attachment')->nullable();

            // Notes
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');

            // Timestamps
            $table->timestamps();

            // Indexes
            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index('type');

            // Foreign keys
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
