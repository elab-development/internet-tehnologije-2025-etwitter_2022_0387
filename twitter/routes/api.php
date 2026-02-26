<?php

use App\Http\Controllers\AdminExternalStatsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ModeratorController;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/
Route::get('/stats/tweets-per-user', function () {
    try {
        // PROVERA: Koristimo 'posts' umesto 'tweets' jer se tako zove tvoj resurs
        $stats = DB::table('users')
            ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
            ->select('users.name', DB::raw('count(posts.id) as tweets_count'))
            ->groupBy('users.id', 'users.name')
            ->get();

        $result = [['Korisnik', 'Broj Objava']];

        foreach ($stats as $row) {
            // Dodajemo samo ako korisnik ima bar jednu objavu da grafikon bude zanimljiviji
            $result[] = [$row->name, (int)$row->tweets_count];
        }

        return response()->json($result);

    } catch (\Exception $e) {
        // Ako tabela 'posts' ipak nije pravo ime, ovde ćemo videti šta je problem
        return response()->json([
            ['Greška', 'Poruka'], 
            ['Database Error', 'Proveri naziv tabele u bazi. ' . $e->getMessage()]
        ], 200);
    }
});
Route::get('/team', function () {
        return [
            ['id' => 1, 'name' => 'Nađa Mladenović', 'github' => 'https://github.com/nadjamladenovic'],
            ['id' => 2, 'name' => 'Tara Marković', 'github' => 'https://github.com/TaraMarkovic'],
            ['id' => 3, 'name' => 'Tijana Šikanja', 'github' => 'https://github.com/TijanaSikanja'],
        ];
    });

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    $user = $request->user();
    
    // Ručno dodajemo brojke u odgovor
    $user->following_count = $user->following()->count();
    $user->followers_count = $user->followers()->count();
    
    return $user;
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/users/search', [AuthController::class, 'searchUsers']);
    
    Route::get('/follows', [FollowController::class, 'index']);
    Route::get('/users/{user}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{user}/following', [FollowController::class, 'following']);
    Route::post('/users/{user}/follow', [FollowController::class, 'follow']);
    Route::delete('/users/{user}/follow', [FollowController::class, 'unfollow']);
    Route::get('/users/{user}/follow-status', [FollowController::class, 'status']);

    Route::resource('posts', PostController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);

    Route::resource('comments', CommentController::class)
        ->only(['index', 'store', 'update', 'destroy']);


    Route::post('/posts/{post}/like', [LikeController::class, 'store']);
    //Route::delete('/posts/{post}/like', [LikeController::class, 'destroy']);

    Route::get('/admin/stats/hn-tags', [AdminExternalStatsController::class, 'hnPopularKeywords']);
    Route::get('/admin/stats/guardian-tags', [AdminExternalStatsController::class, 'guardianPopularTags']);

    // Report post
    Route::post('/posts/{post}/report', [PostController::class, 'report']);

    // Moderator routes
    Route::middleware(['role:moderator'])->group(function () {
        Route::get('/moderator/reported-posts', [ModeratorController::class, 'reportedPosts']);
        Route::post('/moderator/posts/{post}/approve-delete', [ModeratorController::class, 'approveDelete']);
        Route::post('/moderator/posts/{post}/dismiss', [ModeratorController::class, 'dismiss']);
    });

    
    
});
