import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { inputText, niche, tone, duration } = await request.json()

    if (!inputText) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 })
    }

    // Check for required API keys
    if (!process.env.FRIENDLI_API_KEY) {
      return NextResponse.json({ 
        error: 'Friendli API key not configured. Please add FRIENDLI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // Generate script using Friendli API
    const script = await generateViralScriptWithFriendli(inputText, niche, tone, duration)

    return NextResponse.json({ script })

  } catch (error: any) {
    console.error('Error generating script:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}

async function generateViralScriptWithFriendli(inputText: string, niche: string, tone: string, duration: number): Promise<string> {
  const systemPrompt = `You are a viral content script writer. Create engaging, short-form video scripts that are optimized for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.

INPUT PARAMETERS:
- Topic/Content: ${inputText}
- Niche: ${niche}
- Tone: ${tone}
- Duration: ${duration} seconds

REQUIREMENTS:
1. Start with a powerful hook that grabs attention in the first 3 seconds
2. Include a clear value proposition or interesting insight
3. Structure the content for the specified duration
4. Use the specified tone (${tone})
5. End with a strong call-to-action
6. Write in a conversational, engaging style
7. Include specific actionable content

FORMAT YOUR RESPONSE AS A SCRIPT:
Hook (0-3s): [Opening line that stops scrolling]
Main Content: [Core message/value]
Call-to-Action: [What you want viewers to do]

Keep it concise, punchy, and optimized for the ${duration}-second format. Focus on ${niche} content with a ${tone} tone.`

  try {
    const response = await fetch('https://api.friendli.ai/serverless/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FRIENDLI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama-3.1-8b-instruct',
        prompt: `${systemPrompt}\n\nGenerate a viral script based on the above requirements.\n\nScript:`,
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
        stop: ['\n\nUser:', '\nUser:', '---']
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Friendli API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    const generatedScript = data.choices?.[0]?.text || ''

    // Clean up the response
    const cleanScript = generatedScript
      .trim()
      .replace(/^Script:\s*/i, '')
      .replace(/\n\n+/g, '\n\n')

    return cleanScript || generateFallbackScript(inputText, niche, tone, duration)

  } catch (error) {
    console.error('Friendli API error:', error)
    // Return fallback script if API fails
    return generateFallbackScript(inputText, niche, tone, duration)
  }
}

function generateFallbackScript(inputText: string, niche: string, tone: string, duration: number): string {
  const hooks = [
    "Stop scrolling! This will change everything...",
    "You won't believe what I just discovered...",
    "This secret has been hidden for too long...",
    "POV: You're about to learn something incredible...",
    "Wait until you see what happens next..."
  ]

  const ctas = [
    "Follow for more tips like this!",
    "Save this for later!",
    "Share with someone who needs this!",
    "Comment if this helped you!",
    "Double tap if you agree!"
  ]

  const hook = hooks[Math.floor(Math.random() * hooks.length)]
  const cta = ctas[Math.floor(Math.random() * ctas.length)]

  let bodyContent = ''
  if (duration <= 30) {
    bodyContent = `Here's the key insight about ${inputText}: it's all about timing and authenticity. This approach works because it connects with your audience on a deeper level.`
  } else if (duration <= 60) {
    bodyContent = `Let me break down ${inputText} for you. First, understand your audience. Second, create valuable content. Third, be consistent. This method has helped thousands of creators grow their following.`
  } else {
    bodyContent = `Everything you need to know about ${inputText}. The biggest mistake people make is overthinking it. Here's the step-by-step process: start with research, create authentic content, engage with your community, and stay consistent. The results speak for themselves.`
  }

  return `Hook (0-3s): ${hook}

Main Content: ${bodyContent}

Call-to-Action: ${cta}`
} 