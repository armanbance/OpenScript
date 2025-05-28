'use client'

import React, { useState } from 'react'
import { Search, TrendingUp, Play, Heart, MessageCircle, Share, Clock, Eye, Flame } from 'lucide-react'
import toast from 'react-hot-toast'

interface TrendingVideo {
  id: string
  url: string
  caption: string
  likes: number
  shares: number
  comments: number
  duration: number
  thumbnail: string
  author: string
  views: number
  publishedAt: string
  transcript?: string
}

export default function TrendSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<TrendingVideo | null>(null)
  const [searchType, setSearchType] = useState<'search' | 'popular'>('search')

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search topic')
      return
    }

    setIsLoading(true)
    setSearchType('search')
    try {
      const response = await fetch('/api/trends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trends')
      }
      
      setTrendingVideos(data.videos)
      toast.success(`Found ${data.videos.length} trending YouTube videos!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch trending videos')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetPopular = async () => {
    setIsLoading(true)
    setSearchType('popular')
    try {
      const response = await fetch('/api/trends/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryId: '0', // All categories
          regionCode: 'US',
          maxResults: 5 
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch popular videos')
      }
      
      setTrendingVideos(data.videos)
      toast.success(`Found ${data.videos.length} most popular YouTube videos!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch popular videos')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscribe = async (video: TrendingVideo) => {
    setIsLoading(true)
    try {
      toast.loading('Downloading and transcribing video...', { duration: 10000 })
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: video.url })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe')
      }
      
      const updatedVideo = { ...video, transcript: data.transcript }
      setSelectedVideo(updatedVideo)
      
      // Update the video in the list
      setTrendingVideos(prev => 
        prev.map(v => v.id === video.id ? updatedVideo : v)
      )
      
      toast.dismiss()
      toast.success('Video transcribed successfully!')
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Failed to transcribe video')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
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

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Discover Trending YouTube Videos
        </h3>
        <p className="text-gray-600 mb-6">
          Search for trending YouTube videos by topic, keyword, or niche, or explore the most popular videos right now.
        </p>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter topic, keyword, or niche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2 min-w-[120px]"
            >
              {isLoading && searchType === 'search' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{isLoading && searchType === 'search' ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          {/* Popular Videos Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGetPopular}
              disabled={isLoading}
              className="btn-secondary flex items-center space-x-2"
            >
              {isLoading && searchType === 'popular' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
              ) : (
                <Flame className="h-4 w-4" />
              )}
              <span>{isLoading && searchType === 'popular' ? 'Loading...' : 'Get Most Popular Videos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      {trendingVideos.length > 0 && (
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900">
            {searchType === 'search' 
              ? `Search Results for "${searchQuery}"` 
              : 'Most Popular YouTube Videos'
            }
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            {trendingVideos.length} videos found
          </p>
        </div>
      )}

      {/* Results Grid */}
      {trendingVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingVideos.map((video) => (
            <div key={video.id} className="card hover:shadow-lg transition-shadow">
              <div className="relative mb-4">
                <img
                  src={video.thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  YouTube
                </div>
                {searchType === 'popular' && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    Popular
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {video.caption}
                </h4>
                
                <div className="text-sm text-gray-600">
                  by {video.author}
                </div>
                
                <div className="text-xs text-gray-500">
                  {getTimeAgo(video.publishedAt)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {formatNumber(video.views)}
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {formatNumber(video.likes)}
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {formatNumber(video.comments)}
                  </div>
                  <div className="flex items-center">
                    <Share className="h-4 w-4 mr-1" />
                    {formatNumber(video.shares)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTranscribe(video)}
                    disabled={isLoading}
                    className="btn-primary flex-1 text-sm"
                  >
                    {video.transcript ? 'View Transcript' : 'Transcribe'}
                  </button>
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="btn-secondary text-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Video Details</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedVideo.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">Channel</h4>
                      <p className="text-gray-700">{selectedVideo.author}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Views:</span> {formatNumber(selectedVideo.views)}
                      </div>
                      <div>
                        <span className="font-medium">Likes:</span> {formatNumber(selectedVideo.likes)}
                      </div>
                      <div>
                        <span className="font-medium">Comments:</span> {formatNumber(selectedVideo.comments)}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {formatDuration(selectedVideo.duration)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Title</h4>
                    <p className="text-gray-700">{selectedVideo.caption}</p>
                  </div>
                  
                  {selectedVideo.transcript && (
                    <div>
                      <h4 className="font-semibold mb-2">Transcript</h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                          {selectedVideo.transcript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    // Navigate to script generator with this video
                    setSelectedVideo(null)
                  }}
                  className="btn-primary"
                >
                  Generate Script from This
                </button>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 