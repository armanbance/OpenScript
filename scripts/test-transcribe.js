#!/usr/bin/env node

// Simple test script for the transcription endpoint
const testTranscription = async () => {
  const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Rick Roll - short video
  
  console.log('Testing transcription endpoint...')
  console.log('Video URL:', testVideoUrl)
  
  try {
    const response = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: testVideoUrl })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Transcription successful!')
      console.log('Video ID:', data.videoId)
      console.log('Transcript length:', data.transcript.length, 'characters')
      console.log('Transcript preview:', data.transcript.substring(0, 200) + '...')
    } else {
      console.log('❌ Transcription failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }
}

// Run the test
testTranscription() 