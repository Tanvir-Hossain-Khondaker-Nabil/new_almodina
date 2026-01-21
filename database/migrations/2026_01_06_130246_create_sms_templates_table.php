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
        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->string('api_url');
            $table->string('sender_id');
            $table->boolean('is_active')->default(true);
            $table->string('balance')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('outlet_id');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['created_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_templates');
    }
};
