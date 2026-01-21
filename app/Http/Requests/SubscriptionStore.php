<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscriptionStore extends FormRequest
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
            'user_id'        => 'nullable|exists:users,id',
            'user_email'     => 'nullable|email|exists:users,email',
            'plan_id'        => 'required|exists:plans,id',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'payment_method'=> 'required|string',
            'transaction_id'=> 'required|string',
            'notes'          => 'nullable|string',
        ];

    }
}
