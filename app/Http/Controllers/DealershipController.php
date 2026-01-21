<?php

namespace App\Http\Controllers;

use App\Http\Requests\DelerShipStore;
use App\Models\Company;
use App\Models\DillerShip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Services\ServiceClass;
use Illuminate\Support\Facades\Auth;

class DealershipController extends Controller
{
        /**
         * Display a listing of the resource.
         */
        public function index(Request $request)
        {
            $dellerships = DillerShip::with('company', 'approver')
                ->when($request->search, function ($query, $search) {
                    $query->search($search);
                })
                ->orderBy('created_at', 'desc')
                ->paginate(10)
                ->withQueryString();

            
            return Inertia::render('Dealerships/Index', [
                'dellerships' => $dellerships,
                'filters' => $request->only(['search']),
            ]);
        }

        /**
         * Show the form for creating a new resource.
         */
        public function create()
        {
            return Inertia::render('Dealerships/Create', [
                'companies' => Company::select('id', 'name')->get(),
            ]);
        }

        /**
         * Store a newly created resource in storage.
         */
        public function store(DelerShipStore $request)
        {

            $validated = $request->validated();

            if(DillerShip::where('company_id', $validated['company_id'])->exists()){
               return back()->withErrors(['company_id' => 'A dealership for the selected company already exists.'])->withInput();
            }


            DB::beginTransaction();

            try {
                $uploadedFiles = $this->fileFunction($request);
                $validated = array_merge($validated, $uploadedFiles);

                if (($validated['status'] ?? null) == 'approved') {
                    $validated['approved_by'] = Auth::id();
                    $validated['approved_at'] = now();
                }

                $validated['total_sales'] = $validated['total_sales'] ?? 0;
                $validated['total_orders'] = $validated['total_orders'] ?? 0;
                $validated['rating'] = $validated['rating'] ?? 0;
                $validated['advance_amount'] = $validated['advance_amount'] ?? 0;
                $validated['due_amount'] = $validated['due_amount'] ?? 0;
                $validated['credit_limit'] = $validated['credit_limit'] ?? 0;

                DillerShip::create($validated);

                DB::commit();

                return to_route('dealerships.index')->with('success', 'Dealership created successfully!');
            }
            catch (\Exception $e) {
                DB::rollBack();

                foreach ($uploadedFiles ?? [] as $path) {
                    if ($path && Storage::disk('public')->exists($path)) {
                        Storage::disk('public')->delete($path);
                    }
                }

                return redirect()->back()
                    ->with('error', 'Failed to create dealership: ' . $e->getMessage())
                    ->withInput();
            }
        }



        /**
         * Display the specified resource.
         */
        public function show(string $id)
        {
            $delership = DillerShip::with('company', 'approver')->findOrFail($id);
            return Inertia::render('Dealerships/Show', [
                'delership' => $delership,
            ]);
        }

        /**
         * Show the form for editing the specified resource.
         */
        public function edit(string $id)
        {
           $dealership = DillerShip::findOrFail($id);

           return Inertia::render('Dealerships/Edit', [
                'dealership' => $dealership,
                'companies' => Company::select('id', 'name')->get(),
            ]);
        }

        /**
         * Update the specified resource in storage.
         */
        public function update(Request $request, string $id)
        {
            $validated = $request->validate([
                'phone' => 'required',
                'address' => 'required|string|max:255', 
                'credit_limit' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'remarks' => 'nullable|string',
            ]);


            $dealership = DillerShip::findOrFail($id);

            DB::beginTransaction();
            try {
                // $uploadedFiles = $this->fileFunction($request);
                // $validated = array_merge($validated, $uploadedFiles);

                if (($validated['status'] ?? null) == 'approved' && !$dealership->approved_at) {
                    $validated['approved_by'] = Auth::id();
                    $validated['approved_at'] = now();
                }

                $dealership->update($validated);

                DB::commit();

                return to_route('dealerships.index')->with('success', 'Dealership updated successfully!');
            } catch (\Exception $e) {
                DB::rollBack();

                foreach ($uploadedFiles ?? [] as $path) {
                    if ($path && Storage::disk('public')->exists($path)) {
                        Storage::disk('public')->delete($path);
                    }
                }

                return redirect()->back()
                    ->with('error', 'Failed to update dealership: ' . $e->getMessage())
                    ->withInput();
            }
        }

        /**
         * Remove the specified resource from storage.
         */
        public function destroy(string $id)
        {
            //
        }


        //aproved 

        public function approve(Request $request, string $id)
        {
            $dealership = DillerShip::findOrFail($id);

            if ($dealership->status == 'approved') {
                return redirect()->back()->with('info', 'Dealership is already approved.');
            }

            $dealership->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            return redirect()->back()->with('success', 'Dealership approved successfully.');
        }


        private function fileFunction(Request $request)
        {
            $files = [];

            $map = [
                'contract_file'       => 'DelerShip/contracts',
                'agreement_doc'       => 'DelerShip/agreement',
                'bank_guarantee_doc'  => 'DelerShip/bank_guarantee',
                'trade_license_doc'   => 'DelerShip/trade_license',
                'nid_doc'             => 'DelerShip/nid',
                'tax_clearance_doc'   => 'DelerShip/tax_clearance',
            ];

            foreach ($map as $field => $path) {
                if ($request->hasFile($field)) {
                    $files[$field] = ServiceClass::uploadFile($request->file($field), $path);
                } else {
                    $files[$field] = null;
                }
            }

            return $files;
        }

    }
