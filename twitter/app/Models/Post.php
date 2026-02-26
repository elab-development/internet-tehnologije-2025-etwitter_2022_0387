<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PostReport;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'content',
        'deleted_by_user_id',
        'deleted_reason',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
    public function likes()
    {
    return $this->hasMany(Like::class);
    }
    public function reports(): HasMany
    {
        return $this->hasMany(PostReport::class);
    }
    public function deletedBy(): BelongsTo{
        return $this->belongsTo(User::class, 'deleted_by_user_id');
    }
    public function deleter(): BelongsTo
    {
    return $this->belongsTo(User::class, 'deleted_by_user_id');
    }
}
