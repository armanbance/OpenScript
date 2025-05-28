import { NextRequest, NextResponse } from 'next/server'
import { OpenScriptAgent } from '../../../lib/agent'

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

    if (!message && action !== 'clear') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const agent = getAgent()

    // Handle special actions
    if (action === 'clear') {
      agent.clearHistory()
      return NextResponse.json({ 
        success: true, 
        message: 'Conversation history cleared',
        history: []
      })
    }

    // Check for required API keys
    if (!process.env.FRIENDLI_API_KEY) {
      return NextResponse.json({ 
        error: 'Friendli API key not configured. Please add FRIENDLI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // Process the message with the agent
    console.log(`Processing agent message: ${message}`)
    const responses = await agent.processMessage(message)
    
    // Get full conversation history
    const history = agent.getConversationHistory()

    return NextResponse.json({ 
      success: true,
      responses,
      history: history.slice(-10) // Return last 10 messages to avoid huge payloads
    })

  } catch (error: any) {
    console.error('Agent processing error:', error)
    return NextResponse.json({ 
      error: `Agent failed: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
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