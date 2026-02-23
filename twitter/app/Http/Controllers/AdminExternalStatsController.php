<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AdminExternalStatsController extends Controller
{

    private function ensureAdmin(Request $request)
    {
        $auth = $request->user();
        if (!$auth) {
            abort(response()->json(['message' => 'Unauthorized'], 401));
        }
        if (!$auth->isAdmin()) {
            abort(response()->json(['message' => 'Forbidden'], 403));
        }
    }


    /**
 * @OA\Get(
 *   path="/api/admin/stats/hn-tags",
 *   summary="HN Algolia: popular keywords from recent high-scoring stories (admin only)",
 *   tags={"Admin Stats"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="hours",
 *     in="query",
 *     required=false,
 *     description="Lookback window in hours (1-72). Default: 24",
 *     @OA\Schema(type="integer", minimum=1, maximum=72),
 *     example=24
 *   ),
 *   @OA\Parameter(
 *     name="min_points",
 *     in="query",
 *     required=false,
 *     description="Minimum story points. Default: 50",
 *     @OA\Schema(type="integer", minimum=0),
 *     example=50
 *   ),
 *   @OA\Parameter(
 *     name="pages",
 *     in="query",
 *     required=false,
 *     description="Number of pages to fetch (1-5). Default: 2",
 *     @OA\Schema(type="integer", minimum=1, maximum=5),
 *     example=2
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(
 *       @OA\Property(property="window_hours", type="integer", example=24),
 *       @OA\Property(property="min_points", type="integer", example=50),
 *       @OA\Property(property="stories_seen", type="integer", example=120),
 *       @OA\Property(
 *         property="popular_tags",
 *         type="array",
 *         @OA\Items(
 *           type="object",
 *           @OA\Property(property="tag", type="string", example="#ai"),
 *           @OA\Property(property="word", type="string", example="ai"),
 *           @OA\Property(property="count", type="integer", example=9)
 *         )
 *       )
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Forbidden (admin only)"),
 *   @OA\Response(response=502, description="HN Algolia error")
 * )
 */
    public function hnPopularKeywords(Request $request)
    {
        $this->ensureAdmin($request);

        $hours = max(1, min(72, (int)$request->query('hours', 24)));
        $minPoints = max(0, (int)$request->query('min_points', 50));
        $pages = max(1, min(5, (int)$request->query('pages', 2)));
        $hitsPer = 100;

        $since = now()->subHours($hours)->timestamp;
        $stop = collect([
            'the',
            'a',
            'an',
            'and',
            'or',
            'for',
            'to',
            'of',
            'in',
            'on',
            'at',
            'by',
            'is',
            'are',
            'be',
            'with',
            'from',
            'this',
            'that',
            'into',
            'it',
            'its',
            'as',
            'we',
            'you',
            'i',
            'your',
            'our',
            'their',
            'about',
            'how',
            'why',
            'what',
            'when',
            'where',
            'who'
        ]);

        $keywords = [];
        $fetched = 0;

        for ($page = 0; $page < $pages; $page++) {
            $resp = Http::get('https://hn.algolia.com/api/v1/search_by_date', [
                'tags' => 'story',
                'hitsPerPage' => $hitsPer,
                'page' => $page,
                'numericFilters' => "created_at_i>{$since},points>={$minPoints}",
            ]);

            if (!$resp->ok()) {
                return response()->json(['message' => 'HN Algolia error', 'status' => $resp->status()], 502);
            }

            foreach ((array)$resp->json('hits') as $hit) {
                $title = (string)($hit['title'] ?? '');
                if ($title === '') continue;
                $fetched++;

                $tokens = preg_split('/[^A-Za-z0-9]+/', strtolower($title), -1, PREG_SPLIT_NO_EMPTY);
                foreach ($tokens as $t) {
                    if (strlen($t) < 3) continue;
                    if ($stop->contains($t)) continue;
                    $keywords[$t] = ($keywords[$t] ?? 0) + 1;
                }
            }
        }

        arsort($keywords);
        $top = collect($keywords)->take(50)->map(function ($count, $word) {
            return ['tag' => "#" . preg_replace('/[^A-Za-z0-9]+/', '', $word), 'word' => $word, 'count' => $count];
        })->values()->all();

        return response()->json([
            'window_hours' => $hours,
            'min_points' => $minPoints,
            'stories_seen' => $fetched,
            'popular_tags' => $top,
        ]);
    }

    /**
 * @OA\Get(
 *   path="/api/admin/stats/guardian-tags",
 *   summary="Guardian API: popular keyword tags from news search (admin only)",
 *   tags={"Admin Stats"},
 *   security={{"bearerAuth":{}}},
 *   @OA\Parameter(
 *     name="q",
 *     in="query",
 *     required=false,
 *     description="Search query term (optional)",
 *     @OA\Schema(type="string"),
 *     example="technology"
 *   ),
 *   @OA\Parameter(
 *     name="from",
 *     in="query",
 *     required=false,
 *     description="From date (YYYY-MM-DD). Default: 7 days ago",
 *     @OA\Schema(type="string", format="date"),
 *     example="2026-02-16"
 *   ),
 *   @OA\Parameter(
 *     name="to",
 *     in="query",
 *     required=false,
 *     description="To date (YYYY-MM-DD). Default: today",
 *     @OA\Schema(type="string", format="date"),
 *     example="2026-02-23"
 *   ),
 *   @OA\Parameter(
 *     name="pages",
 *     in="query",
 *     required=false,
 *     description="Number of pages to fetch (1-5). Default: 2",
 *     @OA\Schema(type="integer", minimum=1, maximum=5),
 *     example=2
 *   ),
 *   @OA\Response(
 *     response=200,
 *     description="OK",
 *     @OA\JsonContent(
 *       @OA\Property(property="query", type="string", nullable=true, example="technology"),
 *       @OA\Property(property="from", type="string", format="date", example="2026-02-16"),
 *       @OA\Property(property="to", type="string", format="date", example="2026-02-23"),
 *       @OA\Property(property="articles_seen", type="integer", example=75),
 *       @OA\Property(
 *         property="tags",
 *         type="array",
 *         @OA\Items(
 *           type="object",
 *           @OA\Property(property="id", type="string", example="technology/artificialintelligence"),
 *           @OA\Property(property="title", type="string", example="Artificial intelligence (AI)"),
 *           @OA\Property(property="count", type="integer", example=12)
 *         )
 *       )
 *     )
 *   ),
 *   @OA\Response(response=401, description="Unauthorized"),
 *   @OA\Response(response=403, description="Forbidden (admin only)"),
 *   @OA\Response(response=500, description="Missing Guardian API key"),
 *   @OA\Response(response=502, description="Guardian API error")
 * )
 */
    public function guardianPopularTags(Request $request)
    {
        $this->ensureAdmin($request);

        $apiKey = config('services.guardian.key') ?: env('GUARDIAN_API_KEY');
        if (!$apiKey) {
            return response()->json(['message' => 'Missing Guardian API key'], 500);
        }

        $q   = $request->query('q');
        $from  = $request->query('from', now()->subDays(7)->toDateString());
        $to   = $request->query('to', now()->toDateString());
        $pages   = max(1, min(5, (int) $request->query('pages', 2)));
        $pageSz  = 50;

        $tagCounts = [];
        $fetched   = 0;

        for ($page = 1; $page <= $pages; $page++) {
            $resp = Http::get('https://content.guardianapis.com/search', [
                'q' => $q,
                'from-date' => $from,
                'to-date' => $to,
                'order-by' => 'newest',
                'page-size' => $pageSz,
                'page' => $page,
                'show-tags' => 'keyword',
                'api-key' => $apiKey,
            ]);

            if (!$resp->ok()) {
                return response()->json([
                    'message' => 'Guardian API error',
                    'status' => $resp->status(),
                ], 502);
            }

            $json = $resp->json();
            $results = data_get($json, 'response.results', []);
            $fetched += count($results);

            foreach ($results as $item) {
                foreach ($item['tags'] ?? [] as $tag) {
                    if (($tag['type'] ?? '') !== 'keyword') continue;
                    $id    = $tag['id'] ?? null;
                    $title = $tag['webTitle'] ?? null;
                    if (!$id || !$title) continue;

                    if (!isset($tagCounts[$id])) {
                        $tagCounts[$id] = ['id' => $id, 'title' => $title, 'count' => 0];
                    }
                    $tagCounts[$id]['count']++;
                }
            }
            $current = data_get($json, 'response.currentPage', $page);
            $pagesTotal = data_get($json, 'response.pages', $page);
            if ($current >= $pagesTotal) break;
        }

        $popular = collect($tagCounts)
            ->sortByDesc('count')
            ->values()
            ->all();

        return response()->json([
            'query' => $q,
            'from' => $from,
            'to' => $to,
            'articles_seen' => $fetched,
            'tags' => $popular,
        ]);
    }
}
