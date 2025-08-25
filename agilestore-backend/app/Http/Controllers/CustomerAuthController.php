<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CustomerAuthController extends Controller
{
    /**
     * Register.
     */
    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'full_name' => ['required','string','max:100'],
                'email'     => ['required','email','max:100','unique:mst_customers,email'],
                'phone'     => ['required','string','max:30'],
                'company'   => ['nullable','string','max:100'],
                'password'  => ['required', Password::min(8)->letters()->numbers()],
            ]);

            $cust = Customer::create([
                'full_name' => $data['full_name'],
                'email'     => $data['email'],
                'phone'     => $data['phone'],
                'company'   => $data['company'] ?? null,
                'password'  => Hash::make($data['password']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Berhasil register',
                'data'    => $cust->only(['id','full_name','email','phone','company','profile_photo']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal register ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login.
     */
    public function login(Request $request)
    {
        // credentials
        $cred = $request->validate([
            'email'    => ['required','email'],
            'password' => ['required','string'],
        ]);

        auth()->shouldUse('customer-api');

        if (!$token = auth('customer-api')->attempt($cred)) {
            return response()->json(['success'=>false,'message'=>'Invalid credentials'], 401);
        }

        /** @var Customer $u */
        $u = auth('customer-api')->user();
        if (!$u->is_active) {
            auth('customer-api')->logout();
            return response()->json([
                'success'=>false,
                'message'=>'Account disabled'
            ], 403);
        }

        return $this->tokenResponse($token);
    }

    // for testing only
    public function me()
    {
        auth()->shouldUse('customer-api');
        return response()->json([
            'success'=>true,
            'data'=>auth('customer-api')->user()
        ]);
    }

    /**
     * Logout.
     */
    public function logout()
    {
        auth()->shouldUse('customer-api');
        auth('customer-api')->logout();
        return response()->json([
            'success'=>true,
            'message'=>'Berhasil logout'
        ]);
    }

    /**
     * Refresh token.
     */
    public function refresh()
    {
        auth()->shouldUse('customer-api');
        return $this->tokenResponse(auth('customer-api')->refresh());
    }

    /**
     * Response token.
     */
    protected function tokenResponse(string $token)
    {
        $guard = auth('customer-api');
        return response()->json([
            'success'      => true,
            'token_type'   => 'Bearer',
            'access_token' => $token,
            'expires_in'   => $guard->factory()->getTTL() * 60,
            'user'         => $guard->user(),
        ]);
    }

    /**
     * Update Profile.
     */
    public function updateProfile(Request $request)
    {
        auth()->shouldUse('customer-api');
        /** @var Customer $u */
        $u = auth('customer-api')->user();

        $data = $request->validate([
            'full_name' => ['sometimes','string','max:100'],
            'email'     => ['sometimes','email','max:100','unique:mst_customers,email,'.$u->id],
            'phone'     => ['sometimes','string','max:30'],
            'company'   => ['sometimes','nullable','string','max:100'],
        ]);

        $u->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil di edit',
            'data'    => $u->only(['id','full_name','email','phone','company','profile_photo']),
        ]);
    }

    /**
     * Update profile photo.
     */
    // multipart/form-data: photo
    public function updateProfilePhoto(Request $request)
    {
        auth()->shouldUse('customer-api');
        /** @var Customer $u */
        $u = auth('customer-api')->user();

        $request->validate([
            'photo' => ['required','image','mimes:jpg,jpeg,png','max:2048'],
        ]);

        if ($u->profile_photo && Str::startsWith($u->profile_photo, 'profile_photos/')) {
            Storage::disk('public')->delete($u->profile_photo);
        }

        $path = $request->file('photo')->store('profile_photos','public');
        $u->profile_photo = $path;
        $u->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil di update',
            'data' => [
                'profile_photo'     => $u->profile_photo,
                'profile_photo_url' => asset('storage/'.$u->profile_photo),
            ],
        ]);
    }

    /**
     * Delete profile photo.
     */
    public function deleteProfilePhoto()
    {
        auth()->shouldUse('customer-api');
        /** @var Customer $u */
        $u = auth('customer-api')->user();

        if ($u->profile_photo && Str::startsWith($u->profile_photo, 'profile_photos/')) {
            Storage::disk('public')->delete($u->profile_photo);
        }
        $u->profile_photo = null;
        $u->save();

        return response()->json(['success'=>true,'message'=>'Foto profil berhasil dihapus']);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request)
    {
        auth()->shouldUse('customer-api');
        /** @var Customer $u */
        $u = auth('customer-api')->user();

        $data = $request->validate([
            'current_password' => ['required','string'],
            'new_password'     => ['required', Password::min(8)->letters()->numbers()],
        ]);

        if (!Hash::check($data['current_password'], $u->password)) {
            return response()->json(['success'=>false,'message'=>'Password lama salah'], 422);
        }

        $u->password = Hash::make($data['new_password']);
        $u->save();

        return response()->json(['success'=>true,'message'=>'Password berhasil diubah']);
    }

    /**
     * Forgot password.
     */
    // ini belum lanjut yak harus email real
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required','email']]);
        $email = strtolower(trim($request->input('email')));

        $exists = Customer::where('email', $email)->exists();
        if ($exists) {
            $plain = Str::random(64);
            $hash  = hash('sha256', $plain);
            \DB::table('customer_password_reset_tokens')->where('email',$email)->delete();
            \DB::table('customer_password_reset_tokens')->insert([
                'email' => $email, 'token' => $hash, 'created_at' => Carbon::now(),
            ]);
            // TODO: kirim email berisi $plain (bukan hash)
            return response()->json(['success'=>true,'message'=>'Reset token generated (check email)','debug_plain_token'=>$plain]);
        }
        return response()->json(['success'=>true,'message'=>'If the email exists, a reset link has been sent']);
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email'        => ['required','email'],
            'token'        => ['required','string'],
            'new_password' => ['required', Password::min(8)->letters()->numbers()],
        ]);

        $rec = \DB::table('customer_password_reset_tokens')->where('email', strtolower(trim($data['email'])))->first();
        if (!$rec || !hash_equals($rec->token, hash('sha256', $data['token']))) {
            return response()->json(['success'=>false,'message'=>'Invalid token'], 422);
        }

        $cust = Customer::where('email', $data['email'])->first();
        if (!$cust) return response()->json(['success'=>false,'message'=>'Akun tidak ditemukan'], 422);

        $cust->password = Hash::make($data['new_password']);
        $cust->save();

        \DB::table('customer_password_reset_tokens')->where('email',$data['email'])->delete();

        return response()->json(['success'=>true,'message'=>'Password berhasil direset']);
    }
}
