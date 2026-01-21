<?php

namespace App\Http\Controllers;

use App\Models\BusinessProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AuthController extends Controller
{
    // login view
    public function loginView()
    {
        return Inertia::render('auth/Login');
    }

    // login post
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|lowercase',
            'password' => 'required|string|min:6',
        ]);

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return back()->with('error', 'The provided credentials do not match our records.');
            }

            if (!$user->isSuperAdmin()) {
                if (!$user->hasValidSubscription()) {
                    return back()->with('error', 'Your subscription is not active or has expired. Please renew to login.');
                }
            }

            $credentials = $request->only('email', 'password');

            if (Auth::attempt($credentials, $request->filled('remember'))) {
                $request->session()->regenerate();
                return redirect()->route('home')->with('success', 'Login successful');
            }

            return back()->with('error', 'The provided credentials do not match our records.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'An error occurred while logging in.');
        }
    }

    public function logout()
    {
        try {
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
            return redirect()->route('login');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'An error occurred while logging out.');
        }
    }

    public function profileView()
    {
        return Inertia::render('auth/Profile');
    }



    public function businessProfileView()
    {
        $business = BusinessProfile::where('user_id', Auth::id())->first();

        return Inertia::render('auth/BusinessProfile', [
            'business' => $business,
        ]);
    }

    public function businessProfileUpdate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|max:255',
            'email' => 'required|email|lowercase|max:255',
            'phone' => 'required',
            'address' => 'required|string|min:3|max:500',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string|max:1000',
            'tax_number' => 'nullable|string|max:50',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'thum' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            $data = $validated;

            // Get existing business profile if it exists
            $business = BusinessProfile::where('user_id', Auth::id())->first();

            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($business && $business->logo) {
                    Storage::disk('public')->delete($business->logo);
                }

                $data['logo'] = $request->file('logo')->store('business/logos', 'public');
            } else {
                // Keep existing logo if no new file uploaded
                unset($data['logo']);
            }

            // Handle thumbnail upload
            if ($request->hasFile('thum')) {
                // Delete old thumbnail if exists
                if ($business && $business->thum) {
                    Storage::disk('public')->delete($business->thum);
                }

                $data['thum'] = $request->file('thum')->store('business/thumbs', 'public');
            } else {
                // Keep existing thumbnail if no new file uploaded
                unset($data['thum']);
            }

            // Add user_id to data
            $data['user_id'] = Auth::id();

            // Update or create business profile
            $business = BusinessProfile::updateOrCreate(
                ['user_id' => Auth::id()],
                $data
            );

            // Return success response
            return back()->with('success', 'Business profile updated successfully.');
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Business profile update error: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to update business profile. Please try again.']);
        }
    }

    // update profile
    public function profileUpdate(Request $request)
    {
        $request->validate([
            'profile' => 'nullable|image|mimes:png,jpg,jpeg',
            'name' => 'required',
            'phone_no' => 'nullable|min:11|max:14',
            'address' => 'nullable|min:3'
        ]);

        try {
            $q = User::find(Auth::id());
            $q->name = $request->name;
            if ($request->phone_no) {
                $q->phone = $request->phone_no;
            }
            if ($request->address) {
                $q->address = $request->address;
            }
            if ($request->hasFile('profile')) {
                // Delete old image if exists
                if ($q->profile && file_exists(public_path('media/uploads/' . $q->profile))) {
                    unlink(public_path('media/uploads/' . $q->profile));
                }

                // Get new file
                $file = $request->file('profile');

                // Generate unique filename
                $filename = time() . '_profile_' . uniqid() . '.' . $file->getClientOriginalExtension();

                // Move to public/media/uploads
                $file->move(public_path('media/uploads'), $filename);

                // Save new image path in DB
                $q->profile = $filename;
            }
            $q->save();
            return redirect()->back()->with('success', 'Profile updated success.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }

    // security =================
    public function securityView()
    {
        return Inertia::render('auth/Security');
    }

    public function securityUpdate(Request $request)
    {
        $request->validate([
            'new_password' => 'required|min:6|confirmed',
        ]);

        try {
            $q = User::find(Auth::id());
            $q->password = Hash::make($request->new_password);
            $q->save();
            return redirect()->back()->with('success', 'New password updated success.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }
}
