'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  UserPlus,
  Users,
  Bell,
  Home,
  User,
  Search,
  Grid3x3,
  LogOut,
  Settings,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Award,
  TrendingUp,
  Hash,
  X,
  MoreHorizontal,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react'

interface User {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string
  university: string | null
  major: string | null
  graduation_year: number | null
  interests: string[]
  skills: string[]
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  twitter_url: string | null
  website_url: string | null
  connection_count: number
  event_count: number
}

interface Post {
  id: string
  user_id: string
  content: string
  event_id: string | null
  images: string[]
  tags: string[]
  likes_count: number
  comments_count: string[]
  shares_count: number
  is_liked?: boolean
  created_at: string
  user?: {
    user_id: string
    display_name: string
    avatar_url: string | null
    university: string | null
  }
}

interface Connection {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  university: string | null
  major: string | null
  location: string | null
  interests: string[]
  connection_strength: number
  mutual_connections: number
  connected_at: string
}

interface Suggestion {
  user_id: string
  display_name: string
  avatar_url: string | null
  university: string | null
  major: string | null
  location: string | null
  interests: string[]
  match_score: number
  mutual_connections: number
}

interface Conversation {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  university: string | null
  last_message_at: string
  last_message_preview: string
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

type TabType = 'feed' | 'connections' | 'messages' | 'notifications' | 'profile'

export default function SocialNetworkingHub() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [postContent, setPostContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'messages' && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id)
    }
  }, [activeTab, conversations])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      const profileRes = await fetch('/api/network/profile')
      const profileData = await profileRes.json()
      setCurrentUser(profileData.profile)

      // Fetch posts
      const postsRes = await fetch('/api/network/posts?limit=20')
      const postsData = await postsRes.json()
      setPosts(postsData.posts || [])

      // Fetch connections
      const connectionsRes = await fetch('/api/network/connections?type=connections')
      const connectionsData = await connectionsRes.json()
      setConnections(connectionsData.connections || [])

      // Fetch suggestions
      const suggestionsRes = await fetch('/api/network/connections?type=suggestions&limit=10')
      const suggestionsData = await suggestionsRes.json()
      setSuggestions(suggestionsData.suggestions || [])

      // Fetch conversations
      const conversationsRes = await fetch('/api/network/messages')
      const conversationsData = await conversationsRes.json()
      setConversations(conversationsData.conversations || [])

      // Fetch notifications
      const notificationsRes = await fetch('/api/network/notifications')
      const notificationsData = await notificationsRes.json()
      setNotifications(notificationsData.notifications || [])
      setUnreadCount(notificationsData.unread_count || 0)
    } catch (error) {
      logger.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    try {
      const res = await fetch('/api/network/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent, isPublic: true })
      })

      if (res.ok) {
        setPostContent('')
        fetchData()
      }
    } catch (error) {
      logger.error('Error creating post:', error)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/network/posts/${postId}/like`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        // Update local state with optimistic UI update
        setPosts(posts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: data.likesCount,
                is_liked: data.liked,
              }
            : post
        ))
      }
    } catch (error) {
      logger.error('Error liking post:', error)
    }
  }

  const handleSendConnectionRequest = async (userId: string) => {
    try {
      const res = await fetch('/api/network/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', userId })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      logger.error('Error sending connection request:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return

    try {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) return

      const res = await fetch('/api/network/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: conversation.user_id, content: messageContent })
      })

      if (res.ok) {
        setMessageContent('')
        fetchMessages(selectedConversation)
        fetchData()
      }
    } catch (error) {
      logger.error('Error sending message:', error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/network/messages?conversationId=${conversationId}`)
      const data = await res.json()
      setMessages(data.messages || [])

      // Mark as read
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        await fetch('/api/network/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, senderId: conversation.user_id })
        })
      }
    } catch (error) {
      logger.error('Error fetching messages:', error)
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await fetch('/api/network/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      fetchData()
    } catch (error) {
      logger.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/network/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      fetchData()
    } catch (error) {
      logger.error('Error marking all as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FSTIVO Network
            </h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people, posts, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {currentUser?.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'feed'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-5 h-5 inline mr-2" />
                Feed
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'connections'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Connections
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'messages'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                Messages
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center mb-4">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                      {currentUser?.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-gray-900">{currentUser?.display_name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{currentUser?.bio}</p>
                </div>

                <div className="space-y-3 text-sm">
                  {currentUser?.university && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>{currentUser.university}</span>
                    </div>
                  )}
                  {currentUser?.major && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{currentUser.major}</span>
                    </div>
                  )}
                  {currentUser?.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{currentUser.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{currentUser?.connection_count}</div>
                      <div className="text-xs text-gray-600">Connections</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{currentUser?.event_count}</div>
                      <div className="text-xs text-gray-600">Events</div>
                    </div>
                  </div>
                </div>

                {currentUser?.interests && currentUser.interests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">People You May Know</h3>
                  <div className="space-y-4">
                    {suggestions.slice(0, 5).map((suggestion) => (
                      <div key={suggestion.user_id} className="flex items-center gap-3">
                        {suggestion.avatar_url ? (
                          <img src={suggestion.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {suggestion.display_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{suggestion.display_name}</p>
                          <p className="text-xs text-gray-600 truncate">{suggestion.university}</p>
                          {suggestion.match_score > 0 && (
                            <p className="text-xs text-indigo-600">{suggestion.match_score}% match</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSendConnectionRequest(suggestion.user_id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex gap-4">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {currentUser?.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      placeholder="Share your thoughts, experiences, or ask a question..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Hash className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleCreatePost}
                        disabled={!postContent.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start gap-4">
                      {post.user?.avatar_url ? (
                        <img src={post.user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                          {post.user?.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{post.user?.display_name}</h3>
                          {post.user?.university && (
                            <span className="text-xs text-gray-600">· {post.user.university}</span>
                          )}
                          <span className="text-xs text-gray-500">
                            · {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-3 text-gray-700 whitespace-pre-wrap">{post.content}</p>

                        {post.images && post.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {post.images.map((image, idx) => (
                              <img key={idx} src={image} alt="" className="rounded-lg object-cover w-full h-48" />
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-6 text-gray-600">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center gap-2 hover:text-indigo-600"
                          >
                            <ThumbsUp className="w-5 h-5" />
                            <span>{post.likes_count}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-indigo-600">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comments_count}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-indigo-600">
                            <Share2 className="w-5 h-5" />
                            <span>{post.shares_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Connections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        {connection.avatar_url ? (
                          <img src={connection.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {connection.display_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{connection.display_name}</h3>
                          <p className="text-sm text-gray-600 truncate">{connection.university || 'University not specified'}</p>
                          {connection.major && (
                            <p className="text-xs text-gray-500">{connection.major}</p>
                          )}
                        </div>
                      </div>
                      {connection.interests && connection.interests.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {connection.interests.slice(0, 3).map((interest, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Suggestions</h2>
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.user_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {suggestion.avatar_url ? (
                          <img src={suggestion.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {suggestion.display_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{suggestion.display_name}</h3>
                          <p className="text-sm text-gray-600 truncate">{suggestion.university || 'University not specified'}</p>
                        </div>
                      </div>
                      {suggestion.interests && suggestion.interests.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {suggestion.interests.slice(0, 3).map((interest, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span>{suggestion.mutual_connections} mutual connections</span>
                        <span className="text-indigo-600 font-medium">{suggestion.match_score}% match</span>
                      </div>
                      <button
                        onClick={() => handleSendConnectionRequest(suggestion.user_id)}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {conversation.avatar_url ? (
                        <img src={conversation.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                          {conversation.display_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{conversation.display_name}</h3>
                          {conversation.unread_count > 0 && (
                            <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.last_message_preview}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm h-[600px] flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                      {conversations.find(c => c.id === selectedConversation)?.avatar_url ? (
                        <img
                          src={conversations.find(c => c.id === selectedConversation)?.avatar_url!}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                          {conversations.find(c => c.id === selectedConversation)?.display_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900">
                        {conversations.find(c => c.id === selectedConversation)?.display_name}
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === currentUser?.id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_id === currentUser?.id ? 'text-indigo-100' : 'text-gray-500'
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim()}
                          className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => handleMarkNotificationRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-full">
                        <Bell className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && currentUser && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
              <div className="px-6 pb-6">
                <div className="flex items-end gap-6 -mt-12 mb-6">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {currentUser.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 pb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{currentUser.display_name}</h1>
                    <p className="text-gray-600">{currentUser.bio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">About</h3>
                    <div className="space-y-3">
                      {currentUser.university && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <GraduationCap className="w-5 h-5" />
                          <span>{currentUser.university}</span>
                        </div>
                      )}
                      {currentUser.major && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <BookOpen className="w-5 h-5" />
                          <span>{currentUser.major}</span>
                        </div>
                      )}
                      {currentUser.location && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin className="w-5 h-5" />
                          <span>{currentUser.location}</span>
                        </div>
                      )}
                      {currentUser.graduation_year && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Calendar className="w-5 h-5" />
                          <span>Class of {currentUser.graduation_year}</span>
                        </div>
                      )}
                    </div>

                    {(currentUser.linkedin_url || currentUser.github_url || currentUser.twitter_url || currentUser.website_url) && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Links</h3>
                        <div className="space-y-2">
                          {currentUser.website_url && (
                            <a href={currentUser.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                              <LinkIcon className="w-4 h-4" />
                              <span className="text-sm">Website</span>
                            </a>
                          )}
                          {currentUser.linkedin_url && (
                            <a href={currentUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                              <LinkIcon className="w-4 h-4" />
                              <span className="text-sm">LinkedIn</span>
                            </a>
                          )}
                          {currentUser.github_url && (
                            <a href={currentUser.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                              <LinkIcon className="w-4 h-4" />
                              <span className="text-sm">GitHub</span>
                            </a>
                          )}
                          {currentUser.twitter_url && (
                            <a href={currentUser.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                              <LinkIcon className="w-4 h-4" />
                              <span className="text-sm">Twitter</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {currentUser.interests && currentUser.interests.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.interests.map((interest, idx) => (
                            <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentUser.skills && currentUser.skills.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-indigo-600">{currentUser.connection_count}</div>
                        <div className="text-sm text-gray-600 mt-1">Connections</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-indigo-600">{currentUser.event_count}</div>
                        <div className="text-sm text-gray-600 mt-1">Events Attended</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function GraduationCap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  )
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
