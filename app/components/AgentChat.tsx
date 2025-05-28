'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2, Zap, Search, FileText } from 'lucide-react'
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

export default function AgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/agent')
      if (response.ok) {
        const data = await response.json()
        if (data.history) {
          setMessages(data.history)
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

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

    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
      console.error(error)
    } finally {
      setIsLoading(false)
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

  const quickPrompts = [
    {
      icon: Search,
      text: "Find trending AI videos",
      prompt: "Find me the most trending YouTube videos about AI and machine learning"
    },
    {
      icon: FileText,
      text: "Transcribe a video",
      prompt: "I have a YouTube video URL that I want to transcribe: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      icon: Zap,
      text: "Generate viral script",
      prompt: "Generate a viral 60-second script about productivity tips in a casual, energetic tone"
    }
  ]

  const getMessageIcon = (role: string, toolCall?: any) => {
    if (role === 'user') return <User className="h-5 w-5" />
    if (role === 'tool') {
      switch (toolCall?.tool) {
        case 'youtube_search': return <Search className="h-5 w-5" />
        case 'transcribe_video': return <FileText className="h-5 w-5" />
        case 'generate_script': return <Zap className="h-5 w-5" />
        default: return <Bot className="h-5 w-5" />
      }
    }
    return <Bot className="h-5 w-5" />
  }

  const getMessageBgColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-600 text-white'
      case 'tool': return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'assistant': return 'bg-gray-100 text-gray-900'
      default: return 'bg-gray-100 text-gray-900'
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">OpenScript AI Agent</h3>
            <p className="text-sm text-gray-600">Intelligent video content assistant</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to OpenScript AI!
            </h4>
            <p className="text-gray-600 mb-6">
              I can help you find trending videos, transcribe content, and generate viral scripts.
            </p>
            
            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Try these commands:</p>
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt.prompt)}
                  className="flex items-center space-x-2 w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <prompt.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-2 rounded-full ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.role === 'tool'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {getMessageIcon(message.role, message.toolCall)}
                </div>
                <div className={`p-3 rounded-lg ${getMessageBgColor(message.role)}`}>
                  {message.role === 'tool' ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">{message.content}</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.timestamp && (
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="p-2 rounded-full bg-gray-200 text-gray-700">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-xl">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to find videos, transcribe content, or generate scripts..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
} 