<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AccountUpdate extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,bank,mobile_banking',
            'account_number' => 'nullable|string|max:100',
            'bank_name' => 'nullable|required_if:type,bank|string|max:255',
            'mobile_provider' => 'nullable|required_if:type,mobile_banking|string|max:100',
            'note' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
