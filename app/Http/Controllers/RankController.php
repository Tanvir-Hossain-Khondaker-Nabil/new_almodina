<?php
// app/Http/Controllers/RankController.php

namespace App\Http\Controllers;

use App\Models\Rank;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;

class RankController extends Controller
{
    public function index()
    {
        $ranks = Rank::withCount('users')->get();
        return Inertia::render('Ranks/Index', ['ranks' => $ranks]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'level' => 'required|string|max:50',
            'base_salary' => 'required|numeric|min:0',
            'salary_increment_percentage' => 'required|numeric|min:0|max:100',
            'min_working_days' => 'required|integer|min:1|max:31',
            'max_late_minutes' => 'required|integer|min:0'
        ]);

        Rank::create($request->all());

        return redirect()->back()->with('success', 'Rank created successfully');
    }

    // public function update(Request $request, Rank $rank)
    // {
    //     $request->validate([
    //         'name' => 'required|string|max:255',
    //         'level' => 'required|string|max:50',
    //         'base_salary' => 'required|numeric|min:0',
    //         'salary_increment_percentage' => 'required|numeric|min:0|max:100',
    //         'min_working_days' => 'required|integer|min:1|max:31',
    //         'max_late_minutes' => 'required|integer|min:0'
    //     ]);

    //     $rank->update($request->all());

    //     return redirect()->back()->with('success', 'Rank updated successfully');
    // }

    public function updateEmployeeRank(Request $request, Employee $user)
    {
        $request->validate([
            'rank_id' => 'required|exists:ranks,id',
            'update_salary' => 'boolean' // স্যালারি আপডেট করতে চান কিনা
        ]);

        $newRank = Rank::find($request->rank_id);
        $oldRank = $user->rank;

        $message = "Rank updated from {$oldRank->name} to {$newRank->name}";

        // যদি স্যালারি আপডেট করতে চান
        if ($request->update_salary) {
            $incrementPercentage = $newRank->salary_increment_percentage;
            $newSalary = $user->current_salary +
                ($user->current_salary * $incrementPercentage / 100);

            $user->update([
                'rank_id' => $newRank->id,
                'current_salary' => $newSalary
            ]);

            $message .= ". New salary: ৳{$newSalary}";
        } else {
            // শুধু র‍্যাংক চেঞ্জ, স্যালারি একই থাকবে
            $user->update([
                'rank_id' => $newRank->id
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    public function destroy(Rank $rank)
    {
        if ($rank->users()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete rank with assigned users');
        }

        $rank->delete();
        return redirect()->back()->with('success', 'Rank deleted successfully');
    }

    // public function promoteEmployee(Request $request, Employee $user)
    // {
    //     $request->validate([
    //         'new_rank_id' => 'required|exists:ranks,id'
    //     ]);

    //     $newRank = Rank::find($request->new_rank_id);
    //     $currentSalary = $user->current_salary;

    //     // Calculate new salary based on increment percentage
    //     $incrementPercentage = $newRank->salary_increment_percentage;
    //     $newSalary = $currentSalary + ($currentSalary * $incrementPercentage / 100);

    //     DB::transaction(function() use ($user, $newRank, $newSalary) {
    //         $user->update([
    //             'rank_id' => $newRank->id,
    //             'current_salary' => $newSalary
    //         ]);
    //     });

    //     return redirect()->back()->with('success', "Employee promoted successfully. New salary: {$newSalary}");
    // }

    public function getRankEmployees(Rank $rank)
    {
        $users = $rank->users()->paginate(20);
        return Inertia::render('Ranks/Employees', [
            'rank' => $rank,
            'users' => $users
        ]);
    }

    public function promoteEmployeeForm(Employee $user)
    {
        $nextRanks = Rank::where('level', '>', $user->rank->level)
            ->where('is_active', true)
            ->orderBy('level')
            ->get();

        return Inertia::render('Employee/Promote', [
            'user' => $user->load('rank'),
            'nextRanks' => $nextRanks
        ]);
    }

    public function promoteEmployee(Request $request, Employee $user)
    {
        $request->validate([
            'new_rank_id' => 'required|exists:ranks,id'
        ]);

        $newRank = Rank::find($request->new_rank_id);

        // Calculate new salary with increment
        $incrementPercentage = $newRank->salary_increment_percentage;
        $newSalary = $user->current_salary +
            ($user->current_salary * $incrementPercentage / 100);

        $user->update([
            'rank_id' => $newRank->id,
            'current_salary' => $newSalary,
            'basic_salary' => $user->basic_salary // Basic remains same
        ]);

        return redirect()->route('employees.index')
            ->with('success', "{$user->name} promoted to {$newRank->name}. New salary: ৳{$newSalary}");
    }
}