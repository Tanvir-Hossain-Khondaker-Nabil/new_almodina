<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Clear cached roles & permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ========== ALL PERMISSIONS ==========
        $permissions = [
            // Dashboard
            'dashboard.view',

            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Customers
            'customer.view',
            'customer.create',
            'customer.edit',
            'customer.delete',
            'customer.show',

            // Categories
            'category.view',
            'category.create',
            'category.edit',
            'category.delete',

            // Suppliers
            'supplier.view',
            'supplier.create',
            'supplier.edit',
            'supplier.delete',
            'supplier.show',

            // Products
            'product.view',
            'product.create',
            'product.edit',
            'product.delete',

            // Brands
            'brands.view',
            'brands.create',
            'brands.edit',
            'brands.delete',
            'brands.show',

            // Roles
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.show',

            // Sales
            'sales.view',
            'sales.create',
            'sales.edit',
            'sales.delete',
            'sales.print',
            'sales.download_pdf',
            'sales.items.view',
            'sales.items.delete',
            'sales.payments.create',
            'sales.update',
            'sales.rejected',

            // Sales List
            'sales_list.view',
            'sales_list.delete',
            'sales_list.status_update',
            'sales_list.due_collect',

            // Expenses
            'expense.view',
            'expense.create',
            'expense.delete',
            'expense.category_view',
            'expense.category_create',

            // Extra Cash
            'extra_cash.view',
            'extra_cash.create',
            'extra_cash.delete',

            // Profile
            'profile.view',
            'profile.update',
            'security.view',
            'security.update',

            // Barcode
            'barcode.print',

            // Attributes
            'attributes.view',
            'attributes.create',
            'attributes.edit',
            'attributes.delete',
            'attributes.values.create',
            'attributes.values.delete',

            // Payments & Ledger
            'payments.view',
            'payments.ledger_view',
            'payments.show',
            'ledger.view',
            'ledger.customer_view',
            'ledger.supplier_view',
            'ledger.clear_due',
            'ledger.advance_payment',

            // Warehouse
            'warehouse.view',
            'warehouse.create',
            'warehouse.show',
            'warehouse.edit',
            'warehouse.update',
            'warehouse.delete',

            // Purchase
            'purchase.view',
            'purchase.create',
            'purchase.show',
            'purchase.edit',
            'purchase.update',
            'purchase.delete',
            'purchase.update_payment',
            'purchase.approve',
            'purchase.items_view',
            'purchase.statistics_view',
            'purchase.recent_view',
            'purchase.export_pdf',

            // Purchase Return
            'purchase_return.view',
            'purchase_return.create',
            'purchase_return.show',
            'purchase_return.edit',
            'purchase_return.update',
            'purchase_return.delete',
            'purchase_return.approve',
            'purchase_return.complete',

            // Companies
            'companies.view',
            'companies.create',
            'companies.show',
            'companies.edit',
            'companies.update',
            'companies.delete',

            // Attendance
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            'attendance.checkin',
            'attendance.checkout',
            'attendance.manual_entry',
            'attendance.monthly_report',
            'attendance.top_performers',
            'attendance.early_out',

            // Salary
            'salary.view',
            'salary.create',
            'salary.edit',
            'salary.delete',
            'salary.calculate',
            'salary.pay',
            'salary.payslip',
            'salary.report',
            'salary.bulk_action',
            'salary.test_form',
            'salary.test_create',
            'salary.process_award_payments',

            // Leave
            'leave.view',
            'leave.create',
            'leave.edit',
            'leave.delete',
            'leave.store',
            'leave.show',
            'leave.approve',
            'leave.reject',
            'leave.cancel',
            'leave.balance_view',
            'leave.dashboard_view',

            // Provident Fund
            'provident_fund.view',
            'provident_fund.create',
            'provident_fund.edit',
            'provident_fund.delete',
            'provident_fund.summary_view',
            'provident_fund.statement_view',
            'provident_fund.update_percentage',

            // Allowances
            'allowances.view',
            'allowances.create',
            'allowances.edit',
            'allowances.delete',
            'allowances.update',
            'allowances.apply_settings',
            'allowances.update_user',

            // Ranks
            'ranks.view',
            'ranks.create',
            'ranks.edit',
            'ranks.delete',
            'ranks.update',
            'ranks.users_view',
            'ranks.promote_user',

            // Awards
            'awards.view',
            'awards.create',
            'awards.edit',
            'awards.delete',
            'awards.update',
            'awards.show',
            'awards.assign_monthly',
            'awards.assign_to_employee',
            'awards.employee_awards_view',
            'awards.mark_paid',
            'awards.mark_unpaid',
            'awards.destroy_employee_award',
            'awards.statistics_view',

            // Employees
            'employees.view',
            'employees.create',
            'employees.edit',
            'employees.delete',
            'employees.update',
            'employees.update_password',
            'employees.update_salary',

            // Bonus
            'bonus.view',
            'bonus.create',
            'bonus.edit',
            'bonus.delete',
            'bonus.update',
            'bonus.show',
            'bonus.apply_form',
            'bonus.apply',
            'bonus.apply_eid',
            'bonus.apply_festival',

            // Exchange
            'exchange.view',
            'exchange.create',
            'exchange.edit',
            'exchange.delete',

            // PDF
            'pdf.download',
            'pdf.view',
            'lang.switch',
            'lang.current',

            // Outlets
            'outlets.view',
            'outlets.create',
            'outlets.edit',
            'outlets.delete',
            'outlets.show',
            'outlets.login',
            'outlets.logout',
            'outlets.switch',

            // Accounts
            'accounts.view',
            'accounts.create',
            'accounts.edit',
            'accounts.delete',
            'accounts.show',
            'accounts.deposit',
            'accounts.withdraw',
            'accounts.transfer',

            // Deposits
            'deposits.view',
            'deposits.create',
            'deposits.edit',
            'deposits.delete',
            'deposits.show',
            'deposits.approve',
            'deposits.reject',

            // Sales Return
            'sales_return.view',
            'sales_return.create',
            'sales_return.edit',
            'sales_return.delete',
            'sales_return.show',

            // SMS
            'sms_templates.view',
            'sms_templates.create',
            'sms_templates.edit',
            'sms_templates.delete',
            'sms_templates.show',
            'sms_templates.toggle_status',

            // Note: Removed duplicate 'roles' and 'users' entries
        ];

        // Get all existing permission names
        $existingPermissions = Permission::pluck('name')->toArray();
        
        // Create or update permissions
        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission]);
        }
        
        // Delete permissions that are no longer in the list
        $permissionsToDelete = array_diff($existingPermissions, $permissions);
        if (!empty($permissionsToDelete)) {
            Permission::whereIn('name', $permissionsToDelete)->delete();
        }

        // ========== ROLES ==========
        $superAdmin = Role::updateOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions(Permission::all());

        $admin = Role::updateOrCreate(['name' => 'Admin']);
        // If you want Admin to have all permissions like Super Admin
        $admin->syncPermissions(Permission::all());

        // ========== USERS ==========
        $superAdminUser = User::updateOrCreate(
            ['email' => 'superadmin@system.com'],
            [
                'name' => 'Super Admin', 
                'password' => bcrypt('password123'), 
                'email_verified_at' => now(),
                // Make sure to add any other required fields based on your User model
            ]
        );
        $superAdminUser->syncRoles(['Super Admin']);

        // === Supplier Create ======
        Supplier::updateOrCreate(
            ['email' => 'pickup@mail.com'],
            [
                'name' => 'Supplier User',
                'contact_person' => 'Supplier User',
                'email' => 'pickup@mail.com',
                'phone' => '0123456789',
                'company' => 'Pickup Supplier',
                'address' => 'N/A',
                'advance_amount' => 0,
                'due_amount' => 0,
                'is_active' => 1,
                'created_by' => 1, // Use default ID instead of Auth::id()
                'outlet_id' => 1 ?? null,
                'dealership_id' => null,
            ]
        );

        // === Customer Create ======
        Customer::updateOrCreate(
            ['phone' => '100100100'],
            [
                'customer_name' => 'walk-in-customer',
                'address' => 'N/A',
                'phone' => '100100100',
                'is_active' => 1,
                'advance_amount' => 0,
                'due_amount' => 0,
                'created_by' => 1, // Use default ID instead of Auth::id()
                'outlet_id' => 1 ?? null,
            ]
        );

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}