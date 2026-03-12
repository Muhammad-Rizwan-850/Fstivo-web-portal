'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { createEventPost, reactToPost, removeReaction, addComment, deleteComment } from '@/lib/actions/social-actions'
import * as socialQueries from '@/lib/database/queries/social'
import type { EventPost } from '@/lib/database/queries/social'
import { logger } from '@/lib/logger';

interface EventFeedProps {
  eventId: string
  userId?: string
}

export function EventFeed({ eventId, userId }: EventFeedProps) {
  const [posts, setPosts] = useState<EventPost[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPosts()
  }, [eventId, userId])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const fetchedPosts = await socialQueries.getEventPosts(eventId, userId)

      // Fetch user reactions for each post
      const postsWithReactions = await Promise.all(
        fetchedPosts.map(async (post) => {
          if (userId) {
            const reaction = await socialQueries.getUserReaction(post.id, userId)
            return { ...post, userReaction: reaction }
          }
          return { ...post, userReaction: null }
        })
      )

      setPosts(postsWithReactions)
    } catch (error) {
      logger.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || submitting) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('event_id', eventId)
      formData.append('content', newPostContent)
      formData.append('post_type', 'text')
      formData.append('visibility', 'public')

      const result = await createEventPost(formData)

      if (result.success) {
        setNewPostContent('')
        await fetchPosts()
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      logger.error('Error creating post:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!userId) return

    try {
      const post = posts.find((p) => p.id === postId)
      const currentReaction = (post as any)?.userReaction

      if (currentReaction && currentReaction.reaction_type === reactionType) {
        // Remove reaction
        const result = await removeReaction(postId)
        if (result.success) {
          setPosts(posts.map((p) =>
            p.id === postId
              ? { ...p, likes_count: Math.max(0, p.likes_count - 1), userReaction: null }
              : p
          ))
        }
      } else {
        // Add/update reaction
        const result = await reactToPost(postId, reactionType)
        if (result.success) {
          setPosts(posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: p.likes_count + 1,
                  userReaction: { reaction_type: reactionType },
                }
              : p
          ))
        }
      }
    } catch (error) {
      logger.error('Error handling reaction:', error)
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!userId || !commentInputs[postId]?.trim()) return

    try {
      const content = commentInputs[postId]
      const result = await addComment(postId, content)

      if (result.success) {
        setCommentInputs({ ...commentInputs, [postId]: '' })
        await fetchPosts()
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      logger.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!userId) return

    try {
      const result = await deleteComment(commentId, postId)
      if (result.success) {
        await fetchPosts()
      }
    } catch (error) {
      logger.error('Error deleting comment:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create Post */}
      {userId && (
        <Card>
          <CardHeader>
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              onClick={handleCreatePost}
              disabled={submitting || !newPostContent.trim()}
              className="gap-2"
            >
              {submitting ? (
                <>Posting...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No posts yet. Be the first to share!
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={post.user?.avatar_url} />
                  <AvatarFallback>
                    {post.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.user?.full_name || 'Anonymous'}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{post.content}</p>
                </div>
              </div>
            </CardHeader>

            {post.media_url && (
              <CardContent>
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="rounded-lg w-full max-h-[400px] object-cover"
                />
              </CardContent>
            )}

            <CardFooter className="flex flex-col gap-4">
              {/* Reactions */}
              <div className="flex items-center gap-4 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(post.id, 'like')}
                  className={(post as any)?.userReaction?.reaction_type === 'like' ? 'text-red-500' : ''}
                >
                  <Heart
                    className={`w-4 h-4 mr-1 ${
                      (post as any)?.userReaction?.reaction_type === 'like' ? 'fill-current' : ''
                    }`}
                  />
                  {post.likes_count || 0}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments_count || 0}
                </Button>

                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>

              {/* Comments */}
              {showComments[post.id] && userId && (
                <div className="w-full space-y-3 pt-3 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Comments would be loaded here */}
                  <p className="text-sm text-gray-500 text-center">
                    Comments feature coming soon
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
