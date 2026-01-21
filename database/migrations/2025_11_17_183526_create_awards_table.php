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
        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->decimal('cash_reward', 10, 2)->default(0);
            $table->enum('type', ['monthly', 'quarterly', 'yearly', 'special']);
            $table->integer('month')->nullable();
            $table->integer('year');
            $table->json('criteria')->nullable();
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
        Schema::dropIfExists('awards');
    }
};
