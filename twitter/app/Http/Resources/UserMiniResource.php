<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserMiniResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
       $auth = $request->user();

    $isFollowing = false;

    if ($auth && !$auth->isAdmin()) {
        // ne pratimo sebe + ne pratimo admina (po pravilima koje već imaš u FollowController)
        if ((int) $auth->id !== (int) $this->id && $this->role !== 'admin') {
            $isFollowing = $auth->isFollowing($this->resource);
        }
    }

    return [
        'id' => $this->id,
        'name' => $this->name,
        'role' => $this->role,
        'is_following' => $isFollowing,
    ];
    }
}
