<?php
// app/Http/Controllers/AwardController.php

namespace App\Http\Controllers;

use App\Models\Award;
use App\Models\EmployeeAward;
use App\Models\Employee;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use DB;

class AwardController extends Controller
{
    public function index()
    {
        $awards = Award::withCount('employeeAwards')->get();
        return Inertia::render('Awards/Index', ['awards' => $awards]);
    }

    public function show(Award $award)
    {
        $recipients = $award->employeeAwards()
            ->with('employee') // FIXED: Changed 'user' to 'employee'
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Awards/Show', [
            'award' => $award,
            'recipients' => $recipients
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'cash_reward' => 'required|numeric|min:0',
            'type' => 'required|in:monthly,quarterly,yearly,special',
            'month' => 'nullable|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'criteria' => 'nullable|array'
        ]);

        Award::create($request->all());

        return redirect()->back()->with('success', 'Award created successfully');
    }

    public function update(Request $request, Award $award)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'cash_reward' => 'required|numeric|min:0',
            'type' => 'required|in:monthly,quarterly,yearly,special',
            'month' => 'nullable|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'is_active' => 'boolean'
        ]);

        $award->update($request->all());

        return redirect()->back()->with('success', 'Award updated successfully');
    }

    public function destroy(Award $award)
    {
        $award->delete();
        return redirect()->back()->with('success', 'Award deleted successfully');
    }

    public function assignMonthlyAwards(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020'
        ]);

        $month = $request->month;
        $year = $request->year;

        // Get top performers based on attendance and punctuality
        $topPerformers = Attendance::with('employee') // FIXED: Changed 'user' to 'employee'
            ->select('employee_id', DB::raw('
                COUNT(*) as total_days,
                SUM(CASE WHEN status IN ("present", "late") THEN 1 ELSE 0 END) as present_days,
                SUM(late_hours) as total_late_hours,
                SUM(overtime_hours) as total_overtime
            '))
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->groupBy('employee_id')
            ->having('present_days', '>=', 20) // Minimum 20 days present
            ->orderBy('present_days', 'DESC')
            ->orderBy('total_overtime', 'DESC')
            ->orderBy('total_late_hours', 'ASC')
            ->limit(3)
            ->get();

        DB::beginTransaction();
        try {
            foreach ($topPerformers as $index => $performer) {
                $awardTitle = "Employee of the Month";
                $awardDescription = "Awarded for outstanding performance and attendance in " .
                    Carbon::createFromDate($year, $month, 1)->format('F Y');

                $award = Award::firstOrCreate([
                    'title' => $awardTitle,
                    'type' => 'monthly',
                    'month' => $month,
                    'year' => $year
                ], [
                    'description' => $awardDescription,
                    'cash_reward' => [5000, 3000, 1000][$index] ?? 1000, // Different rewards for 1st, 2nd, 3rd
                    'criteria' => ['attendance_percentage' => 90, 'min_working_days' => 20],
                    'is_active' => true
                ]);

                // Check if employee already received this award
                $existingAward = EmployeeAward::where('employee_id', $performer->employee_id)
                    ->where('award_id', $award->id)
                    ->first();

                if (!$existingAward) {
                    EmployeeAward::create([
                        'employee_id' => $performer->employee_id,
                        'award_id' => $award->id,
                        'award_date' => now(),
                        'achievement_reason' => "Ranked #" . ($index + 1) . " in monthly performance with {$performer->present_days} present days and {$performer->total_overtime} overtime hours",
                        'cash_amount' => $award->cash_reward,
                        'is_paid' => false
                    ]);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Monthly awards assigned successfully to ' . $topPerformers->count() . ' employees');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error assigning awards: ' . $e->getMessage());
        }
    }

    public function assignAwardToEmployee(Request $request)
    {
        $request->validate([
            'award_id' => 'required|exists:awards,id',
            'employee_id' => 'required|exists:employees,id', // FIXED: Changed 'users' to 'employees'
            'achievement_reason' => 'required|string',
            'cash_amount' => 'required|numeric|min:0'
        ]);

        $existingAward = EmployeeAward::where('employee_id', $request->employee_id)
            ->where('award_id', $request->award_id)
            ->first();

        if ($existingAward) {
            return redirect()->back()->with('error', 'This employee has already received this award.');
        }

        EmployeeAward::create([
            'employee_id' => $request->employee_id,
            'award_id' => $request->award_id,
            'award_date' => now(),
            'achievement_reason' => $request->achievement_reason,
            'cash_amount' => $request->cash_amount,
            'is_paid' => false
        ]);

        return redirect()->back()->with('success', 'Award assigned to employee successfully');
    }

    public function employeeAwards(Request $request)
    {
        logger()->info($request);
        $query = EmployeeAward::with(['employee', 'award']) // FIXED: Changed 'user' to 'employee'
            ->when($request->employee_id, function ($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            })
            ->when($request->award_id, function ($q) use ($request) {
                $q->where('award_id', $request->award_id);
            })
            ->when($request->is_paid, function ($q) use ($request) {
                $q->where('is_paid', $request->is_paid === 'paid');
            });

        $awards = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Awards/EmployeeAwards', [
            'employeeAwards' => $awards,
            'filters' => $request->only(['employee_id', 'award_id', 'is_paid']),
            'employees' => Employee::where('is_active', true)->get(['id', 'name', 'employee_id']), // FIXED: Changed 'users' to 'employees'
            'awardsList' => Award::all(['id', 'title', 'cash_reward'])
        ]);
    }

    public function markAsPaid(EmployeeAward $employeeAward)
    {
        $employeeAward->update([
            'is_paid' => true,
            'paid_date' => now()
        ]);

        return redirect()->back()->with('success', 'Award marked as paid');
    }

    public function markAsUnpaid(EmployeeAward $employeeAward)
    {
        $employeeAward->update([
            'is_paid' => false,
            'paid_date' => null
        ]);

        return redirect()->back()->with('success', 'Award marked as unpaid');
    }

    public function destroyEmployeeAward(EmployeeAward $employeeAward)
    {
        $employeeAward->delete();
        return redirect()->back()->with('success', 'Employee award record deleted');
    }

    public function awardStatistics()
    {
        $totalAwards = Award::count();
        $totalGivenAwards = EmployeeAward::count();
        $totalPaidAwards = EmployeeAward::where('is_paid', true)->count();
        $totalCashRewards = EmployeeAward::sum('cash_amount');
        $totalPaidCash = EmployeeAward::where('is_paid', true)->sum('cash_amount');

        $topRecipients = EmployeeAward::with('employee') // FIXED: Changed 'user' to 'employee'
            ->select('employee_id', DB::raw('COUNT(*) as award_count'), DB::raw('SUM(cash_amount) as total_cash'))
            ->groupBy('employee_id')
            ->orderBy('award_count', 'DESC')
            ->limit(5)
            ->get();

        return Inertia::render('Awards/Statistics', [
            'statistics' => [
                'totalAwards' => $totalAwards,
                'totalGivenAwards' => $totalGivenAwards,
                'totalPaidAwards' => $totalPaidAwards,
                'totalCashRewards' => $totalCashRewards,
                'totalPaidCash' => $totalPaidCash,
                'pendingCash' => $totalCashRewards - $totalPaidCash
            ],
            'topRecipients' => $topRecipients
        ]);
    }
}