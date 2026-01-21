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
        Schema::create('diller_ships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('owner_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('trade_license_no')->nullable();
            $table->string('tin_no')->nullable();
            $table->string('nid_no')->nullable();

            $table->decimal('advance_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2)->default(0);
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->string('payment_terms')->nullable();

            $table->date('contract_start')->nullable();
            $table->date('contract_end')->nullable();
            $table->string('contract_file')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('remarks')->nullable();

            $table->decimal('total_sales', 15, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->date('last_order_date')->nullable();

            $table->string('agreement_doc')->nullable();
            $table->string('bank_guarantee_doc')->nullable();
            $table->string('trade_license_doc')->nullable();
            $table->string('nid_doc')->nullable();
            $table->string('tax_clearance_doc')->nullable();

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
        Schema::dropIfExists('diller_ships');
    }
};
