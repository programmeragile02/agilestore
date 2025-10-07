<?php

namespace App\Http\Controllers;

use App\Mail\CustomerPasswordResetCodeMail;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Google\Client as GoogleClient;

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
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required','email']]);
        $email = strtolower(trim($request->input('email')));

        $cust = Customer::where('email', $email)->first();

        // SELALU balas sukses, tanpa bocorkan akun ada/tidak
        if ($cust) {
            // Anti-spam: kalau masih ada token yang dibuat < 60 detik, jangan kirim baru
            $existing = DB::table('customer_password_reset_tokens')->where('email',$email)->first();
            if ($existing && now()->diffInSeconds(Carbon::parse($existing->created_at)) < 60) {
                return response()->json([
                    'success' => true,
                    'message' => 'If the email exists, a reset code has been sent'
                ]);
            }

            // Kode 6 digit dengan nol di depan bila perlu
            $plain = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $hash  = hash('sha256', $plain);

            DB::table('customer_password_reset_tokens')->where('email', $email)->delete();
            DB::table('customer_password_reset_tokens')->insert([
                'email'      => $email,
                'token'      => $hash,
                'attempts'   => 0,
                'created_at' => now(),
                'expires_at' => now()->addMinutes(15),
            ]);

            // KIRIM EMAIL
            Mail::to($email)->send(new CustomerPasswordResetCodeMail(
                fullName: $cust->full_name ?? $email,
                code: $plain,
                minutes: 15
            ));
            \Log::info('RESET_CODE', ['email'=>$email,'code'=>$plain]); // dev only
        }

        return response()->json([
            'success' => true,
            'message' => 'If the email exists, a reset code has been sent'
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email'        => ['required','email'],
            'token'        => ['required','string','size:6'], // 6 digit
            'new_password' => ['required', Password::min(8)->letters()->numbers()],
        ]);

        $email = strtolower(trim($data['email']));
        $rec = DB::table('customer_password_reset_tokens')->where('email',$email)->first();

        if (!$rec) {
            return response()->json(['success'=>false,'message'=>'Invalid code'], 422);
        }

        // expired?
        if ($rec->expires_at && now()->greaterThan($rec->expires_at)) {
            DB::table('customer_password_reset_tokens')->where('email',$email)->delete();
            return response()->json(['success'=>false,'message'=>'Code expired'], 422);
        }

        // Terlalu banyak percobaan?
        if (($rec->attempts ?? 0) >= 5) {
            DB::table('customer_password_reset_tokens')->where('email',$email)->delete();
            return response()->json(['success'=>false,'message'=>'Too many attempts. Request a new code'], 422);
        }

        // cocokkan SHA-256
        if (!hash_equals($rec->token, hash('sha256', $data['token']))) {
            DB::table('customer_password_reset_tokens')
                ->where('email',$email)
                ->update(['attempts' => DB::raw('attempts + 1')]);
            return response()->json(['success'=>false,'message'=>'Invalid code'], 422);
        }

        $cust = Customer::where('email', $email)->first();
        if (!$cust) {
            return response()->json(['success'=>false,'message'=>'Account not found'], 422);
        }

        $cust->password = Hash::make($data['new_password']);
        $cust->save();

        DB::table('customer_password_reset_tokens')->where('email',$email)->delete();

        return response()->json(['success'=>true,'message'=>'Password reset successfully']);
    }

    // OAuth Login With Google
    public function google(Request $request)
    {
        $data = $request->validate([
            'id_token' => ['required','string'],
        ]);

        $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($data['id_token']);
        if (!$payload) {
            return response()->json(['success'=>false,'message'=>'Invalid Google token'], 401);
        }

        $googleId = $payload['sub'] ?? null;
        $email    = strtolower(trim($payload['email'] ?? ''));
        $name     = $payload['name'] ?? null;
        $avatar   = $payload['picture'] ?? null;
        $verified = ($payload['email_verified'] ?? false) ? now() : null;

        if (!$googleId || !$email) {
            return response()->json(['success'=>false,'message'=>'Incomplete Google profile'], 422);
        }

        // 1) by google_id → 2) fallback by email (link akun lama)
        /** @var Customer|null $cust */
        $cust = Customer::where('google_id',$googleId)->first()
            ?: Customer::where('email',$email)->first();

        if (!$cust) {
            $cust = Customer::create([
                'google_id'          => $googleId,
                'provider'           => 'google',
                'provider_avatar_url'=> $avatar,
                'full_name'          => $name ?: $email,
                'email'              => $email,
                'phone'              => '62',
                'company'            => null,
                'password'           => Hash::make(Str::random(40)), // dummy kuat
                'email_verified_at'  => $verified,
                'is_active'          => true,
            ]);
        } else {
            if (!$cust->google_id) $cust->google_id = $googleId;
            if ($avatar && !$cust->provider_avatar_url) $cust->provider_avatar_url = $avatar;
            if ($name && $cust->full_name !== $name) $cust->full_name = $name;
            if (!$cust->email_verified_at && $verified) $cust->email_verified_at = $verified;
            if (!$cust->provider) $cust->provider = 'google';
            $cust->save();
        }

        if (!$cust->is_active) {
            return response()->json(['success'=>false,'message'=>'Account disabled'], 403);
        }

        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        auth()->shouldUse('customer-api');
        $token = auth('customer-api')->login($cust);

        return $this->tokenResponse($token); // sudah ada di controllermu
    }
}
