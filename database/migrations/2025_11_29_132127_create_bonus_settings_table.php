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
        Schema::create('bonus_settings', function (Blueprint $table) {
            $table->id();

            $table->string('bonus_name');
            $table->enum('bonus_type', ['eid', 'festival', 'performance', 'other']); // Bonus category

            $table->decimal('percentage', 8, 2)->nullable();

            $table->decimal('fixed_amount', 12, 2)->nullable();

            $table->boolean('is_percentage')->default(false);

            $table->boolean('is_active')->default(true);

            $table->text('description')->nullable();

            $table->date('effective_date')->nullable();

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
        Schema::dropIfExists('bonus_settings');
    }
};
