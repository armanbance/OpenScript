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
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // First, search for videos related to the query, ordered by relevance and view count
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&maxResults=20&key=${apiKey}`
    
    const searchResponse = await fetch(searchUrl)
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('YouTube search API error:', errorData)
      return NextResponse.json({ 
        error: `YouTube search failed: ${searchResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
      }, { status: searchResponse.status })
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ 
        error: 'No videos found for this search query. Try a different keyword.' 
      }, { status: 404 })
    }

    // Get video IDs for detailed stats
    const videoIds = searchData.items.slice(0, 10).map((item: any) => item.id.videoId).join(',')
    
    // Get detailed video information including statistics
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
    
    const videosResponse = await fetch(videosUrl)
    
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json()
      console.error('YouTube videos API error:', errorData)
      return NextResponse.json({ 
        error: `YouTube videos API failed: ${videosResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
      }, { status: videosResponse.status })
    }

    const videosData = await videosResponse.json()

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ 
        error: 'No video details found. The videos may be private or unavailable.' 
      }, { status: 404 })
    }

    // Transform YouTube data to our format and sort by view count
    const videos: TrendingVideo[] = videosData.items
      .map((video: YouTubeVideo) => ({
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
      .sort((a: TrendingVideo, b: TrendingVideo) => b.views - a.views) // Sort by view count descending
      .slice(0, 5) // Take top 5

    return NextResponse.json({ videos })

  } catch (error) {
    console.error('Error searching YouTube trends:', error)
    return NextResponse.json({ 
      error: 'Failed to search YouTube videos. Please try again later.' 
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