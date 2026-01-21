<?php
// app/Http/Controllers/EmployeeController.php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Rank;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = Employee::with('rank')
            ->when($request->search, function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%')
                    ->orWhere('employee_id', 'like', '%' . $request->search . '%');
            })
            ->when($request->rank_id, function ($query) use ($request) {
                $query->where('rank_id', $request->rank_id);
            })
            ->when($request->status !== null, function ($query) use ($request) {
                $query->where('is_active', $request->status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Employee/Index', [
            'employees' => $employees,
            'ranks' => Rank::where('is_active', true)->get(),
            'filters' => $request->only(['search', 'rank_id', 'status'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:employees,email', // FIXED: employees table
            'employee_id' => 'required|string|max:50|unique:employees,employee_id', // FIXED: employees table
            'rank_id' => 'required|exists:ranks,id',
            'joining_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'house_rent' => 'nullable|numeric|min:0',
            'medical_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'other_allowance' => 'nullable|numeric|min:0',
            'provident_fund_percentage' => 'required|numeric|min:0|max:20',
        ]);

        // Set default values for null fields
        $employeeData = array_merge($validated, [
            'current_salary' => $validated['basic_salary'],
            'house_rent' => $validated['house_rent'] ?? 0,
            'medical_allowance' => $validated['medical_allowance'] ?? 0,
            'transport_allowance' => $validated['transport_allowance'] ?? 0,
            'other_allowance' => $validated['other_allowance'] ?? 0,
        ]);

        $employee = Employee::create($employeeData);

        return redirect()->back()->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:employees,email,' . $employee->id, // FIXED: employees table
            'employee_id' => 'required|string|max:50|unique:employees,employee_id,' . $employee->id, // FIXED: employees table
            'rank_id' => 'required|exists:ranks,id',
            'joining_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'house_rent' => 'required|numeric|min:0',
            'medical_allowance' => 'required|numeric|min:0',
            'transport_allowance' => 'required|numeric|min:0',
            'other_allowance' => 'required|numeric|min:0',
            'provident_fund_percentage' => 'required|numeric|min:0|max:20',
            'is_active' => 'required|boolean',
        ]);

        $employee->update([
            'name' => $request->name,
            'email' => $request->email,
            'employee_id' => $request->employee_id,
            'rank_id' => $request->rank_id,
            'joining_date' => $request->joining_date,
            'basic_salary' => $request->basic_salary,
            'house_rent' => $request->house_rent,
            'medical_allowance' => $request->medical_allowance,
            'transport_allowance' => $request->transport_allowance,
            'other_allowance' => $request->other_allowance,
            'provident_fund_percentage' => $request->provident_fund_percentage,
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        // Check if employee has any records before deleting
        if ($employee->salaries()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete employee with salary records.');
        }

        if ($employee->attendances()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete employee with attendance records.');
        }

        if ($employee->providentFunds()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete employee with provident fund records.');
        }

        $employee->delete();

        return redirect()->back()->with('success', 'Employee deleted successfully.');
    }

    public function edit(Employee $employee)
    {
        return Inertia::render('Employee/Edit', [
            'employee' => $employee->load('rank'), // FIXED: Changed 'user' to 'employee'
            'ranks' => Rank::where('is_active', true)->get()
        ]);
    }

    public function updateSalary(Request $request, Employee $employee)
    {
        $request->validate([
            'current_salary' => 'required|numeric|min:0',
            'basic_salary' => 'required|numeric|min:0',
            'house_rent' => 'required|numeric|min:0',
            'medical_allowance' => 'required|numeric|min:0',
            'transport_allowance' => 'required|numeric|min:0',
            'other_allowance' => 'required|numeric|min:0',
        ]);

        $employee->update([
            'current_salary' => $request->current_salary,
            'basic_salary' => $request->basic_salary,
            'house_rent' => $request->house_rent,
            'medical_allowance' => $request->medical_allowance,
            'transport_allowance' => $request->transport_allowance,
            'other_allowance' => $request->other_allowance,
        ]);

        return redirect()->back()->with('success', 'Salary information updated successfully.');
    }

    public function promoteEmployee(Request $request, Employee $employee)
    {
        $request->validate([
            'new_rank_id' => 'required|exists:ranks,id'
        ]);

        $newRank = Rank::find($request->new_rank_id);

        $newSalary = $employee->current_salary +
            ($employee->current_salary * $newRank->salary_increment_percentage / 100);

        $employee->update([
            'rank_id' => $newRank->id,
            'current_salary' => $newSalary
        ]);

        return redirect()->back()->with('success', 'Employee promoted successfully.');
    }
}