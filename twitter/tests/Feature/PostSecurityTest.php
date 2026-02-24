<?php


namespace Tests\Feature;


use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;


class PostSecurityTest extends TestCase
{
    use RefreshDatabase;


    public function test_authenticated_user_can_create_post()
    {
        $user = User::factory()->create();


        $response = $this->actingAs($user)->postJson('/api/posts', [
            'content' => 'Ovo je test sadržaj za automatizovani test.'
        ]);


        $response->assertStatus(200);
       
        $this->assertDatabaseHas('posts', [
            'content' => 'Ovo je test sadržaj za automatizovani test.',
            'user_id' => $user->id
        ]);
    }


    public function test_user_cannot_delete_someone_elses_post()
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();


        $postByB = Post::create([
            'user_id' => $userB->id,
            'content' => 'Ovo je post koji pripada korisniku B'
        ]);


        $response = $this->actingAs($userA)->deleteJson("/api/posts/{$postByB->id}");


        $response->assertStatus(403);
       
        $this->assertDatabaseHas('posts', ['id' => $postByB->id]);
    }


    public function test_post_content_must_not_exceed_280_characters()
    {
        $user = User::factory()->create();
        $tooLongContent = str_repeat('a', 281);


        $response = $this->actingAs($user)->postJson('/api/posts', [
            'content' => $tooLongContent
        ]);


        $response->assertStatus(422);
    }
}


