import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Get the last user message
    const lastMessage = messages[messages.length - 1]?.content || ''

    // Generate contextual response based on the message
    const response = generateAIResponse(lastMessage, messages)

    return NextResponse.json({ message: response })

  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

function generateAIResponse(userMessage: string, conversationHistory: any[]): string {
  const message = userMessage.toLowerCase()

  // Viral content and hooks
  if (message.includes('hook') || message.includes('opening')) {
    return `Here are some powerful viral hooks you can use:

🔥 **Attention-Grabbing Hooks:**
• "Stop scrolling! This will change everything..."
• "POV: You just discovered the secret that..."
• "Nobody talks about this, but..."
• "This took me 10 years to learn..."
• "The algorithm doesn't want you to see this..."

💡 **Educational Hooks:**
• "Here's what nobody tells you about..."
• "The science behind this will shock you..."
• "Everything you thought you knew is wrong..."

🎯 **For your specific niche, try:**
• Starting with a bold statement
• Using numbers ("3 secrets that...")
• Creating urgency ("Before it's too late...")
• Asking a provocative question

What type of content are you creating? I can give you more targeted hooks!`
  }

  // Script analysis and improvement
  if (message.includes('analyze') || message.includes('improve') || message.includes('script')) {
    return `I'd love to help improve your script! Here's what makes scripts go viral:

📝 **Script Structure:**
1. **Hook (0-3s):** Grab attention immediately
2. **Promise (3-5s):** Tell them what they'll learn
3. **Deliver (5-25s):** Provide the value
4. **CTA (25-30s):** Tell them what to do next

🎯 **Key Elements:**
• Start with a pattern interrupt
• Use "you" language to make it personal
• Include specific numbers/results
• Create curiosity gaps
• End with a clear call-to-action

📊 **Optimization Tips:**
• Keep sentences short and punchy
• Use trending phrases and slang
• Include emotional triggers
• Add visual cues for editing

Share your script and I'll give you specific feedback on how to make it more viral!`
  }

  // Brainstorming and ideas
  if (message.includes('idea') || message.includes('brainstorm') || message.includes('content')) {
    const niches = ['fitness', 'cooking', 'tech', 'business', 'lifestyle', 'education']
    const detectedNiche = niches.find(niche => message.includes(niche)) || 'your niche'

    return `Let's brainstorm some viral content ideas for ${detectedNiche}! 

🚀 **Trending Formats:**
• "Things I wish I knew before..."
• "POV: You're trying to..."
• "Day in my life as a..."
• "Rating viral [niche] hacks"
• "Beginner vs Pro [niche] mistakes"

💡 **Content Pillars:**
• Educational (teach something valuable)
• Entertainment (make them laugh/smile)
• Inspiration (motivate and uplift)
• Behind-the-scenes (show your process)
• Trending challenges (put your spin on them)

🎯 **For ${detectedNiche} specifically:**
• Common mistakes people make
• Quick tips and hacks
• Before/after transformations
• Myth-busting content
• Tool/product reviews

What specific aspect of ${detectedNiche} are you most passionate about? I can help you develop that into viral content ideas!`
  }

  // Engagement and optimization
  if (message.includes('engagement') || message.includes('viral') || message.includes('algorithm')) {
    return `Here's how to maximize engagement and work with the algorithm:

📈 **Algorithm Secrets:**
• Post consistently (same time daily)
• Use trending sounds and hashtags
• Engage with comments within first hour
• Create content that gets saved/shared
• Hook viewers in first 3 seconds

🎯 **Engagement Boosters:**
• Ask questions in your captions
• Use polls and interactive stickers
• Respond to every comment quickly
• Create content that sparks debate
• End with clear call-to-actions

⏰ **Timing Tips:**
• Post when your audience is most active
• Jump on trends early (within 24-48 hours)
• Use current events and pop culture references
• Create series content to bring people back

💬 **Community Building:**
• Share personal stories and struggles
• Show behind-the-scenes content
• Collaborate with other creators
• Create content that makes people feel seen

What's your current engagement rate? I can give you specific strategies to improve it!`
  }

  // General helpful response
  const responses = [
    `Great question! I'm here to help you create viral content. I can assist with:

🎬 **Script Writing:** Help you craft compelling hooks, body content, and CTAs
📊 **Content Strategy:** Brainstorm viral ideas for your niche
🔍 **Trend Analysis:** Explain what makes content go viral
💡 **Optimization:** Improve your existing scripts and ideas
🎯 **Engagement:** Strategies to boost views, likes, and shares

What specific area would you like to focus on? The more details you give me about your niche and goals, the better I can help!`,

    `I love helping creators like you! Here are some ways I can assist:

✨ **Creative Brainstorming:** Generate fresh content ideas
📝 **Script Refinement:** Polish your scripts for maximum impact
🎯 **Hook Creation:** Craft attention-grabbing openings
📈 **Viral Strategy:** Understand what makes content spread
🎬 **Format Ideas:** Suggest trending video formats

Tell me more about your content niche and what you're struggling with. Are you looking to improve engagement, get more views, or create better scripts?`,

    `Perfect! I'm your AI script assistant and I'm excited to help you create viral content. 

🚀 **I can help you with:**
• Writing compelling hooks that stop the scroll
• Structuring scripts for maximum retention
• Brainstorming content ideas for your niche
• Analyzing what makes videos go viral
• Optimizing your content for the algorithm

What's your biggest challenge right now? Are you struggling with:
- Getting people to stop scrolling?
- Keeping viewers engaged throughout the video?
- Coming up with fresh content ideas?
- Understanding what your audience wants?

Let me know and I'll give you specific, actionable advice!`
  ]

  return responses[Math.floor(Math.random() * responses.length)]
} 