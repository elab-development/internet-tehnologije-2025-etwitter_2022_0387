<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;
use App\Http\Resources\FollowResource;
use App\Http\Resources\UserMiniResource;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;

class FollowController extends Controller
{
        /**
     * @OA\Get(
     *   path="/api/follows",
     *   summary="List follow relations (admin only)",
     *   tags={"Follows"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="follower_id",
     *     in="query",
     *     required=false,
     *     description="Filter by follower user id",
     *     @OA\Schema(type="integer"),
     *     example=1
     *   ),
     *   @OA\Parameter(
     *     name="following_id",
     *     in="query",
     *     required=false,
     *     description="Filter by following user id",
     *     @OA\Schema(type="integer"),
     *     example=2
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="OK",
     *     @OA\JsonContent(type="array", @OA\Items(type="object"))
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=403, description="Forbidden (admin only)")
     * )
     */
    public function index(Request $request)
    {
        $auth = $request->user();
        if (!$auth || !$auth->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $follows = Follow::with(['follower', 'following'])
            ->when($request->filled('follower_id'), fn($q) =>
            $q->where('follower_id', (int) $request->input('follower_id')))
            ->when($request->filled('following_id'), fn($q) =>
            $q->where('following_id', (int) $request->input('following_id')))
            ->orderByDesc('id')
            ->get();

        return  FollowResource::collection($follows);
    }
        /**
     * @OA\Get(
     *   path="/api/users/{user}/followers",
     *   summary="Get followers of a user",
     *   tags={"Follows"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="user",
     *     in="path",
     *     required=true,
     *     description="User ID",
     *     @OA\Schema(type="integer"),
     *     example=5
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="OK",
     *     @OA\JsonContent(type="array", @OA\Items(type="object"))
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=404, description="User not found")
     * )
     */
    public function followers(User $user)
    {
        $followers = $user->followers()->get();
        return UserMiniResource::collection($followers);
    }
    /**
     * @OA\Get(
     *   path="/api/users/{user}/following",
     *   summary="Get users that a user is following",
     *   tags={"Follows"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="user",
     *     in="path",
     *     required=true,
     *     description="User ID",
     *     @OA\Schema(type="integer"),
     *     example=5
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="OK",
     *     @OA\JsonContent(type="array", @OA\Items(type="object"))
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=404, description="User not found")
     * )
     */
    public function following(User $user)
    {
        $following = $user->following()->get();
        return UserMiniResource::collection($following);
    }
    /**
     * @OA\Post(
     *   path="/api/users/{user}/follow",
     *   summary="Follow a user",
     *   tags={"Follows"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="user",
     *     in="path",
     *     required=true,
     *     description="User ID to follow",
     *     @OA\Schema(type="integer"),
     *     example=10
     *   ),
     *   @OA\Response(
     *     response=201,
     *     description="Followed",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Followed"),
     *       @OA\Property(property="follow", type="object")
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Already following",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Already following"),
     *       @OA\Property(property="follow", type="object")
     *     )
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=403, description="Admins cannot follow users / cannot follow admin accounts"),
     *   @OA\Response(response=422, description="You cannot follow yourself"),
     *   @OA\Response(response=404, description="User not found")
     * )
     */
    public function follow(Request $request, User $user)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot follow users'], 403);
        }

        if ((int) $auth->id === (int) $user->id) {
            return response()->json(['message' => 'You cannot follow yourself'], 422);
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'You cannot follow admin accounts'], 403);
        }

        $follow = Follow::firstOrCreate([
            'follower_id'  => $auth->id,
            'following_id' => $user->id,
        ]);

        $follow->load(['follower', 'following']);

        return response()->json([
            'message' => $follow->wasRecentlyCreated ? 'Followed' : 'Already following',
            'follow'  => new FollowResource($follow),
        ], $follow->wasRecentlyCreated ? 201 : 200);
    }
    /**
 * @OA\Delete(
 *   path="/api/users/{user}/follow",
 *   summary="Unfollow a user",
 *   tags={"Follows"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="user",
 *     in="path",
 *     required=true,
 *     description="User ID to unfollow",
 *     @OA\Schema(type="integer"),
 *     example=10
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Unfollowed")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Admins cannot unfollow users / cannot unfollow admin accounts"),
 *   @OA\Response(response=422, description="You cannot unfollow yourself"),
 *   @OA\Response(response=404, description="User not found")
 * )
 */
    public function unfollow(Request $request, User $user)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot unfollow users'], 403);
        }
        if ((int) $auth->id === (int) $user->id) {
        return response()->json(['message' => 'You cannot unfollow yourself'], 422);
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'You cannot unfollow admin accounts'], 403);
        }

        $deleted = Follow::where('follower_id', $auth->id)
            ->where('following_id', $user->id)
            ->delete();

        return response()->json([
            'message' => $deleted ? 'Unfollowed' : 'Not following',
        ], 200);
    }
/**
 * @OA\Get(
 *   path="/api/users/{user}/follow-status",
 *   summary="Check if authenticated user is following the given user",
 *   tags={"Follows"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="user",
 *     in="path",
 *     required=true,
 *     description="User ID",
 *     @OA\Schema(type="integer"),
 *     example=10
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(
 *       @OA\Property(property="user_id", type="integer", example=10),
 *       @OA\Property(property="is_following", type="boolean", example=true)
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Admins cannot follow anyone"),
 *   @OA\Response(response=404, description="User not found")
 * )
 */
    public function status(Request $request, User $user)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($auth->isAdmin()) {
            return response()->json(['message' => 'You cannot follow anyone'], 403);
        }

        return response()->json([
            'user_id'      => $user->id,
            'is_following' => $auth->isFollowing($user),
        ]);
    }
}
