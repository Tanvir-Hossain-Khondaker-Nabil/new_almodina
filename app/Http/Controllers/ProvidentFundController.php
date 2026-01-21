<?php
// app/Http/Controllers/ProvidentFundController.php

namespace App\Http\Controllers;

use App\Models\ProvidentFund;
use App\Models\Employee;
use App\Models\Salary;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
use Carbon\Carbon;

class ProvidentFundController extends Controller
{
    public function index(Request $request)
    {
        $query = ProvidentFund::with(['employee' => function($query) {
            $query->select('id', 'name', 'employee_id');
        }])
            ->when($request->month, function($q) use ($request) {
                $q->where('month', $request->month);
            })
            ->when($request->year, function($q) use ($request) {
                $q->where('year', $request->year);
            })
            ->when($request->employee_id, function($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            });

        $providentFunds = $query->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(20);

        return Inertia::render('ProvidentFund/Index', [
            'providentFunds' => $providentFunds,
            'filters' => $request->only(['month', 'year', 'employee_id']),
            'employees' => Employee::where('is_active', true)
                ->get(['id', 'name', 'employee_id'])
                ->map(function($employee) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'employee_id' => $employee->employee_id,
                        'display' => "{$employee->name} ({$employee->employee_id})"
                    ];
                })
        ]);
    }

    // ✅ FIXED: Changed from 'user' to 'employee' in render
    public function employeeStatement(Employee $employee)
    {
        $statement = ProvidentFund::where('employee_id', $employee->id)
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $totalEmployeeContribution = $statement->sum('employee_contribution');
        $totalEmployerContribution = $statement->sum('employer_contribution');
        $currentBalance = $statement->last()->current_balance ?? 0;

        return Inertia::render('ProvidentFund/Statement', [
            'employee' => $employee, // FIXED: Changed 'user' to 'employee'
            'statement' => $statement,
            'totalEmployeeContribution' => $totalEmployeeContribution,
            'totalEmployerContribution' => $totalEmployerContribution,
            'currentBalance' => $currentBalance
        ]);
    }

    public function updatePfPercentage(Request $request, Employee $employee)
    {
        $request->validate([
            'provident_fund_percentage' => 'required|numeric|min:0|max:20'
        ]);

        $employee->update([
            'provident_fund_percentage' => $request->provident_fund_percentage
        ]);

        return redirect()->back()->with('success', 'PF percentage updated successfully');
    }

    public function overallSummary()
    {
        $summary = ProvidentFund::select(
            DB::raw('SUM(employee_contribution) as total_employee_contribution'),
            DB::raw('SUM(employer_contribution) as total_employer_contribution'),
            DB::raw('SUM(total_contribution) as total_contribution'),
            DB::raw('COUNT(DISTINCT employee_id) as total_employees')
        )->first();

        // Get latest balance for each employee
        $latestBalances = ProvidentFund::select('employee_id', 'current_balance')
            ->whereIn('id', function($query) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('provident_funds')
                    ->groupBy('employee_id');
            })
            ->get();

        $totalCurrentBalance = $latestBalances->sum('current_balance');

        return Inertia::render('ProvidentFund/Summary', [
            'summary' => $summary,
            'totalCurrentBalance' => $totalCurrentBalance
        ]);
    }

    // ✅ NEW: Create or update PF entry from salary
    public function createOrUpdateFromSalary($employeeId, $month, $year, $basicSalary, $pfPercentage)
    {
        // Calculate contributions
        $employeeContribution = ($basicSalary * $pfPercentage) / 100;
        $employerContribution = $employeeContribution; // Usually equal
        $totalContribution = $employeeContribution + $employerContribution;
        
        // Get previous balance
        $previousBalance = $this->getPreviousBalance($employeeId, $month, $year);
        
        // Calculate current balance
        $currentBalance = $previousBalance + $totalContribution;
        
        // Create or update PF entry
        $pfEntry = ProvidentFund::updateOrCreate(
            [
                'employee_id' => $employeeId,
                'month' => $month,
                'year' => $year
            ],
            [
                'employee_contribution' => $employeeContribution,
                'employer_contribution' => $employerContribution,
                'total_contribution' => $totalContribution,
                'current_balance' => $currentBalance,
                'status' => 'active',
                'contribution_date' => Carbon::create($year, $month, 1)->endOfMonth()
            ]
        );
        
        return $pfEntry;
    }
    
    // ✅ NEW: Get previous month's balance
    private function getPreviousBalance($employeeId, $currentMonth, $currentYear)
    {
        // Calculate previous month
        $date = Carbon::create($currentYear, $currentMonth, 1)->subMonth();
        $prevMonth = $date->month;
        $prevYear = $date->year;
        
        // Get previous month's record
        $previousRecord = ProvidentFund::where('employee_id', $employeeId)
            ->where('month', $prevMonth)
            ->where('year', $prevYear)
            ->first();
            
        return $previousRecord ? $previousRecord->current_balance : 0;
    }
    
    // ✅ NEW: Manual entry method
    public function storeManualEntry(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'employee_contribution' => 'required|numeric|min:0',
            'employer_contribution' => 'required|numeric|min:0',
            'remarks' => 'nullable|string'
        ]);
        
        // Get previous balance
        $previousBalance = $this->getPreviousBalance(
            $request->employee_id,
            $request->month,
            $request->year
        );
        
        $totalContribution = $request->employee_contribution + $request->employer_contribution;
        $currentBalance = $previousBalance + $totalContribution;
        
        $pfEntry = ProvidentFund::updateOrCreate(
            [
                'employee_id' => $request->employee_id,
                'month' => $request->month,
                'year' => $request->year
            ],
            [
                'employee_contribution' => $request->employee_contribution,
                'employer_contribution' => $request->employer_contribution,
                'total_contribution' => $totalContribution,
                'current_balance' => $currentBalance,
                'status' => 'active',
                'contribution_date' => Carbon::create($request->year, $request->month, 1)->endOfMonth(),
                'remarks' => $request->remarks
            ]
        );
        
        return redirect()->back()->with('success', 'PF entry added/updated successfully');
    }
}