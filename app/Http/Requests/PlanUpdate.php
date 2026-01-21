<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlanUpdate extends FormRequest
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
            'price' => 'required|numeric|min:0',
            'plan_type' => 'required',
            'validity' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'product_range' => 'nullable|integer|min:0',
            'modules' => 'nullable|array|min:1',
            'modules.*' => 'exists:modules,id',
        ];
    }
}
