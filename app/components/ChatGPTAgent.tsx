'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2, Zap, Search, FileText, Play, Eye, Heart, MessageCircle, Share, Clock, ExternalLink, Plus, Menu, X, Edit3, Check, HelpCircle, Mic, RefreshCw, Bookmark, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCall?: any
  toolResult?: any
  timestamp: Date
}

interface VideoData {
  id: string
  url: string
  caption: string
  author: string
  thumbnail: string
  views: number
  likes: number
  comments: number
  duration: number
  publishedAt: string
}

interface ChatSession {
  id: string
  title: string
  messages: AgentMessage[]
  createdAt: Date
  updatedAt: Date
}

const EXAMPLE_PROMPTS = [
  { text: "I'm going to San Francisco this weekend, give me video ideas", icon: TrendingUp, category: "Travel" },
  { text: "Help me create content about productivity tips", icon: Zap, category: "Content" },
  { text: "Find me trending AI videos", icon: Search, category: "Search" },
  { text: "I'm planning a cooking show, what should I make?", icon: Bot, category: "Ideas" },
  { text: "Transcribe this YouTube video", icon: FileText, category: "Transcribe" },
  { text: "Show me popular tech content", icon: TrendingUp, category: "Trending" }
]

const ROTATING_PLACEHOLDERS = [
  "I'm going to NYC next week, give me video ideas...",
  "Help me create content about fitness...",
  "Find me trending tech videos...",
  "Transcribe this YouTube URL...",
  "I'm starting a podcast about entrepreneurship...",
  "What viral content should I make about cooking..."
]

