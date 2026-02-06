<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;

class LikeController extends Controller
{
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