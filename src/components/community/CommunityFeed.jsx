import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, Trophy, Zap, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const POST_TYPE_BADGE = {
  win: { label: '🏆 Win', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  milestone: { label: '⭐ Milestone', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  challenge_update: { label: '⚡ Challenge', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  post: null,
};

function PostCard({ post, currentUserId }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.PostComment.filter({ post_id: post.id }, 'created_date'),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () => {
      const likes = post.likes || [];
      const hasLiked = likes.includes(currentUserId);
      const updated = hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId];
      return base44.entities.CommunityPost.update(post.id, { likes: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => base44.entities.PostComment.create({ post_id: post.id, author_id: currentUserId, author_name: 'You', content: comment }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', post.id] }); setComment(''); },
  });

  const liked = (post.likes || []).includes(currentUserId);
  const badge = POST_TYPE_BADGE[post.type];

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 space-y-3 shadow-sm">
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
          {post.author_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{post.author_name}</p>
            {badge && <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", badge.class)}>{badge.label}</span>}
          </div>
          <p className="text-[11px] text-[#374151]">{formatDistanceToNow(new Date(post.created_date || Date.now()), { addSuffix: true })}</p>
        </div>
      </div>
      {/* Content */}
      <p className="text-sm leading-relaxed">{post.content}</p>
      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => likeMutation.mutate()} className={cn("flex items-center gap-1.5 text-xs transition-colors", liked ? "text-red-400" : "text-muted-foreground hover:text-red-400")}>
          <Heart className={cn("w-4 h-4", liked && "fill-red-400")} />
          {(post.likes || []).length || ''}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs text-[#374151] hover:text-[#1F2A44] transition-colors">
          <MessageCircle className="w-4 h-4" />
          {comments.length > 0 ? comments.length : 'Reply'}
        </button>
      </div>
      {/* Comments */}
      {showComments && (
        <div className="space-y-2 pt-2 border-t border-[#E7EAF3]">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EEF4FF] text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{c.author_name?.[0]?.toUpperCase()}</div>
              <div className="flex-1 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-3 py-1.5">
                <p className="text-xs font-semibold">{c.author_name}</p>
                <p className="text-xs">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && commentMutation.mutate()} className="flex-1 text-xs bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-3 py-1.5 outline-none focus:border-primary transition-colors text-[#1F2A44]" />
            <button onClick={() => commentMutation.mutate()} disabled={!comment.trim()} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-40">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityFeed({ currentUser }) {
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('post');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  const createPost = useMutation({
    mutationFn: () => base44.entities.CommunityPost.create({
      author_id: currentUser?.id || 'anonymous',
      author_name: currentUser?.full_name || 'Anonymous',
      content: newPost,
      type: postType,
      likes: [],
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['community-posts'] }); setNewPost(''); setPostType('post'); },
  });

  return (
    <div className="space-y-4">
      {/* Compose */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex gap-2 mb-2">
          {[{ key: 'post', label: '💬 Post' }, { key: 'win', label: '🏆 Win' }, { key: 'milestone', label: '⭐ Milestone' }].map(t => (
            <button key={t.key} onClick={() => setPostType(t.key)} className={cn("text-xs px-3 py-1 rounded-full border transition-all", postType === t.key ? "border-primary bg-[#EEF4FF] text-primary" : "border-[#E7EAF3] text-[#374151] hover:border-primary/40")}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={postType === 'win' ? "Share a win with the community! 🎉" : postType === 'milestone' ? "Celebrate a milestone..." : "What's on your mind?"} rows={2} className="w-full text-sm bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-3 py-2 outline-none focus:border-primary resize-none transition-colors placeholder:text-[#374151]/60 text-[#1F2A44]" />
        <div className="flex justify-end">
          <Button size="sm" disabled={!newPost.trim()} onClick={() => createPost.mutate()} className="h-8 text-xs">Post</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-[#374151] text-sm">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />)
      )}
    </div>
  );
}