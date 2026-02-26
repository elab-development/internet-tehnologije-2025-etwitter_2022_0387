<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\PostReport;

class PostController extends Controller
{
    /**
     * @OA\Get(
     *   path="/api/posts",
     *   summary="Get posts feed (admin: all posts, user: following + own posts)",
     *   tags={"Posts"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="per_page",
     *     in="query",
     *     required=false,
     *     description="Number of items per page (1-100). Default: 10",
     *     @OA\Schema(type="integer", minimum=1, maximum=100),
     *     example=10
     *   ),
     *   @OA\Parameter(
     *     name="page",
     *     in="query",
     *     required=false,
     *     description="Page number. Default: 1",
     *     @OA\Schema(type="integer", minimum=1),
     *     example=1
     *   ),
     *   @OA\Parameter(
     *     name="sort_by",
     *     in="query",
     *     required=false,
     *     description="Sort field (created_at or content). Default: created_at",
     *     @OA\Schema(type="string", enum={"created_at","content"}),
     *     example="created_at"
     *   ),
     *   @OA\Parameter(
     *     name="sort_dir",
     *     in="query",
     *     required=false,
     *     description="Sort direction (asc/desc). Default: desc",
     *     @OA\Schema(type="string", enum={"asc","desc"}),
     *     example="desc"
     *   ),
     *   @OA\Parameter(
     *     name="user_id",
     *     in="query",
     *     required=false,
     *     description="Filter by user id (only allowed if admin or followed user)",
     *     @OA\Schema(type="integer"),
     *     example=5
     *   ),
     *   @OA\Parameter(
     *     name="ttl",
     *     in="query",
     *     required=false,
     *     description="Cache TTL in seconds (5-300). Default: 30",
     *     @OA\Schema(type="integer", minimum=5, maximum=300),
     *     example=30
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="OK",
     *     @OA\JsonContent(
     *       @OA\Property(property="posts", type="array", @OA\Items(type="object")),
     *       @OA\Property(property="per_page", type="integer", example=10),
     *       @OA\Property(property="page", type="integer", example=1),
     *       @OA\Property(property="total", type="integer", example=42)
     *     )
     *   ),
     *   @OA\Response(response=401, description="Unauthorized")
     * )
     */ 
    public function index(Request $request)
    {
        $auth = $request->user();
        if (!$auth) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 10)));
        $page    = max(1, (int) $request->query('page', 1));
        $sortBy  = $request->query('sort_by', 'created_at');
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $userId  = $request->query('user_id');

        $allowedSort = ['created_at', 'content'];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'created_at';
        }

        $ttl = max(5, min(300, (int) $request->query('ttl', 30)));
        $version = Cache::get('posts.index.version', 1);

        $cacheKey = sprintf(
            'posts.index:v%s:u%s:r%s:p%s:pg%s:sb%s:sd%s:f%s',
            $version,
            $auth->id,
            $auth->role,
            $perPage,
            $page,
            $sortBy,
            $sortDir,
            (int) ($userId ?? 0)
        );

        $payload = Cache::remember($cacheKey, now()->addSeconds($ttl), function () use (
            $auth,
            $perPage,
            $page,
            $sortBy,
            $sortDir,
            $userId,
            $request
        ) {
            $q = Post::query()
                ->with(['user'])
                ->withCount('comments');

            // --- LOGIKA VIDLJIVOSTI ---
            if ($auth->isAdmin()) {
                // Admin vidi apsolutno sve
                if ($userId) {
                    $q->where('user_id', (int) $userId);
                }
            } else {
                // Običan user vidi samo one koje prati + svoje objave
                $followingIds = $auth->following()->pluck('users.id')->push($auth->id);
                
                if ($userId) {
                    // Ako traži specifičan profil, proveravamo da li ga prati
                    if ($followingIds->contains((int)$userId)) {
                        $q->where('user_id', (int) $userId);
                    } else {
                        // Ako ne prati tog usera, vraćamo prazan rezultat
                        $q->whereRaw('1 = 0');
                    }
                } else {
                    $q->whereIn('user_id', $followingIds);
                }
            }

            $q->orderBy($sortBy, $sortDir);

            $paginator = $q->paginate($perPage, ['*'], 'page', $page);
            $posts = PostResource::collection($paginator->getCollection())->toArray($request);

            return [
                'posts'    => $posts,
                'per_page' => (int) $paginator->perPage(),
                'page'     => (int) $paginator->currentPage(),
                'total'    => (int) $paginator->total(),
            ];
        });

        return response()->json($payload);
    }

    /**
     * @OA\Post(
     *   path="/api/posts",
     *   summary="Create a post (non-admin only)",
     *   tags={"Posts"},
     *   security={{"bearerAuth":{}}},
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"content"},
     *       @OA\Property(property="content", type="string", maxLength=280, example="Hello!")
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="OK",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Post created successfully"),
     *       @OA\Property(property="post", type="object")
     *     )
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=403, description="Admins cannot create posts"),
     *   @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(Request $request)
    {
        $auth = $request->user();
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot create posts'], 403);
        }

         if (strlen($request->input('content')) > 280) {
            return response()->json([
                'message' => 'The content field must not exceed 280 characters.',
                'errors' => ['content' => ['The content field must not exceed 280 characters.']]
            ], 422);
        }

        $data = $request->validate([
            'content' => ['required', 'string', 'max:280'],
        ]);

        $post = Post::create([
            'user_id' => $auth->id,
            'content' => $data['content'],
        ]);

        Cache::forget('posts.index.version');
        
        return response()->json([
            'message' => 'Post created successfully',
            'post' => new PostResource($post->load('user')->loadCount('comments')),
        ]);
    }

        /**
     * @OA\Put(
     *   path="/api/posts/{post}",
     *   summary="Update a post (owner only, admin forbidden)",
     *   tags={"Posts"},
     *   security={{"bearerAuth":{}}},
     *   @OA\Parameter(
     *     name="post",
     *     in="path",
     *     required=true,
     *     description="Post ID",
     *     @OA\Schema(type="integer"),
     *     example=1
     *   ),
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"content"},
     *       @OA\Property(property="content", type="string", maxLength=280, example="Updated content")
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Updated",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Post updated"),
     *       @OA\Property(property="post", type="object")
     *     )
     *   ),
     *   @OA\Response(response=401, description="Unauthorized"),
     *   @OA\Response(response=403, description="Forbidden"),
     *   @OA\Response(response=404, description="Post not found"),
     *   @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(Request $request, Post $post)
    {
        $auth = $request->user();
        
        // Admin ne može da edituje
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot update posts'], 403);
        }

        if ((int) $post->user_id !== (int) $auth->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['content' => ['required', 'string', 'max:280']]);
        $post->update(['content' => $data['content']]);
        
        Cache::forget('posts.index.version');

        return response()->json(['message' => 'Post updated', 'post' => new PostResource($post)]);
    }

        /**
     * @OA\Delete(
     *   path="/api/posts/{post}",
     *   summary="Delete a post (owner or admin)",
     *   tags={"Posts"},
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
     *     response=200,
     *     description="Post deleted",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Post deleted")
     *     )
     *   ),
     *   @OA\Response(
     *     response=403,
     *     description="Forbidden (not owner and not admin)",
     *     @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Forbidden")
     *     )
     *   ),
     *   @OA\Response(
     *     response=401,
     *     description="Unauthorized"
     *   ),
     *   @OA\Response(
     *     response=404,
     *     description="Post not found"
     *   )
     * )
     */
    public function destroy(Request $request, Post $post)
    {
        $auth = $request->user();

        // Admin MOŽE da briše, ili vlasnik posta
        $canDelete = $auth->isAdmin() || (int) $post->user_id === (int) $auth->id;

        if (!$canDelete) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $post->delete();
        
        // Invalidiraj keš jer se sadržaj promenio
        Cache::increment('posts.index.version');

        return response()->json(['message' => 'Post deleted'], 200);
    }


    public function report(Request $request, Post $post)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    // Admin i moderator obično ne reportuju
    if ($user->role === 'admin' || $user->role === 'moderator') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    // da ne spamuje 100 puta isti user isti post
    $already = PostReport::where('post_id', $post->id)
        ->where('reporter_id', $user->id)
        ->where('status', 'pending')
        ->exists();

    if ($already) {
        return response()->json(['message' => 'Već ste prijavili ovu objavu.'], 409);
    }

    PostReport::create([
        'post_id' => $post->id,
        'reporter_id' => $user->id,
        'status' => 'pending',
    ]);

    return response()->json(['message' => 'Objava je prijavljena.'], 200);
}
}