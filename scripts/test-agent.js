#!/usr/bin/env node

// Simple test script for the Friendli.ai agent
const testAgent = async () => {
  const testMessages = [
    "Find me trending videos about AI",
    "Can you transcribe this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "Generate a 60-second viral script about productivity tips in a casual tone",
    "What makes a video go viral?",
    "Show me the most popular YouTube videos right now"
  ]
  
  console.log('🤖 Testing OpenScript AI Agent with Friendli.ai...\n')
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i]
    console.log(`Test ${i + 1}: "${message}"`)
    
    try {
      const response = await fetch('http://localhost:3002/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Success!')
        if (data.responses && data.responses.length > 0) {
          const toolResponse = data.responses.find(r => r.role === 'tool')
          const assistantResponse = data.responses.find(r => r.role === 'assistant')
          
          if (toolResponse) {
            console.log(`🔧 Tool used: ${toolResponse.toolCall?.tool}`)
          }
          if (assistantResponse) {
            console.log(`💬 Response: ${assistantResponse.content.substring(0, 100)}...`)
          }
        }
      } else {
        console.log('❌ Failed:', data.error)
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message)
    }
    
    console.log('-'.repeat(60))
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Clear conversation
  console.log('\n🧹 Clearing conversation...')
  try {
    const response = await fetch('http://localhost:3002/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    })
    
    if (response.ok) {
      console.log('✅ Conversation cleared!')
    }
  } catch (error) {
    console.log('❌ Failed to clear conversation')
  }
  
  console.log('\n🎉 Agent testing complete!')
}

// Run the test
testAgent().catch(console.error) 