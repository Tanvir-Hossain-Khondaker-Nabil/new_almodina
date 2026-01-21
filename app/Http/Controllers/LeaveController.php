<?php
// app/Http/Controllers/LeaveController.php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Employee;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = Leave::with(['employee', 'approver', 'rejector'])
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->type, function ($q) use ($request) {
                $q->where('type', $request->type);
            })
            ->when($request->employee_id, function ($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            })
            ->when($request->start_date, function ($q) use ($request) {
                $q->whereDate('start_date', '>=', $request->start_date);
            })
            ->when($request->end_date, function ($q) use ($request) {
                $q->whereDate('end_date', '<=', $request->end_date);
            });


        $leaves = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Leave/Index', [
            'leaves' => $leaves,
            'filters' => $request->only(['status', 'type', 'employee_id', 'start_date', 'end_date']),
            'employees' => Employee::where('is_active', true)
                ->get(['id', 'name', 'employee_id'])
                ->map(function ($emp) {
                    return [
                        'id' => $emp->id,
                        'name' => $emp->name,
                        'employee_id' => $emp->employee_id,
                        'display' => "{$emp->name} ({$emp->employee_id})"
                    ];
                }),
            'leave_types' => [
                ['value' => 'sick', 'label' => 'Sick Leave'],
                ['value' => 'casual', 'label' => 'Casual Leave'],
                ['value' => 'earned', 'label' => 'Earned Leave'],
                ['value' => 'maternity', 'label' => 'Maternity Leave'],
                ['value' => 'paternity', 'label' => 'Paternity Leave'],
                ['value' => 'unpaid', 'label' => 'Unpaid Leave']
            ],
            'statuses' => [
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'approved', 'label' => 'Approved'],
                ['value' => 'rejected', 'label' => 'Rejected'],
                ['value' => 'cancelled', 'label' => 'Cancelled']
            ]
        ]);
    }

    public function create()
    {
        $employee = Auth::user()->employee;

        if (!$employee) {
            return redirect()->back()->with('error', 'Employee profile not found');
        }

        $leave_balance = [
            'sick' => $employee->sick_leave_balance ?? 14,
            'casual' => $employee->casual_leave_balance ?? 10,
            'earned' => $employee->earned_leave_balance ?? 0,
            'maternity' => $employee->maternity_leave_balance ?? 120,
            'paternity' => $employee->paternity_leave_balance ?? 15
        ];

        return Inertia::render('Leave/Create', [
            'leave_balance' => $leave_balance,
            'leave_types' => [
                ['value' => 'sick', 'label' => 'Sick Leave'],
                ['value' => 'casual', 'label' => 'Casual Leave'],
                ['value' => 'earned', 'label' => 'Earned Leave'],
                ['value' => 'maternity', 'label' => 'Maternity Leave (Female only)'],
                ['value' => 'paternity', 'label' => 'Paternity Leave (Male only)'],
                ['value' => 'unpaid', 'label' => 'Unpaid Leave']
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sick,casual,earned,maternity,paternity,unpaid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|min:10|max:500',
            'is_half_day' => 'boolean',
            'half_day_type' => 'required_if:is_half_day,true|in:first_half,second_half',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048'
        ]);

        DB::beginTransaction();
        try {
            $employee = Auth::user()->employee;

            if (!$employee) {
                throw new \Exception('Employee profile not found');
            }

            // Check leave balance for paid leaves
            if (in_array($request->type, ['sick', 'casual', 'earned', 'maternity', 'paternity'])) {
                $balance_field = $request->type . '_leave_balance';
                $available_balance = $employee->$balance_field ?? 0;

                if ($available_balance <= 0) {
                    throw new \Exception("Insufficient {$request->type} leave balance");
                }
            }

            // Calculate total days excluding Fridays
            $startDate = Carbon::parse($request->start_date);
            $endDate = Carbon::parse($request->end_date);

            $totalDays = $this->calculateWorkingDays($startDate, $endDate, $request->is_half_day);

            // Check if total days exceed balance for paid leaves
            if (in_array($request->type, ['sick', 'casual', 'earned', 'maternity', 'paternity'])) {
                if ($totalDays > $available_balance) {
                    throw new \Exception("Requested {$totalDays} days but only {$available_balance} days available");
                }
            }

            // Check for overlapping leaves
            $overlappingLeave = Leave::where('employee_id', $employee->id)
                ->where('status', '!=', 'rejected')
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                        });
                })
                ->first();

            if ($overlappingLeave) {
                throw new \Exception('You already have a leave application for this period');
            }

            // Handle attachment upload
            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('leave-attachments', 'public');
            }

            // Create leave
            $leave = Leave::create([
                'employee_id' => $employee->id,
                'type' => $request->type,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_days' => $totalDays,
                'reason' => $request->reason,
                'is_half_day' => $request->is_half_day ?? false,
                'half_day_type' => $request->half_day_type,
                'attachment' => $attachmentPath,
                'status' => 'pending'
            ]);

            DB::commit();

            return redirect()->route('leave.index')
                ->with('success', 'Leave application submitted successfully. It will be reviewed by HR.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    public function show(Leave $leave)
    {

        $leave->load(['employee', 'approver', 'rejector']);

        return Inertia::render('Leave/Show', [
            'leave' => $leave,
            'employee' => $leave->employee
        ]);
    }

    public function approve(Request $request, Leave $leave)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        if ($leave->status != 'pending') {
            return redirect()->back()->with('error', 'Leave is not pending for approval');
        }

        DB::beginTransaction();
        try {
            // Deduct from leave balance for paid leaves
            if (in_array($leave->type, ['sick', 'casual', 'earned', 'maternity', 'paternity'])) {
                $employee = $leave->employee;
                $balance_field = $leave->type . '_leave_balance';

                if ($employee->$balance_field < $leave->total_days) {
                    throw new \Exception("Employee does not have sufficient {$leave->type} leave balance");
                }

                $employee->decrement($balance_field, $leave->total_days);
                $employee->increment('total_leave_taken', $leave->total_days);
                $employee->save();
            }

            $leave->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'notes' => $request->notes ?? $leave->notes
            ]);

            DB::commit();

            // Send notification to employee
            // $leave->employee->user->notify(new LeaveApproved($leave));

            return redirect()->back()->with('success', 'Leave approved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error approving leave: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, Leave $leave)
    {
        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500'
        ]);

        if ($leave->status != 'pending') {
            return redirect()->back()->with('error', 'Leave is not pending for rejection');
        }

        $leave->update([
            'status' => 'rejected',
            'rejected_by' => Auth::id(),
            'rejected_at' => now(),
            'rejection_reason' => $request->rejection_reason
        ]);

        // Send notification to employee
        // $leave->employee->user->notify(new LeaveRejected($leave, $request->rejection_reason));

        return redirect()->back()->with('success', 'Leave rejected successfully');
    }

    public function cancel(Leave $leave)
    {
        // Only employee can cancel their own leave
        if ($leave->employee_id != Auth::user()->employee?->id) {
            abort(403, 'Unauthorized');
        }

        if ($leave->status != 'pending') {
            return redirect()->back()->with('error', 'Only pending leaves can be cancelled');
        }

        $leave->update([
            'status' => 'cancelled'
        ]);

        return redirect()->back()->with('success', 'Leave application cancelled');
    }

    public function destroy(Leave $leave)
    {

        if ($leave->status == 'approved') {
            return redirect()->back()->with('error', 'Cannot delete approved leave');
        }

        $leave->delete();

        return redirect()->route('leave.index')->with('success', 'Leave application deleted');
    }

    public function balance(Request $request, $employeeId)
    {
        $employee = Employee::findOrFail($employeeId);

        $balance = [
            'sick' => [
                'total' => 14,
                'used' => 14 - ($employee->sick_leave_balance ?? 14),
                'remaining' => $employee->sick_leave_balance ?? 14
            ],
            'casual' => [
                'total' => 10,
                'used' => 10 - ($employee->casual_leave_balance ?? 10),
                'remaining' => $employee->casual_leave_balance ?? 10
            ],
            'earned' => [
                'total' => $employee->earned_leave_balance ?? 0,
                'used' => $employee->earned_leave_taken ?? 0,
                'remaining' => $employee->earned_leave_balance ?? 0
            ],
            'maternity' => [
                'total' => 120,
                'used' => 120 - ($employee->maternity_leave_balance ?? 120),
                'remaining' => $employee->maternity_leave_balance ?? 120
            ],
            'paternity' => [
                'total' => 15,
                'used' => 15 - ($employee->paternity_leave_balance ?? 15),
                'remaining' => $employee->paternity_leave_balance ?? 15
            ]
        ];

        return response()->json([
            'success' => true,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_id' => $employee->employee_id
            ],
            'balance' => $balance,
            'total_leave_taken' => $employee->total_leave_taken ?? 0
        ]);
    }

    public function updateLeaveBalances()
    {
        // This method can be scheduled monthly to add earned leaves
        $employees = Employee::where('is_active', true)->get();

        foreach ($employees as $employee) {
            // Add 1.5 days earned leave per month (18 days per year)
            $employee->increment('earned_leave_balance', 1.5);
            $employee->last_leave_increment = now();
            $employee->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Leave balances updated for all employees'
        ]);
    }

    private function calculateWorkingDays($startDate, $endDate, $isHalfDay = false)
    {
        $days = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Skip Fridays (weekend)
            if ($date->dayOfWeek != Carbon::FRIDAY) {
                $days += 1;
            }
        }

        // Adjust for half day
        if ($isHalfDay) {
            $days = $days - 0.5;
        }

        return max(0.5, $days); // Minimum half day
    }

    
    public function dashboard()
    {
        $employee = Auth::user()->employee;

        if (!$employee) {
            return Inertia::render('Leave/Dashboard', [
                'error' => 'Employee profile not found'
            ]);
        }

        // Current month leaves
        $currentMonth = now()->format('Y-m');
        $monthlyLeaves = Leave::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereRaw("DATE_FORMAT(start_date, '%Y-%m') = ?", [$currentMonth])
            ->orWhereRaw("DATE_FORMAT(end_date, '%Y-%m') = ?", [$currentMonth])
            ->get();

        // Leave balance
        $leave_balance = [
            'sick' => $employee->sick_leave_balance ?? 14,
            'casual' => $employee->casual_leave_balance ?? 10,
            'earned' => $employee->earned_leave_balance ?? 0,
            'maternity' => $employee->maternity_leave_balance ?? 120,
            'paternity' => $employee->paternity_leave_balance ?? 15
        ];

        // Pending leaves
        $pendingLeaves = Leave::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->count();

        return Inertia::render('Leave/Dashboard', [
            'employee' => $employee,
            'leave_balance' => $leave_balance,
            'monthly_leaves' => $monthlyLeaves,
            'pending_leaves' => $pendingLeaves,
            'total_leave_taken' => $employee->total_leave_taken ?? 0
        ]);
    }
}
