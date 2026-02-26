<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostReport;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class ModeratorController extends Controller
{
    public function reportedPosts()
    {
        $posts = Post::query()
            ->whereNull('deleted_at')
            ->whereHas('reports', fn($q) => $q->where('status', 'pending'))
            ->with('user')
            ->withCount(['reports as pending_reports_count' => fn($q) => $q->where('status', 'pending')])
            ->orderByDesc('pending_reports_count')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['posts' => $posts]);
    }

    public function approveDelete(Request $request, Post $post)
    {
        if ($post->deleted_at) {
            return response()->json(['message' => 'Already deleted'], 200);
        }

        $moderator = $request->user();

        $post->deleted_by_user_id = $moderator->id;
        $post->deleted_reason = 'moderator_approved';
        $post->save();
        $post->delete(); // soft delete

        PostReport::where('post_id', $post->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'approved',
                'resolved_by' => $moderator->id,
                'resolved_at' => Carbon::now(),
            ]);

        Cache::increment('posts.index.version');

        return response()->json(['message' => 'Post deleted'], 200);
    }

    public function dismiss(Request $request, Post $post)
    {
        $moderator = $request->user();

        PostReport::where('post_id', $post->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'dismissed',
                'resolved_by' => $moderator->id,
                'resolved_at' => Carbon::now(),
            ]);

        return response()->json(['message' => 'Report dismissed'], 200);
    }
}