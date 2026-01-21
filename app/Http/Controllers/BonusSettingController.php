<?php
// app/Http/Controllers/BonusSettingController.php

namespace App\Http\Controllers;

use App\Models\BonusSetting;
use App\Models\Salary;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BonusSettingController extends Controller
{
    public function index()
    {
        $bonusSettings = BonusSetting::all();
        return Inertia::render('Bonus/Index', [
            'bonusSettings' => $bonusSettings
        ]);
    }

    public function create()
    {
        return Inertia::render('Bonus/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'bonus_name' => 'required|string|max:255',
            'bonus_type' => 'required|in:eid,festival,performance,other',
            'percentage' => 'required|numeric|min:0|max:100',
            'fixed_amount' => 'required|numeric|min:0',
            'is_percentage' => 'required|boolean',
            'description' => 'nullable|string',
            'effective_date' => 'required|date'
        ]);

        BonusSetting::create($request->all());

        return redirect()->route('bonus.index')->with('success', 'Bonus setting created successfully');
    }

    public function show(BonusSetting $bonus)
    {
        return Inertia::render('Bonus/Show', [
            'bonusSetting' => $bonus
        ]);
    }

    public function edit(BonusSetting $bonus)
    {
        return Inertia::render('Bonus/Edit', [
            'bonusSetting' => $bonus
        ]);
    }

    public function update(Request $request, BonusSetting $bonus)
    {
        $request->validate([
            'bonus_name' => 'required|string|max:255',
            'bonus_type' => 'required|in:eid,festival,performance,other',
            'percentage' => 'required|numeric|min:0|max:100',
            'fixed_amount' => 'required|numeric|min:0',
            'is_percentage' => 'required|boolean',
            'description' => 'nullable|string',
            'effective_date' => 'required|date'
        ]);

        $bonus->update($request->all());

        return redirect()->route('bonus.index')->with('success', 'Bonus setting updated successfully');
    }

    public function destroy(BonusSetting $bonus)
    {
        $bonus->delete();
        return redirect()->route('bonus.index')->with('success', 'Bonus setting deleted successfully');
    }

    // নির্দিষ্ট মাসের জন্য বোনাস অ্যাপ্লাই
    public function applyBonus(Request $request, BonusSetting $bonus)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:users,id'
        ]);

        // সব কর্মচারী বা নির্দিষ্ট কর্মচারী
        if ($request->employee_ids && count($request->employee_ids) > 0) {
            $employees = Employee::whereIn('id', $request->employee_ids)->where('is_active', true)->get();
        } else {
            $employees = Employee::where('is_active', true)->get();
        }

        $count = 0;
        foreach ($employees as $employee) {
            $this->applyBonusToEmployee($employee, $bonus, $request->month, $request->year);
            $count++;
        }

        return redirect()->back()->with('success', "Bonus applied to {$count} employees successfully");
    }

    // কর্মচারীকে বোনাস অ্যাপ্লাই
    private function applyBonusToEmployee(Employee $employee, BonusSetting $bonusSetting, $month, $year)
    {
        // বোনাস অ্যামাউন্ট ক্যালকুলেট
        $bonusAmount = $bonusSetting->calculateBonus($employee->basic_salary);

        // স্যালারি রেকর্ড খুঁজুন বা তৈরি করুন
        $salary = Salary::firstOrCreate([
            'employee_id' => $employee->id,
            'month' => $month,
            'year' => $year
        ], [
            'basic_salary' => $employee->basic_salary,
            'house_rent' => $employee->house_rent ?? 0,
            'medical_allowance' => $employee->medical_allowance ?? 0,
            'transport_allowance' => $employee->transport_allowance ?? 0,
            'other_allowance' => $employee->other_allowance ?? 0,
            'total_allowance' => ($employee->house_rent ?? 0) + ($employee->medical_allowance ?? 0) + ($employee->transport_allowance ?? 0) + ($employee->other_allowance ?? 0),
            'status' => 'pending'
        ]);

        // বোনাস টাইপ অনুযায়ী সেট করুন
        $this->addBonusToSalary($salary, $bonusSetting->bonus_type, $bonusAmount);
        
        // স্যালারি রিক্যালকুলেট করুন
        $salary->calculateNetSalary();
        $salary->save();
    }

    // বোনাস যোগ করার হেল্পার মেথড
    private function addBonusToSalary(Salary $salary, $type, $amount)
    {
        switch($type) {
            case 'eid':
                $salary->eid_bonus = $amount;
                break;
            case 'festival':
                $salary->festival_bonus = $amount;
                break;
            case 'performance':
                $salary->performance_bonus = $amount;
                break;
            case 'other':
                $salary->other_bonus = $amount;
                break;
        }
        
        // টোটাল বোনাস ক্যালকুলেট
        $salary->total_bonus = $salary->eid_bonus + 
                              $salary->festival_bonus + 
                              $salary->performance_bonus + 
                              $salary->other_bonus;
    }

    // ইদ বোনাস অ্যাপ্লাই (বিশেষ মেথড)
    public function applyEidBonus(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'percentage' => 'required|numeric|min:0|max:100',
            'employee_ids' => 'nullable|array'
        ]);

        // ইদ বোনাস সেটিং তৈরি বা আপডেট
        $eidBonus = BonusSetting::updateOrCreate(
            ['bonus_type' => 'eid'],
            [
                'bonus_name' => 'Eid Bonus',
                'percentage' => $request->percentage,
                'fixed_amount' => 0,
                'is_percentage' => true,
                'is_active' => true,
                'description' => 'Eid Festival Bonus',
                'effective_date' => now()
            ]
        );

        return $this->applyBonus(new Request([
            'month' => $request->month,
            'year' => $request->year,
            'employee_ids' => $request->employee_ids
        ]), $eidBonus);
    }

    // উৎসব বোনাস অ্যাপ্লাই
    public function applyFestivalBonus(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'bonus_name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
            'employee_ids' => 'nullable|array'
        ]);

        $festivalBonus = BonusSetting::create([
            'bonus_name' => $request->bonus_name,
            'bonus_type' => 'festival',
            'percentage' => $request->percentage,
            'fixed_amount' => 0,
            'is_percentage' => true,
            'is_active' => true,
            'description' => $request->bonus_name,
            'effective_date' => now()
        ]);

        return $this->applyBonus(new Request([
            'month' => $request->month,
            'year' => $request->year,
            'employee_ids' => $request->employee_ids
        ]), $festivalBonus);
    }

    // বোনাস অ্যাপ্লাই ফর্ম দেখান
    public function showApplyForm(BonusSetting $bonus)
    {
        $employees = Employee::where('is_active', true)->get(['id', 'name', 'employee_id', 'basic_salary']);
        
        return Inertia::render('Bonus/Apply', [
            'bonusSetting' => $bonus,
            'employees' => $employees
        ]);
    }
}