import { NextRequest, NextResponse } from 'next/server'

interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    thumbnails: {
      high: {
        url: string
      }
    }
    categoryId: string
  }
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
  contentDetails: {
    duration: string
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const { categoryId = '0', regionCode = 'US', maxResults = 5 } = await request.json()

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // Get most popular videos using the exact API format you specified
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=${categoryId}&maxResults=${maxResults}&regionCode=${regionCode}&key=${apiKey}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('YouTube API error:', errorData)
      return NextResponse.json({ 
        error: `YouTube API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}` 
      }, { status: response.status })
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ 
        error: 'No popular videos found. This might be due to regional restrictions or API limits.' 
      }, { status: 404 })
    }

    // Transform YouTube data to our format
    const videos: TrendingVideo[] = data.items.map((video: YouTubeVideo) => ({
      id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      caption: video.snippet.title,
      author: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.high.url,
      likes: parseInt(video.statistics.likeCount || '0'),
      comments: parseInt(video.statistics.commentCount || '0'),
      shares: Math.floor(parseInt(video.statistics.likeCount || '0') * 0.1), // Estimate shares
      views: parseInt(video.statistics.viewCount || '0'),
      duration: parseDuration(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt
    }))

    return NextResponse.json({ videos })

  } catch (error) {
    console.error('Error fetching popular YouTube videos:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch popular YouTube videos. Please try again later.' 
    }, { status: 500 })
  }
}

// Parse YouTube duration format (PT4M13S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
} 