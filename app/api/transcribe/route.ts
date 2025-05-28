import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import path from 'path'
import Groq from 'groq-sdk'

const execAsync = promisify(exec)

// Initialize Groq only when API key is available
let groq: any = null
if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })
  } catch (error) {
    console.warn('Groq SDK not available:', error)
  }
}

export async function POST(request: NextRequest) {
  let audioFilePath: string | null = null
  
  try {
    const { videoUrl } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    if (!youtubeRegex.test(videoUrl)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID' }, { status: 400 })
    }

    console.log(`Starting transcription for video: ${videoId}`)

    // Define audio file path
    audioFilePath = path.join(process.cwd(), 'temp', 'audio', `${videoId}.mp3`)

    // Download audio using yt-dlp
    console.log('Downloading audio...')
    const downloadCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${audioFilePath.replace('.mp3', '.%(ext)s')}" "${videoUrl}"`
    
    try {
      await execAsync(downloadCommand, { timeout: 60000 }) // 60 second timeout
      console.log('Audio downloaded successfully')
    } catch (downloadError: any) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ 
        error: 'Failed to download video audio. The video might be private, age-restricted, or unavailable.' 
      }, { status: 500 })
    }

    // Check if Groq API key exists
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({ 
        error: 'Groq API key not configured. Please add GROQ_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey: groqApiKey })

    // Read the audio file
    console.log('Reading audio file for transcription...')
    let audioBuffer: Buffer
    try {
      audioBuffer = await readFile(audioFilePath)
    } catch (readError) {
      console.error('Error reading audio file:', readError)
      return NextResponse.json({ 
        error: 'Failed to read downloaded audio file' 
      }, { status: 500 })
    }

    // Create a File object for Groq Whisper
    const audioFile = new File([audioBuffer], `${videoId}.mp3`, { type: 'audio/mpeg' })

    // Transcribe using Groq Whisper
    console.log('Transcribing audio with Groq Whisper...')
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'en', // You can make this dynamic or auto-detect
        response_format: 'text'
      })

      console.log('Transcription completed successfully')

      // Clean up the audio file
      if (audioFilePath) {
        try {
          await unlink(audioFilePath)
          console.log('Audio file cleaned up')
        } catch (cleanupError) {
          console.warn('Failed to clean up audio file:', cleanupError)
        }
      }

      return NextResponse.json({ 
        transcript: transcription,
        videoId: videoId,
        success: true 
      })

    } catch (transcriptionError: any) {
      console.error('Transcription error:', transcriptionError)
      return NextResponse.json({ 
        error: `Transcription failed: ${transcriptionError.message || 'Unknown error'}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('General transcription error:', error)

    // Clean up audio file if it exists
    if (audioFilePath) {
      try {
        await unlink(audioFilePath)
      } catch (cleanupError) {
        console.warn('Failed to clean up audio file during error handling:', cleanupError)
      }
    }

    return NextResponse.json({ 
      error: `Transcription service failed: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

// Uncomment and use this for real Groq Whisper integration:
/*
async function transcribeWithGroq(audioBuffer: Buffer) {
  try {
    if (!groq) {
      throw new Error('Groq client not initialized')
    }
    
    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' }),
      model: 'whisper-large-v3',
      response_format: 'json',
      temperature: 0.0
    })

    return transcription.text
  } catch (error) {
    console.error('Groq transcription error:', error)
    throw error
  }
}
*/ 