<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Post $post)
    {
        Like::firstOrCreate([
            'user_id' => auth()->id(),
            'post_id' => $post->id
        ]);

        return response()->json([
            'message' => 'Post lajkovan'
        ], 201);
    }

    public function destroy(Post $post)
    {
        Like::where('user_id', auth()->id())
            ->where('post_id', $post->id)
            ->delete();

        return response()->json([
            'message' => 'Lajk uklonjen'
        ]);
    }
}
