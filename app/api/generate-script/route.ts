import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { inputText, niche, tone, duration } = await request.json()

    if (!inputText) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 })
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Generate script based on input parameters
    const script = generateViralScript(inputText, niche, tone, duration)

    return NextResponse.json({ script })

  } catch (error) {
    console.error('Error generating script:', error)
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}

function generateViralScript(inputText: string, niche: string, tone: string, duration: number) {
  const hooks = {
    engaging: [
      "Stop scrolling! This will blow your mind...",
      "POV: You just discovered the secret that everyone's talking about",
      "Wait until you see what happens next...",
      "This changed everything for me, and it will for you too",
      "You won't believe what I'm about to show you"
    ],
    educational: [
      "Here's what nobody tells you about...",
      "The science behind this will shock you",
      "Let me break this down for you step by step",
      "This is the method professionals don't want you to know",
      "Everything you thought you knew about this is wrong"
    ],
    inspirational: [
      "Your life is about to change forever",
      "This is your sign to start believing in yourself",
      "What if I told you that you're capable of more than you think?",
      "The only thing standing between you and success is this",
      "Today is the day you stop making excuses"
    ],
    humorous: [
      "Me trying to adult vs. reality:",
      "Nobody: ... Absolutely nobody: ... Me:",
      "When life gives you lemons, I give you this chaos",
      "Plot twist: I have no idea what I'm doing",
      "This is either genius or complete madness"
    ],
    dramatic: [
      "Everything changed in that moment...",
      "I never thought this would happen to me",
      "The truth they don't want you to know",
      "This secret has been hidden for too long",
      "What I'm about to reveal will shock you"
    ]
  }

  const ctas = [
    "Follow for more viral content like this!",
    "Save this for later - you'll thank me!",
    "Share this with someone who needs to see it",
    "Comment below if this helped you!",
    "Double tap if you agree!",
    "Tag a friend who needs this advice",
    "Turn on notifications so you don't miss out"
  ]

  const selectedHooks = hooks[tone as keyof typeof hooks] || hooks.engaging
  const hook = selectedHooks[Math.floor(Math.random() * selectedHooks.length)]
  const cta = ctas[Math.floor(Math.random() * ctas.length)]

  // Generate body content based on input
  const bodyContent = generateBodyContent(inputText, niche, tone, duration)

  const script = {
    id: `script_${Date.now()}`,
    title: `Viral ${niche || 'Content'} Script - ${tone} Tone`,
    sections: [
      {
        type: 'hook' as const,
        content: hook,
        timestamp: '0-3s'
      },
      {
        type: 'intro' as const,
        content: `Welcome back! Today I'm sharing something incredible about ${niche || 'this topic'} that's been getting amazing results.`,
        timestamp: '3-8s'
      },
      {
        type: 'body' as const,
        content: bodyContent,
        timestamp: `8-${duration - 5}s`
      },
      {
        type: 'cta' as const,
        content: cta,
        timestamp: `${duration - 5}-${duration}s`
      }
    ],
    tone,
    duration,
    hooks: selectedHooks.slice(0, 3),
    suggestions: [
      "Use trending sounds to boost reach",
      "Add captions for accessibility",
      "Include relevant hashtags in your niche",
      "Post during peak hours for your audience",
      "Engage with comments quickly after posting"
    ]
  }

  return script
}

function generateBodyContent(inputText: string, niche: string, tone: string, duration: number): string {
  const templates = {
    short: "Here's the key insight: [MAIN_POINT]. This works because [REASON]. The results speak for themselves - [BENEFIT].",
    medium: "Let me break this down for you. First, [STEP_1]. Then, [STEP_2]. Finally, [STEP_3]. The reason this is so effective is [EXPLANATION]. You'll see results immediately.",
    long: "Here's everything you need to know. The problem most people face is [PROBLEM]. But here's the solution: [SOLUTION]. Step one: [DETAIL_1]. Step two: [DETAIL_2]. Step three: [DETAIL_3]. The science behind this is fascinating - [SCIENCE]. That's why this method works so well."
  }

  const template = duration <= 30 ? templates.short : duration <= 60 ? templates.medium : templates.long

  // Extract key points from input text
  const words = inputText.toLowerCase().split(' ')
  const keyWords = words.filter(word => word.length > 4).slice(0, 5)
  
  let content = template
    .replace('[MAIN_POINT]', `the power of ${keyWords[0] || niche || 'this method'}`)
    .replace('[REASON]', `it leverages ${keyWords[1] || 'proven principles'}`)
    .replace('[BENEFIT]', `increased engagement and ${keyWords[2] || 'better results'}`)
    .replace('[STEP_1]', `focus on ${keyWords[0] || 'the foundation'}`)
    .replace('[STEP_2]', `implement ${keyWords[1] || 'the strategy'}`)
    .replace('[STEP_3]', `optimize for ${keyWords[2] || 'maximum impact'}`)
    .replace('[PROBLEM]', `struggling with ${niche || 'this challenge'}`)
    .replace('[SOLUTION]', `using ${keyWords[0] || 'this approach'}`)
    .replace('[DETAIL_1]', `understanding ${keyWords[1] || 'the basics'}`)
    .replace('[DETAIL_2]', `applying ${keyWords[2] || 'the technique'}`)
    .replace('[DETAIL_3]', `measuring ${keyWords[3] || 'the results'}`)
    .replace('[EXPLANATION]', `it targets ${keyWords[0] || 'the core issue'}`)
    .replace('[SCIENCE]', `research shows ${keyWords[1] || 'this method'} increases success rates`)

  return content
} 