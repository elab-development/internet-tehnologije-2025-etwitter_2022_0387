<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\UserMiniResource;


class AuthController extends Controller
{
    /**
 * @OA\Post(
 *   path="/api/register",
 *   summary="Register a new user",
 *   tags={"Auth"},
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(
 *       required={"name","email","password"},
 *       @OA\Property(property="name", type="string", example="Tijana Šikanja"),
 *       @OA\Property(property="email", type="string", example="tijana@example.com"),
 *       @OA\Property(property="password", type="string", minLength=8, example="secret123"),
 *       @OA\Property(property="bio", type="string", nullable=true, example="Hi! I like Laravel.")
 *     )
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="Registered successfully (token returned)",
 *     @OA\JsonContent(
 *       @OA\Property(property="data", type="object"),
 *       @OA\Property(property="access_token", type="string", example="1|someSanctumTokenHere"),
 *       @OA\Property(property="token_type", type="string", example="Bearer")
 *     )
 *   ),
 *   @OA\Response(
 *     response=422,
 *     description="Validation error",
 *     @OA\JsonContent(type="object")
 *   )
 * )
 */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|max:255|email|unique:users',
            'password' => 'required|string|min:8',
            'bio'=>'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'bio'=>$request->bio,

        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }
/**
 * @OA\Post(
 *   path="/api/login",
 *   summary="Login and get access token",
 *   tags={"Auth"},
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(
 *       required={"email","password"},
 *       @OA\Property(property="email", type="string", example="tijana@example.com"),
 *       @OA\Property(property="password", type="string", example="secret123")
 *     )
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="Logged in (token returned)",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Tijana logged in"),
 *       @OA\Property(property="access_token", type="string", example="1|someSanctumTokenHere"),
 *       @OA\Property(property="token_type", type="string", example="Bearer")
 *     )
 *   ),
 *   @OA\Response(
 *     response=401,
 *     description="Wrong credentials",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Wrong credentials")
 *     )
 *   )
 * )
 */
    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Wrong credentials'], 401);
        }

        $user = User::where('email', $request['email'])->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => $user->name . ' logged in',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }
/**
 * @OA\Post(
 *   path="/api/logout",
 *   summary="Logout (revoke current token)",
 *   tags={"Auth"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Response(
 *     response=200,
 *     description="Logged out",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="You have successfully logged out.")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized")
 * )
 */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return [
            'message' => 'You have successfully logged out.'
        ];
    }

    /**
 * @OA\Get(
 *   path="/api/users/search",
 *   summary="Search users by name (excluding current user)",
 *   tags={"Users"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="query",
 *     in="query",
 *     required=false,
 *     description="Search query (part of name)",
 *     @OA\Schema(type="string"),
 *     example="Tijana"
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(type="array", @OA\Items(type="object"))
 *   ),
 *   @OA\Response(response=401, description="Unauthorized")
 * )
 */
    public function searchUsers(Request $request)
    {
        $query = $request->query('query', '');

        $users = User::query()
            ->where('name', 'LIKE', "%{$query}%")
            ->where('id', '!=', auth()->id())
            ->get();

        return UserMiniResource::collection($users);
    }
}
