<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierStore extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'send_welcome_sms' => 'boolean',
            'dealership_id' => 'nullable|exists:diller_ships,id',

            'account_id' => [
                Rule::requiredIf(fn () => (float) $this->advance_amount > 0),
                'nullable',
                'exists:accounts,id',
            ],
        ];

    }
}
