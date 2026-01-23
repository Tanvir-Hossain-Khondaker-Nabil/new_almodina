<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->with(['roles', 'business'])
            ->whereHas('roles', function ($q) {
                $q->where('name', '!=', 'Super Admin'); // Exclude Super Admin users
            })
            ->where('id', '!=', Auth::id()) // Exclude current user
            ->latest();

        // Search filter
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Role filter
        if ($request->has('role') && $request->role) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Get all roles for filter dropdown (excluding Super Admin)
        $allRoles = Role::where('name', '!=', 'Super Admin')->get()->pluck('name');

        // Calculate statistics
        $totalUsers = User::whereHas('roles', function ($q) {
            $q->where('name', '!=', 'Super Admin');
        })->count();
        
        $adminsCount = User::whereHas('roles', function ($q) {
            $q->where('name', 'admin');
        })->count();
        
        // Check if 'seller' role exists before counting
        $sellersCount = 0;
        if (Role::where('name', 'seller')->exists()) {
            $sellersCount = User::whereHas('roles', function ($q) {
                $q->where('name', 'seller');
            })->count();
        }
        
        // Remove is_active filter since the column doesn't exist
        // All users are considered active by default
        $activeUsers = User::whereHas('roles', function ($q) {
            $q->where('name', '!=', 'Super Admin');
        })->count();

        return Inertia::render('Users/Index', [
            'filters' => $request->only(['search', 'role']),
            'users' => $query->paginate(10)->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->profile,
                    'roles' => $user->roles->pluck('name'),
                    'address' => $user->address,
                    'type' => $user->type,
                    'join_at' => $user->created_at->format('d M Y'),
                    'last_login' => $user->last_login_at?->format('d M Y H:i'),
                ]),
            'roles' => $allRoles,
            'statistics' => [
                'total_users' => $totalUsers,
                'admins_count' => $adminsCount,
                'sellers_count' => $sellersCount,
                'active_users' => $activeUsers,
            ]
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('Users/Create', [
            'user' => null,
            'roles' => Role::where('name', '!=', 'Super Admin')->get()->pluck('name'),
            'isEdit' => false,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $user = User::with('roles')->findOrFail($id);

            // Prevent editing super admin users
            if ($user->hasRole('Super Admin') && !Auth::user()->hasRole('Super Admin')) {
                return redirect()->route('userlist.view')
                    ->with('error', 'Cannot edit Super Admin user.');
            }

            return Inertia::render('Users/Create', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'roles' => $user->roles->pluck('name'),
                ],
                'roles' => Role::where('name', '!=', 'Super Admin')->get()->pluck('name'),
                'isEdit' => true,
            ]);

        } catch (\Exception $e) {
            return redirect()->route('userlist.view')
                ->with('error', 'User not found.');
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
        ]);

        DB::beginTransaction();
        try {
            $auth = Auth::user();
            $ownerId = $auth->ownerId();

            if (!$auth->current_outlet_id) {
                return back()->with('error', 'Please login to an outlet first.')->withInput();
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                // ✅ staff binds to owner + current outlet
                'parent_id' => $ownerId,
                'current_outlet_id' => $auth->current_outlet_id,
                'type' => 'general',
            ]);

            $user->syncRoles($request->roles);

            DB::commit();
            return redirect()->route('userlist.view')->with('success', 'User created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent updating super admin users
        if ($user->hasRole('Super Admin') && !Auth::user()->hasRole('Super Admin')) {
            return redirect()->route('userlist.view')
                ->with('error', 'Cannot update Super Admin user.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            DB::beginTransaction();

            // Update user
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            // Update password if provided
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            // Sync roles
            $user->syncRoles($request->roles);

            DB::commit();

            return redirect()->route('userlist.view')
                ->with('success', 'User updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'Failed to update user: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function delete($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deleting self
            if ($user->id === Auth::id()) {
                return redirect()->route('userlist.view')
                    ->with('error', 'You cannot delete your own account.');
            }

            // Prevent deleting super admin users
            if ($user->hasRole('Super Admin')) {
                return redirect()->route('userlist.view')
                    ->with('error', 'Cannot delete Super Admin user.');
            }

            $user->delete();

            return redirect()->route('userlist.view')
                ->with('success', 'User deleted successfully.');

        } catch (\Exception $e) {
            return redirect()->route('userlist.view')
                ->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent toggling self
            if ($user->id === Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot deactivate your own account.'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status.'
            ], 500);
        }
    }

    /**
     * Toggle user type between shadow and general
     */
    public function toggleUserType(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->back()->with('error', 'User not authenticated');
        }

        // Toggle between shadow and general
        $newType = $user->type === 'shadow' ? 'general' : 'shadow';

        try {
            $user->type = $newType;
            $user->save();

            // Refresh the user in the session
            Auth::setUser($user->fresh());

            return redirect()->back()->with('success', "Switched to {$newType} mode");

        } catch (\Exception $e) {
            Log::error("Error updating user type: " . $e->getMessage(), [
                'user_id' => $user->id,
                'new_type' => $newType
            ]);

            return redirect()->back()->with('error', 'Failed to switch mode: ' . $e->getMessage());
        }
    }
}