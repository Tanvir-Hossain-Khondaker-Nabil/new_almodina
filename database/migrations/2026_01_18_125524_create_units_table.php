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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., Kilogram, Gram, Ton, Milligram
            $table->string('short_name'); // kg, g, t, mg
            $table->string('type')->default('weight'); // weight, volume, piece, length
            $table->foreignId('base_unit_id')->nullable()->constrained('units')->onDelete('cascade');
            $table->decimal('conversion_factor', 16, 6)->default(1); // e.g., 1 kg = 1000 g
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('outlet_id')->nullable()->constrained('outlets');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
