<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequestStore extends FormRequest
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
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'purchase_date' => 'required|date',
            'notes' => 'nullable|string',
            'paid_amount' => 'required|numeric|min:0',
            'shadow_paid_amount' => 'nullable|numeric|min:0', 
            'payment_status' => 'required|in:unpaid,partial,paid',
            'shadow_payment_status' => 'nullable|in:unpaid,partial,paid', 
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'required|exists:variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.shadow_unit_price' => 'nullable|numeric|min:0',
            'items.*.shadow_sale_price' => 'nullable|numeric|min:0',
            // For shadow users, real prices are optional
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.sale_price' => 'required|numeric|min:0',
            // Additional fields
            'items.*.product_name' => 'sometimes|string',
            'items.*.variant_name' => 'sometimes|string',
            'items.*.total_price' => 'sometimes|numeric',
            'items.*.shadow_total_price' => 'nullable|sometimes|numeric',
            'adjust_from_advance' => 'nullable|boolean', 
            'manual_payment_override' => 'nullable|boolean', 
            'use_partial_payment' => 'nullable|boolean', 
        ];
    }
}
