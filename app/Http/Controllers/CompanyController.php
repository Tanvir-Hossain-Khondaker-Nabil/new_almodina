<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display a listing of the companies.
     */
    public function index()
    {
        $filters = request()->only(['search']);
        
        $companies = Company::when($filters['search'] ?? null, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        })->latest()->paginate(10);

        return Inertia::render('Company/Index', [
            'companies' => $companies,
            'filters' => $filters,
        ]);

    }

    /**
     * Show the form for creating a new company.
     */
    public function create()
    {
        return view('companies.create');
    }

    /**
     * Store a newly created company in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:companies,name',
            'email'       => 'nullable|email|unique:companies,email',
            'phone'       => 'nullable|string|max:20',
            'address'     => 'nullable|string',
            'website'     => 'nullable|url',
            'logo'        => 'nullable|image|max:2048',
            'status'      => 'required|in:active,inactive',
        ]);

        $company = new Company($validated);

        if ($request->hasFile('logo')) {
            $company->logo = $request->file('logo')->store('company-logos', 'public');
        }

        $company->save();

        return redirect()->route('companies.index')->with('success', 'Company created successfully!');
    }



    /**
     * Display the specified company.
     */
    public function show(Company $company)
    {
        return view('companies.show', compact('company'));
    }

    /**
     * Show the form for editing the specified company.
     */
    public function edit(Company $company)
    {
        return view('companies.edit', compact('company'));
    }

    /**
     * Update the specified company in storage.
     */
    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:companies,name,' . $company->id,
            'email'       => 'nullable|email|unique:companies,email,' . $company->id,
            'phone'       => 'nullable|string|max:20',
            'address'     => 'nullable|string',
            'website'     => 'nullable|url',
            'logo'        => 'nullable|image|max:2048',
            'status'      => 'required|in:active,inactive',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($company->logo) {
                Storage::disk('public')->delete($company->logo);
            }
            $validated['logo'] = $request->file('logo')->store('company-logos', 'public');
        }

        $company->update($validated);

        return redirect()->route('companies.index')->with('success', 'Company updated successfully!');
    }

    /**
     * Remove the specified company from storage.
     */
    public function destroy(Company $company)
    {
        $company->delete();

        return redirect()->route('companies.index')->with('success', 'Company deleted successfully!');
    }
}
