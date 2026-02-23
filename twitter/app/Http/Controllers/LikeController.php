<?php

namespace App\Http\Controllers;
use OpenApi\Annotations as OA;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
 * @OA\Post(
 *   path="/api/posts/{post}/like",
 *   summary="Toggle like on a post (like/unlike)",
 *   tags={"Likes"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="post",
 *     in="path",
 *     required=true,
 *     description="Post ID",
 *     @OA\Schema(type="integer"),
 *     example=1
 *   ),
 *   @OA\Response(
 *     response=201,
 *     description="Post liked",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Post lajkovan")
 *     )
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="Like removed",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Lajk uklonjen")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=404, description="Post not found")
 * )
 */
    public function store(Post $post)
    {
        $like = Like::where('user_id', auth()->id())
                ->where('post_id', $post->id)
                ->first();

    if ($like) {
        // Ako postoji like ukloni ga
        $like->delete();

        return response()->json([
            'message' => 'Lajk uklonjen'
        ]);
    } else {
        // Ako ne postoji napravi novi
        Like::create([
            'user_id' => auth()->id(),
            'post_id' => $post->id
        ]);

        return response()->json([
            'message' => 'Post lajkovan'
        ], 201);
    }
}
}