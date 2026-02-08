<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
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
     * Store a newly created resource.
     */
    public function store(Request $request)
    {
        $auth = $request->user();
        if ($auth->isAdmin()) {
            return response()->json(['message' => 'Admins cannot create posts'], 403);
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
     * Update the specified resource.
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
     * Remove the specified resource.
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
}