export default function ChatGPTAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [streamingProgress, setStreamingProgress] = useState<{
    isStreaming: boolean
    currentStep: string
    progress: number
    stepMessages: string[]
  }>({
    isStreaming: false,
    currentStep: '',
    progress: 0,
    stepMessages: []
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Rotate placeholder text
  useEffect(() => {
    if (isClient) {
      const interval = setInterval(() => {
        setCurrentPlaceholder(prev => (prev + 1) % ROTATING_PLACEHOLDERS.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isClient])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  const retryFailedOperations = () => {
    setErrors([])
    toast.success('Retrying failed operations...')
    // In a real implementation, you'd retry the actual failed operations
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    setErrors([]) // Clear previous errors

    // Initialize streaming progress
    setStreamingProgress({
      isStreaming: true,
      currentStep: 'Starting...',
      progress: 0,
      stepMessages: []
    })

    try {
      // Try streaming first
      const eventSource = new EventSource('/api/agent', {
        // Note: EventSource doesn't support POST, so we'll use fetch with streaming
      })

      // Use fetch with streaming instead
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message: userMessage })
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'progress') {
                  setStreamingProgress(prev => ({
                    ...prev,
                    currentStep: data.message,
                    progress: data.progress,
                    stepMessages: [...prev.stepMessages, data.message]
                  }))
                } else if (data.type === 'step_complete') {
                  // Add the completed step to messages immediately
                  setMessages(prev => [...prev, data.step])
                } else if (data.type === 'complete') {
                  // Update with final conversation history
                  setMessages(data.history)
                  
                  setStreamingProgress({
                    isStreaming: false,
                    currentStep: 'Complete!',
                    progress: 100,
                    stepMessages: []
                  })
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError)
              }
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Streaming failed, falling back to regular request:', error)
      
      // Fallback to regular request
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process message')
        }

        // Update messages with the new responses
        if (data.history) {
          setMessages(data.history)
        }

      } catch (fallbackError: any) {
        const errorMessage = fallbackError.message || 'Failed to send message'
        setErrors(prev => [...prev, errorMessage])
        toast.error(errorMessage)
        console.error(fallbackError)
      }
    } finally {
      setIsLoading(false)
      setStreamingProgress(prev => ({
        ...prev,
        isStreaming: false
      }))
    }
  }

  const clearHistory = async () => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })

      if (response.ok) {
        setMessages([])
        toast.success('Conversation cleared')
      }
    } catch (error) {
      toast.error('Failed to clear conversation')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays}d ago`
    }
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const formatSessionTime = (date: Date): string => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const renderVideoPreview = (videos: VideoData[]) => {
    if (!videos || videos.length === 0) return null

    return (
      <div className="mt-6 space-y-4">
        {videos.slice(0, 3).map((video, index) => (
          <div key={video.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 group">
            <div className="flex gap-5">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 group">
                <img
                  src={video.thumbnail}
                  alt="Video thumbnail"
                  className="w-36 h-24 object-cover rounded-xl shadow-sm"
                />
                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <Play className="h-5 w-5 text-gray-800" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 line-clamp-2 text-base mb-2 leading-snug">
                  {video.caption}
                </h4>
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  {video.author} • {getTimeAgo(video.publishedAt)}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{formatNumber(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">{formatNumber(video.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">{formatNumber(video.comments)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Watch
                  </a>
                  <button
                    onClick={() => setInputMessage(`Transcribe this video: ${video.url}`)}
                    className="text-sm bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    Transcribe
                  </button>
                  <button
                    onClick={() => setInputMessage(`Generate a script based on this video: ${video.caption}`)}
                    className="text-sm bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Zap className="h-4 w-4" />
                    Script
                  </button>
                  <button
                    onClick={() => {
                      // Save to scriptboard functionality
                      toast.success('Saved to Scriptboard!')
                    }}
                    className="text-sm bg-amber-50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderToolCall = (message: AgentMessage) => {
    const { toolCall } = message
    if (!toolCall) return null

    const getToolIcon = () => {
      switch (toolCall.tool) {
        case 'youtube_search': return <Search className="h-4 w-4" />
        case 'transcribe_video': return <FileText className="h-4 w-4" />
        case 'generate_script': return <Zap className="h-4 w-4" />
        case 'create_video_idea': return <TrendingUp className="h-4 w-4" />
        default: return <Bot className="h-4 w-4" />
      }
    }

    const getToolName = () => {
      switch (toolCall.tool) {
        case 'youtube_search': return 'YouTube Search'
        case 'transcribe_video': return 'Video Transcription'
        case 'generate_script': return 'Script Generation'
        case 'create_video_idea': return 'Video Idea Generation'
        case 'chat_response': return 'Chat Response'
        default: return 'Unknown Tool'
      }
    }

    const getToolColor = () => {
      switch (toolCall.tool) {
        case 'youtube_search': return 'from-blue-50 to-blue-100 border-blue-200 text-blue-700'
        case 'transcribe_video': return 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700'
        case 'generate_script': return 'from-purple-50 to-purple-100 border-purple-200 text-purple-700'
        case 'create_video_idea': return 'from-orange-50 to-orange-100 border-orange-200 text-orange-700'
        default: return 'from-amber-50 to-orange-50 border-amber-200 text-amber-700'
      }
    }

    return (
      <div className={`flex items-center gap-3 text-sm bg-gradient-to-r ${getToolColor()} px-4 py-3 rounded-xl border shadow-sm`}>
        <div className="animate-spin">
          {getToolIcon()}
        </div>
        <span className="font-medium">{message.content}</span>
      </div>
    )
  }

  const renderScriptCards = (scripts: any[]) => {
    if (!scripts || scripts.length === 0) return null

    return (
      <div className="mt-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎬 Generated Video Scripts</h3>
        {scripts.map((script, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Script Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{script.title}</h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Clock className="h-3 w-3" />
                  30-60 seconds
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${script.hook}\n\n${script.script}\n\n${script.cta}`)
                  toast.success('Script copied to clipboard!')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy script"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>

            {/* Hook */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Hook</span>
              <p className="text-lg font-semibold text-gray-900 mt-1 leading-relaxed">
                "{script.hook}"
              </p>
            </div>

            {/* Script Content */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Script</span>
              <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <ReactMarkdown className="prose prose-sm max-w-none text-gray-800">
                  {String(script.script || '')}
                </ReactMarkdown>
              </div>
            </div>

            {/* CTA */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Call to Action</span>
              <p className="text-gray-900 mt-1 font-medium">
                {script.cta}
              </p>
            </div>

            {/* Reasoning */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Why This Works</span>
              <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                {script.reasoning}
              </p>
            </div>

            {/* Hashtags */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-pink-600 uppercase tracking-wide">Hashtags</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {script.hashtags?.map((tag: string, tagIndex: number) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-pink-50 text-pink-700 rounded-md text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setInputMessage(`Modify this script: ${script.title} - make it more energetic`)}
                className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Modify
              </button>
              <button
                onClick={() => setInputMessage(`Create a longer version of: ${script.title}`)}
                className="flex-1 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Extend
              </button>
              <button
                onClick={() => setInputMessage(`Give me hashtags and captions for: ${script.title}`)}
                className="flex-1 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Optimize
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderSuggestions = (suggestions: string[]) => {
    if (!suggestions || suggestions.length === 0) return null

    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">✨ Want to Explore More?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(suggestion)}
              className="text-left p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
            >
              <span className="text-gray-700 font-medium">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderMessage = (message: AgentMessage) => {
    if (message.role === 'tool') {
      return renderToolCall(message)
    }

    const isUser = message.role === 'user'
    
    return (
      <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border border-gray-200'
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block max-w-[90%] px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : 'bg-white text-gray-900 border border-gray-100'
          }`}>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{String(message.content || '')}</ReactMarkdown>
            </div>
          </div>

          {/* Enhanced Results Display */}
          {!isUser && message.toolResult && (
            <div className="mt-4">
              {/* Video Previews */}
              {message.toolResult.videos && renderVideoPreview(message.toolResult.videos)}
              
              {/* Script Cards */}
              {message.toolResult.scripts && renderScriptCards(message.toolResult.scripts)}
              
              {/* Suggestions */}
              {message.toolResult.scripts && renderSuggestions([
                "Make this into a carousel post",
                "Give me captions and hashtags", 
                "Create a longer version",
                "Try this for a different topic"
              ])}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-400 mt-2 font-medium ${isUser ? 'text-right' : ''}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    )
  }

  // Don't render sidebar content until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin">
            <Bot className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  OpenScript AI
                </h1>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  {showTooltip && (
                    <div className="absolute top-6 left-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-20">
                      Uses AI to fetch trends, transcribe audio, and write viral hooks
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Viral video content assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <span>{errors.length} error{errors.length > 1 ? 's' : ''}</span>
                </button>
                {showErrors && (
                  <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Recent Errors</h3>
                      <button
                        onClick={retryFailedOperations}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={clearHistory}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Clear conversation"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 p-6 rounded-3xl shadow-xl mx-auto w-fit mb-8 animate-pulse">
                <Bot className="h-12 w-12 text-white mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to OpenScript AI
              </h2>
              <p className="text-gray-600 mb-12 max-w-lg mx-auto text-lg leading-relaxed">
                I can help you find trending videos, transcribe content, and generate viral scripts. 
                Just ask me in natural language!
              </p>
              
              {/* Example prompts - 3x2 grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                {EXAMPLE_PROMPTS.map((prompt, index) => {
                  const IconComponent = prompt.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt.text)}
                      className="p-4 text-left bg-white hover:bg-gray-50 rounded-2xl transition-all duration-200 text-sm border border-gray-200 hover:border-gray-300 hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {prompt.category}
                        </span>
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                        "{prompt.text}"
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Suggested categories */}
              <div className="text-sm text-gray-500">
                <p className="mb-2">Popular categories:</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {['Tech Reviews', 'Cooking', 'Fitness', 'Comedy', 'Education'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setInputMessage(`Find trending ${category.toLowerCase()} videos`)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {renderMessage(message)}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border border-gray-200 flex items-center justify-center shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                {streamingProgress.isStreaming ? (
                  <div className="bg-white text-gray-900 px-4 py-3 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                    {/* Current Step */}
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">{streamingProgress.currentStep}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{streamingProgress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${streamingProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Recent Steps */}
                    {streamingProgress.stepMessages.length > 0 && (
                      <div className="text-xs text-gray-400 space-y-1 max-h-20 overflow-y-auto">
                        {streamingProgress.stepMessages.slice(-3).map((step, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="inline-block bg-white text-gray-900 px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={ROTATING_PLACEHOLDERS[currentPlaceholder]}
                  className="w-full resize-none border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-h-32 bg-white shadow-sm transition-all duration-200 placeholder:transition-all placeholder:duration-500"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Voice input (coming soon)"
                  disabled
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-sm"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-3 text-center font-medium">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 