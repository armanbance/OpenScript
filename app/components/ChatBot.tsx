'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Lightbulb, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI script assistant. I can help you brainstorm video ideas, refine scripts, analyze viral trends, and optimize your content for maximum engagement. What would you like to work on today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get AI response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI script assistant. I can help you brainstorm video ideas, refine scripts, analyze viral trends, and optimize your content for maximum engagement. What would you like to work on today?",
        timestamp: new Date()
      }
    ])
  }

  const quickPrompts = [
    "Help me brainstorm viral video ideas for fitness content",
    "Analyze this script and suggest improvements",
    "What are the key elements of a viral TikTok hook?",
    "Generate 5 different opening lines for a cooking video",
    "How can I make my content more engaging?"
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              AI Script Assistant
            </h3>
            <p className="text-gray-600">
              Chat with AI to brainstorm ideas, refine scripts, and get viral content insights.
            </p>
          </div>
          <button
            onClick={clearChat}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-3">Quick Prompts</h4>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(prompt)}
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="card">
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 mt-1" />
                    ) : (
                      <Bot className="h-4 w-4 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about viral scripts, content ideas, or optimization tips..."
              rows={3}
              className="input-field resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="btn-primary flex items-center space-x-2 self-end"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-purple-600 mt-1" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">Pro Tips</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Be specific about your niche and target audience</li>
              <li>• Share your existing scripts for personalized feedback</li>
              <li>• Ask about current trends in your content category</li>
              <li>• Request multiple variations of hooks and CTAs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 