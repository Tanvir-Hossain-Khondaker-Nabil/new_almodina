<?php
// app/Http/Controllers/AllowanceController.php

namespace App\Http\Controllers;

use App\Models\AllowanceSetting;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class AllowanceController extends Controller
{
    public function index()
    {
        $allowanceSettings = AllowanceSetting::all();
        $employees = Employee::where('is_active', true)
            ->with(['rank'])
            ->get(['id', 'name', 'employee_id', 'basic_salary', 'house_rent', 'medical_allowance', 'transport_allowance', 'other_allowance']);
        
        return Inertia::render('Allowance/Index', [
            'allowanceSettings' => $allowanceSettings,
            'employees' => $employees
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'allowance_type' => 'required|string|max:255|in:house_rent,medical_allowance,transport_allowance,other_allowance',
            'percentage' => 'required_if:is_percentage,true|numeric|min:0|max:100|nullable',
            'fixed_amount' => 'required_if:is_percentage,false|numeric|min:0|nullable',
            'is_percentage' => 'required|boolean',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean'
        ]);

        // Create allowance setting
        $allowanceSetting = AllowanceSetting::create([
            'allowance_type' => $request->allowance_type,
            'percentage' => $request->is_percentage ? $request->percentage : 0,
            'fixed_amount' => !$request->is_percentage ? $request->fixed_amount : 0,
            'is_percentage' => $request->is_percentage,
            'is_active' => $request->is_active,
            'description' => $request->description
        ]);

        Log::info('Allowance setting created', [
            'id' => $allowanceSetting->id,
            'type' => $allowanceSetting->allowance_type,
            'is_percentage' => $allowanceSetting->is_percentage,
            'value' => $allowanceSetting->is_percentage ? $allowanceSetting->percentage . '%' : $allowanceSetting->fixed_amount
        ]);

        return redirect()->back()->with('success', 'Allowance setting created successfully');
    }

    public function update(Request $request, AllowanceSetting $allowanceSetting)
    {
        $request->validate([
            'percentage' => 'required_if:is_percentage,true|numeric|min:0|max:100|nullable',
            'fixed_amount' => 'required_if:is_percentage,false|numeric|min:0|nullable',
            'is_percentage' => 'required|boolean',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean'
        ]);

        $allowanceSetting->update([
            'percentage' => $request->is_percentage ? $request->percentage : 0,
            'fixed_amount' => !$request->is_percentage ? $request->fixed_amount : 0,
            'is_percentage' => $request->is_percentage,
            'is_active' => $request->is_active,
            'description' => $request->description
        ]);

        return redirect()->back()->with('success', 'Allowance setting updated successfully');
    }

    public function updateEmployeeAllowances(Request $request, Employee $employee)
    {
        $request->validate([
            'house_rent' => 'required|numeric|min:0',
            'medical_allowance' => 'required|numeric|min:0',
            'transport_allowance' => 'required|numeric|min:0',
            'other_allowance' => 'required|numeric|min:0'
        ]);

        $employee->update($request->only([
            'house_rent',
            'medical_allowance', 
            'transport_allowance',
            'other_allowance'
        ]));

        return redirect()->back()->with('success', 'Employee allowances updated successfully');
    }

    public function applyAllowanceSettings()
    {
        $employees = Employee::where('is_active', true)->get();
        $allowanceSettings = AllowanceSetting::where('is_active', true)->get();

        if ($allowanceSettings->isEmpty()) {
            return redirect()->back()->with('error', 'No active allowance settings found. Please create allowance settings first.');
        }

        $count = 0;
        $updatedEmployees = [];

        foreach ($employees as $employee) {
            $allowances = $this->calculateEmployeeAllowances($employee, $allowanceSettings);
            $employee->update($allowances);
            $count++;
            $updatedEmployees[] = $employee->name;
            
            Log::info('Allowances applied to employee', [
                'employee_id' => $employee->id,
                'name' => $employee->name,
                'basic_salary' => $employee->basic_salary,
                'allowances' => $allowances
            ]);
        }

        return redirect()->back()->with('success', "Allowance settings applied to {$count} employees successfully.");
    }

    private function calculateEmployeeAllowances(Employee $employee, $allowanceSettings)
    {
        $basicSalary = $employee->basic_salary ?? 0;
        $allowances = [
            'house_rent' => 0,
            'medical_allowance' => 0,
            'transport_allowance' => 0,
            'other_allowance' => 0
        ];

        foreach ($allowanceSettings as $setting) {
            $allowanceType = strtolower(trim($setting->allowance_type));
            
            // Direct mapping
            if (array_key_exists($allowanceType, $allowances)) {
                $allowances[$allowanceType] = $setting->calculateAllowance($basicSalary);
            } else {
                // Handle different naming conventions
                $mapping = [
                    'house_rent' => ['houserent', 'house rent'],
                    'medical_allowance' => ['medicalallowance', 'medical allowance'],
                    'transport_allowance' => ['transportallowance', 'transport allowance'],
                    'other_allowance' => ['otherallowance', 'other allowance']
                ];
                
                foreach ($mapping as $key => $possibleNames) {
                    if (in_array($allowanceType, $possibleNames)) {
                        $allowances[$key] = $setting->calculateAllowance($basicSalary);
                        break;
                    }
                }
            }
        }

        return $allowances;
    }
    
    // ✅ NEW: Set all employee allowances to 0
    public function resetEmployeeAllowances()
    {
        $employees = Employee::where('is_active', true)->get();
        $count = 0;
        
        foreach ($employees as $employee) {
            $employee->update([
                'house_rent' => 0,
                'medical_allowance' => 0,
                'transport_allowance' => 0,
                'other_allowance' => 0
            ]);
            $count++;
        }
        
        return redirect()->back()->with('success', "Reset allowances to 0 for {$count} employees.");
    }
}