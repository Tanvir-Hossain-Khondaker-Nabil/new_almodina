<?php

namespace App\Http\Controllers;

use App\Models\ExtraCas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExtraCashController extends Controller
{
    // index
    public function index(Request $request)
    {
        $date = $request->query('date') ?? now('Asia/Dhaka')->toDateString();

        $data = ExtraCas::with(['createdby'])
            ->whereDate('date', $date)
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->paginate(10);

        return Inertia::render('extra/Index', [
            'extracashdata' => $data,
            'query' => $request->query('date')
        ]);
    }

    // store
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric'
        ]);

        try {
            ExtraCas::create([
                'date' => $request->date,
                'amount' => $request->amount,
                'created_by' => Auth::id()
            ]);

            return redirect()->back()->with('success', "Add extra cash.");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }

    // delete
    public function del($id)
    {
        try {
            ExtraCas::find($id)->delete();

            return redirect()->back()->with('success', "Deleted success.");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }
}
