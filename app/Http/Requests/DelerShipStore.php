<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DelerShipStore extends FormRequest
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
            'company_id' => 'required|exists:companies,id',
            'name' => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'trade_license_no' => 'required|string|max:100',
            'tin_no' => 'required|string|max:100',
            'nid_no' => 'required|string|max:100',
            'advance_amount' => 'required|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|string|max:255',
            'contract_start' => 'nullable|date',
            'contract_end' => 'nullable|date|after_or_equal:contract_start',
            'status' => 'required|in:pending,approved,rejected,suspended',
            'remarks' => 'nullable|string',
            'total_sales' => 'nullable|numeric|min:0',
            'total_orders' => 'nullable|integer|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'last_order_date' => 'nullable|date',
            
            // 'agreement_doc' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            // 'bank_guarantee_doc' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            // 'trade_license_doc' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            // 'nid_doc' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            // 'tax_clearance_doc' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            // 'contract_file' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ];
    }
}
