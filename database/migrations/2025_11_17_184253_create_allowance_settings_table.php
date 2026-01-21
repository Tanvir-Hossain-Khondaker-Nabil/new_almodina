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
        Schema::create('allowance_settings', function (Blueprint $table) {
            $table->id();
            $table->string('allowance_type'); // house_rent, medical, transport, other
            $table->decimal('percentage', 5, 2)->default(0);
            $table->decimal('fixed_amount', 10, 2)->default(0);
            $table->boolean('is_percentage')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
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
        Schema::dropIfExists('alowance_sttings');
    }
};
