import { NextRequest, NextResponse } from 'next/server'
import { OpenScriptAgent } from '@/lib/agent'

// Global agent instance to maintain conversation state
let agentInstance: OpenScriptAgent | null = null

function getAgent(): OpenScriptAgent {
  if (!agentInstance) {
    agentInstance = new OpenScriptAgent()
  }
  return agentInstance
}

export async function POST(request: NextRequest) {
  try {
    const { message, action } = await request.json()

    if (action === 'clear') {
      getAgent().clearHistory()
      return NextResponse.json({ success: true })
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('Processing agent message:', message)

    // Check if this is a streaming request
    const acceptHeader = request.headers.get('accept')
    const isStreamingRequest = acceptHeader?.includes('text/event-stream')

    if (isStreamingRequest) {
      // Return streaming response for real-time progress
      const encoder = new TextEncoder()
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Set up progress callback
            const progressCallback = (step: any) => {
              const data = `data: ${JSON.stringify(step)}\n\n`
              controller.enqueue(encoder.encode(data))
            }

            // Process with progress updates
            const responses = await getAgent().processMessageWithProgress(message, progressCallback)
            
            // Send final result
            const finalData = `data: ${JSON.stringify({ 
              type: 'complete', 
              history: getAgent().getConversationHistory()
            })}\n\n`
            controller.enqueue(encoder.encode(finalData))
            
            controller.close()
          } catch (error: any) {
            const errorData = `data: ${JSON.stringify({ 
              type: 'error', 
              error: error.message 
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Regular response for backwards compatibility
      const responses = await getAgent().processMessage(message)
      return NextResponse.json({ 
        history: getAgent().getConversationHistory()
      })
    }

  } catch (error: any) {
    console.error('Agent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const agent = getAgent()
    const history = agent.getConversationHistory()

    return NextResponse.json({ 
      success: true,
      history: history.slice(-20) // Return last 20 messages
    })

  } catch (error: any) {
    console.error('Error getting conversation history:', error)
    return NextResponse.json({ 
      error: `Failed to get history: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
} 