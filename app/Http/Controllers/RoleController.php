<?php
// app/Http/Controllers/RoleController.php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    $query = Role::with(['permissions', 'users'])
        ->where('name', '!=', 'Super Admin');

    // Search filter
    if ($request->has('search') && $request->search) {
        $query->where('name', 'like', '%' . $request->search . '%');
    }

    // Sorting
    $sortBy = $request->get('sort_by', 'created_at');
    $sortOrder = $request->get('sort_order', 'desc');
    $query->orderBy($sortBy, $sortOrder);

    // Pagination
    $roles = $query->paginate(10)->withQueryString()
        ->through(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at->format('d M Y'),
                'users_count' => $role->users->count(),
                'permissions_count' => $role->permissions->count()
            ];
        });

    return Inertia::render('Roles/Index', [
        'roles' => $roles,
        'permissions' => $this->getPermissionsGrouped(),
        'filters' => $request->only(['search', 'sort_by', 'sort_order']),
        'pagination' => [
            'current_page' => $roles->currentPage(),
            'last_page' => $roles->lastPage(),
            'per_page' => $roles->perPage(),
            'total' => $roles->total(),
        ]
    ]);
}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Roles/Create', [
            'permissions' => $this->getPermissionsGrouped()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $role = Role::create(['name' => $request->name]);
            
            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            DB::commit();

            return redirect()->route('roles.index')
                ->with('success', 'Role created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to create role: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        $role->load('permissions', 'users');

        return Inertia::render('Roles/Show', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'users' => $role->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email
                    ];
                }),
                'created_at' => $role->created_at->format('d M Y')
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        if ($role->name === 'Super Admin') {
            return redirect()->route('roles.index')
                ->with('error', 'Super Admin role cannot be edited.');
        }

        $role->load('permissions');

        return Inertia::render('Roles/Create', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')
            ],
            'permissions' => $this->getPermissionsGrouped()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        if ($role->name === 'Super Admin') {
            return redirect()->route('roles.index')
                ->with('error', 'Super Admin role cannot be updated.');
        }

        try {
            DB::beginTransaction();

            $role->update(['name' => $request->name]);
            $role->syncPermissions($request->permissions);

            DB::commit();

            return redirect()->route('roles.index')
                ->with('success', 'Role updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to update role: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        if ($role->name === 'Super Admin') {
            return redirect()->route('roles.index')
                ->with('error', 'Super Admin role cannot be deleted.');
        }

        if ($role->users()->count() > 0) {
            return redirect()->route('roles.index')
                ->with('error', 'Cannot delete role that has users assigned.');
        }

        try {
            $role->delete();
            return redirect()->route('roles.index')
                ->with('success', 'Role deleted successfully.');

        } catch (\Exception $e) {
            return redirect()->route('roles.index')
                ->with('error', 'Failed to delete role: ' . $e->getMessage());
        }
    }

    /**
     * Get permissions grouped by module
     */
    private function getPermissionsGrouped()
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            // Extract module name from permission name (e.g., 'user.view' -> 'user')
            return explode('.', $permission->name)[0];
        });

        $grouped = [];
        foreach ($permissions as $module => $perms) {
            $grouped[] = [
                'module' => ucfirst($module),
                'permissions' => $perms->map(function ($perm) {
                    return [
                        'id' => $perm->id,
                        'name' => $perm->name,
                        'label' => $this->generatePermissionLabel($perm->name)
                    ];
                })
            ];
        }

        return $grouped;
    }

    /**
     * Generate readable label for permission
     */
    private function generatePermissionLabel($permissionName)
    {
        $parts = explode('.', $permissionName);
        $module = ucfirst($parts[0]);
        $action = $parts[1] ?? '';

        $actionLabels = [
            'view' => 'View',
            'create' => 'Create', 
            'edit' => 'Edit',
            'delete' => 'Delete',
            'update' => 'Update'
        ];

        return $module . ' ' . ($actionLabels[$action] ?? ucfirst($action));
    }
}