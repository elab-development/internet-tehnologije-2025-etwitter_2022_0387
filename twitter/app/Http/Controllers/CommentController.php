<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
 * @OA\Get(
 *   path="/api/comments",
 *   summary="List comments for a post",
 *   tags={"Comments"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="post_id",
 *     in="query",
 *     required=true,
 *     description="Post ID (required)",
 *     @OA\Schema(type="integer", minimum=1),
 *     example=1
 *   ),
 *   @OA\Parameter(
 *     name="q",
 *     in="query",
 *     required=false,
 *     description="Search in comment content or user (name/email)",
 *     @OA\Schema(type="string"),
 *     example="hello"
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(
 *       @OA\Property(
 *         property="comments",
 *         type="array",
 *         @OA\Items(type="object")
 *       )
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(
 *     response=422,
 *     description="post_id is required",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="post_id is required")
 *     )
 *   ),
 *   @OA\Response(
 *     response=404,
 *     description="Post not found",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Post not found")
 *     )
 *   )
 * )
 */
    public function index(Request $request)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $postId = (int) $request->query('post_id', 0);
        if ($postId <= 0) {
            return response()->json(['message' => 'post_id is required'], 422);
        }

        if (!Post::whereKey($postId)->exists()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $search = trim((string) $request->query('q', ''));

        $q = Comment::query()
            ->where('post_id', $postId)
            ->with('user');

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('content', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $comments = $q->orderByDesc('id')
            ->get()
            ->map(fn($c) => (new CommentResource($c))->toArray($request))
            ->all();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

   /**
 * @OA\Post(
 *   path="/api/comments",
 *   summary="Create a comment (non-admin only)",
 *   tags={"Comments"},
 *   security={{"bearerAuth":{}}},
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(
 *       required={"post_id","content"},
 *       @OA\Property(property="post_id", type="integer", example=1),
 *       @OA\Property(property="content", type="string", maxLength=280, example="Nice post!")
 *     )
 *   ),
 *   @OA\Response(
 *     response=201,
 *     description="Created",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Comment created successfully"),
 *       @OA\Property(property="comment", type="object")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Admins cannot create comments"),
 *   @OA\Response(response=422, description="Validation error")
 * )
 */
    public function store(Request $request)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot create comments'], 403);
        }

        $data = $request->validate([
            'post_id' => ['required', 'integer', 'exists:posts,id'],
            'content' => ['required', 'string', 'max:280'],
        ]);

        $comment = Comment::create([
            'user_id' => $auth->id,
            'post_id' => $data['post_id'],
            'content' => $data['content'],
        ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => new CommentResource($comment),
        ], 201);
    }


    /**
     * Display the specified resource.
     */
    public function show(Comment $comment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Comment $comment)
    {
        //
    }

    /**
 * @OA\Put(
 *   path="/api/comments/{comment}",
 *   summary="Update a comment (owner only, admin forbidden)",
 *   tags={"Comments"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="comment",
 *     in="path",
 *     required=true,
 *     description="Comment ID",
 *     @OA\Schema(type="integer"),
 *     example=1
 *   ),
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(
 *       required={"content"},
 *       @OA\Property(property="content", type="string", maxLength=280, example="Updated comment")
 *     )
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="Updated",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Comment updated successfully"),
 *       @OA\Property(property="comment", type="object")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Forbidden / Admins cannot update comments"),
 *   @OA\Response(response=404, description="Comment not found"),
 *   @OA\Response(response=422, description="Validation error")
 * )
 */
    public function update(Request $request, Comment $comment)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot update comments'], 403);
        }
        if ((int) $comment->user_id !== (int) $auth->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'content' => ['required', 'string', 'max:280'],
        ]);

        $comment->update([
            'content' => $data['content'],
        ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => new CommentResource($comment),
        ]);
    }

    /**
 * @OA\Delete(
 *   path="/api/comments/{comment}",
 *   summary="Delete a comment (owner only, admin forbidden)",
 *   tags={"Comments"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="comment",
 *     in="path",
 *     required=true,
 *     description="Comment ID",
 *     @OA\Schema(type="integer"),
 *     example=1
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="Deleted",
 *     @OA\JsonContent(
 *       @OA\Property(property="message", type="string", example="Comment deleted")
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Forbidden / Admins cannot delete comments"),
 *   @OA\Response(response=404, description="Comment not found")
 * )
 */
    public function destroy(Request $request, Comment $comment)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot delete comments'], 403);
        }
        if ((int) $comment->user_id !== (int) $auth->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted',
        ], 200);
    }
}
