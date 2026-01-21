<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AttributeController extends Controller
{
    // Index page with all attributes
    public function index()
    {
        return Inertia::render('Attributes/AttributeIndex', [
            'attributes' => Attribute::with(['values' => function($query) {
                $query->where('is_active', true);
            }])->latest()->get()
        ]);
    }

    // Store new attribute with values
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name',
            'code' => 'required|string|max:255|unique:attributes,code',
            'values' => 'required|array|min:1',
            'values.*.value' => 'required|string|max:255',
            'values.*.code' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Create attribute
            $attribute = Attribute::create([
                'name' => $request->name,
                'code' => $request->code,
                'created_by' => Auth::id(),
            ]);

            // Create attribute values
            foreach ($request->values as $valueData) {
                AttributeValue::create([
                    'attribute_id' => $attribute->id,
                    'value' => $valueData['value'],
                    'code' => $valueData['code'],
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Attribute created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create attribute: ' . $e->getMessage());
        }
    }

    // Update attribute and its values
    public function update(Request $request, Attribute $attribute)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name,' . $attribute->id,
            'code' => 'required|string|max:255|unique:attributes,code,' . $attribute->id,
            'values' => 'required|array|min:1',
            'values.*.value' => 'required|string|max:255',
            'values.*.code' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Update attribute
            $attribute->update([
                'name' => $request->name,
                'code' => $request->code,
            ]);

            // Update or create values
            $existingValueIds = [];
            foreach ($request->values as $valueData) {
                if (isset($valueData['id'])) {
                    // Update existing value
                    $value = AttributeValue::where('id', $valueData['id'])
                        ->where('attribute_id', $attribute->id)
                        ->first();
                    
                    if ($value) {
                        $value->update([
                            'value' => $valueData['value'],
                            'code' => $valueData['code'],
                        ]);
                        $existingValueIds[] = $value->id;
                    }
                } else {
                    // Create new value
                    $value = AttributeValue::create([
                        'attribute_id' => $attribute->id,
                        'value' => $valueData['value'],
                        'code' => $valueData['code'],
                    ]);
                    $existingValueIds[] = $value->id;
                }
            }

            // Soft delete removed values
            AttributeValue::where('attribute_id', $attribute->id)
                ->whereNotIn('id', $existingValueIds)
                ->update(['is_active' => false]);

            DB::commit();

            return redirect()->back()->with('success', 'Attribute updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update attribute: ' . $e->getMessage());
        }
    }

    // Store new value for existing attribute
    public function storeValue(Request $request, Attribute $attribute)
    {
        $request->validate([
            'value' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:attribute_values,code',
        ]);

        try {
            AttributeValue::create([
                'attribute_id' => $attribute->id,
                'value' => $request->value,
                'code' => $request->code,
            ]);

            return redirect()->back()->with('success', 'Value added successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to add value: ' . $e->getMessage());
        }
    }

    // Delete attribute
    public function destroy(Attribute $attribute)
    {
        DB::beginTransaction();
        try {
            // Soft delete all values first
            AttributeValue::where('attribute_id', $attribute->id)->update(['is_active' => false]);
            
            // Then delete attribute
            $attribute->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Attribute deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to delete attribute: ' . $e->getMessage());
        }
    }

    // Delete attribute value
    public function destroyValue(Attribute $attribute, AttributeValue $value)
    {
        try {
            // Ensure the value belongs to the attribute
            if ($value->attribute_id !== $attribute->id) {
                return redirect()->back()->with('error', 'Value not found for this attribute');
            }

            $value->update(['is_active' => false]);

            return redirect()->back()->with('success', 'Value deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete value: ' . $e->getMessage());
        }
    }
}