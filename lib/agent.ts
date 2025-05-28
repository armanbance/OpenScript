import { z } from 'zod'

// Enhanced tool schemas for the new workflow
const YouTubeSearchTool = z.object({
  tool: z.literal('youtube_search'),
  query: z.string().describe('Search query for YouTube videos'),
  type: z.enum(['search', 'popular']).describe('Type of search - keyword search or popular videos')
})

const TranscribeTool = z.object({
  tool: z.literal('transcribe_video'),
  videoUrl: z.string().describe('YouTube video URL to transcribe'),
  videoTitle: z.string().optional().describe('Title of the video for context')
})

const GenerateScriptTool = z.object({
  tool: z.literal('generate_script'),
  inputText: z.string().describe('Transcript or content to base the script on'),
  niche: z.string().describe('Content niche (e.g., tech, fitness, lifestyle)'),
  tone: z.enum(['casual', 'professional', 'energetic', 'educational']).describe('Tone of the script'),
  duration: z.number().describe('Target duration in seconds (30-600)')
})

const ChatResponseTool = z.object({
  tool: z.literal('chat_response'),
  message: z.string().describe('Direct response to user without using tools')
})

// New enhanced workflow tool for high-level requests
const CreateVideoIdeaTool = z.object({
  tool: z.literal('create_video_idea'),
  topic: z.string().describe('Main topic extracted from user input'),
  context: z.string().describe('Additional context like location, event, or situation'),
  userIntent: z.string().describe('What the user wants to achieve')
})

const ToolCall = z.union([YouTubeSearchTool, TranscribeTool, GenerateScriptTool, ChatResponseTool, CreateVideoIdeaTool])

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCall?: z.infer<typeof ToolCall>
  toolResult?: any
  timestamp: Date
}

interface VideoScript {
  title: string
  hook: string
  script: string
  cta: string
  reasoning: string
  hashtags: string[]
}

interface VideoIdeaResult {
  summary: string
  scripts: VideoScript[]
  sourceVideos: any[]
  suggestions: string[]
}

export class OpenScriptAgent {
  private friendliApiKey: string
  private conversationHistory: AgentMessage[] = []

  constructor() {
    this.friendliApiKey = process.env.FRIENDLI_API_KEY || ''
  }

  async processMessage(userMessage: string): Promise<AgentMessage[]> {
    // Add user message to history
    const userMsg: AgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    this.conversationHistory.push(userMsg)

    // Check if this is a high-level video idea request
    const isVideoIdeaRequest = await this.isVideoIdeaRequest(userMessage)
    
    if (isVideoIdeaRequest) {
      // Execute the full video idea workflow
      return await this.executeVideoIdeaWorkflow(userMessage)
    } else {
      // Use the existing single-tool workflow
      const toolDecision = await this.decideToolUse(userMessage)
      const responses = await this.executeToolAndRespond(toolDecision)
      this.conversationHistory.push(...responses)
      return responses
    }
  }

  private async isVideoIdeaRequest(userMessage: string): Promise<boolean> {
    const videoIdeaKeywords = [
      'video idea', 'script', 'content', 'going to', 'trip', 'visiting',
      'traveling', 'give me ideas', 'what should i make', 'help me create'
    ]
    
    const lowerMessage = userMessage.toLowerCase()
    return videoIdeaKeywords.some(keyword => lowerMessage.includes(keyword)) ||
           /i'm (going|traveling|visiting|planning)/i.test(userMessage)
  }

  private async executeVideoIdeaWorkflow(userMessage: string): Promise<AgentMessage[]> {
    const responses: AgentMessage[] = []

    // Step 1: Extract topic and context
    const topicData = await this.extractTopicAndContext(userMessage)
    
    // Add thinking message
    const thinkingMsg: AgentMessage = {
      id: `tool_${Date.now()}`,
      role: 'tool',
      content: `🧠 Analyzing your request: "${topicData.topic}"...`,
      toolCall: { tool: 'create_video_idea', topic: topicData.topic, context: topicData.context, userIntent: topicData.intent },
      timestamp: new Date()
    }
    responses.push(thinkingMsg)

    try {
      // Step 2: Search for trending videos
      const searchResult = await this.executeYouTubeSearch(topicData.topic, 'search')
      
      // Add search status
      const searchMsg: AgentMessage = {
        id: `tool_${Date.now() + 1}`,
        role: 'tool',
        content: `🔍 Found ${searchResult.videos?.length || 0} trending videos about "${topicData.topic}"...`,
        timestamp: new Date()
      }
      responses.push(searchMsg)

      // Step 3: Transcribe top 3 videos
      const transcribeMsg: AgentMessage = {
        id: `tool_${Date.now() + 2}`,
        role: 'tool',
        content: `📝 Analyzing video content and extracting viral patterns...`,
        timestamp: new Date()
      }
      responses.push(transcribeMsg)

      const topVideos = searchResult.videos?.slice(0, 3) || []
      const transcripts = await Promise.all(
        topVideos.map(async (video: any) => {
          try {
            const result = await this.executeTranscription(video.url)
            return { video, transcript: result.transcript }
          } catch (error) {
            return { video, transcript: `Video about ${video.caption}` }
          }
        })
      )

      // Step 4: Generate personalized scripts
      const scriptsMsg: AgentMessage = {
        id: `tool_${Date.now() + 3}`,
        role: 'tool',
        content: `🎬 Creating personalized scripts for your ${topicData.topic} content...`,
        timestamp: new Date()
      }
      responses.push(scriptsMsg)

      const videoIdeas = await this.generateVideoIdeas(topicData, transcripts)

      // Step 5: Format and return comprehensive response
      const finalResponse = this.formatVideoIdeaResponse(videoIdeas, topicData)
      
      const finalMsg: AgentMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: finalResponse,
        toolResult: { 
          videos: topVideos,
          scripts: videoIdeas.scripts,
          topic: topicData.topic 
        },
        timestamp: new Date()
      }
      responses.push(finalMsg)

    } catch (error: any) {
      const errorMsg: AgentMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error while creating your video ideas: ${error.message}. Let me try a simpler approach - what specific type of content are you looking to create?`,
        timestamp: new Date()
      }
      responses.push(errorMsg)
    }

    this.conversationHistory.push(...responses)
    return responses
  }

  private async extractTopicAndContext(userMessage: string): Promise<{topic: string, context: string, intent: string}> {
    const systemPrompt = `Extract the main topic, context, and intent from this user message for video content creation.

User message: "${userMessage}"

Respond with a JSON object with these fields:
- topic: Main subject (e.g., "San Francisco", "productivity tips", "cooking")
- context: Additional context (e.g., "upcoming trip", "work from home", "beginner level")
- intent: What they want to achieve (e.g., "travel content", "educational video", "entertainment")

JSON:`

    try {
      const response = await this.callFriendliAPI(systemPrompt, userMessage)
      const jsonMatch = response.match(/\{.*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Topic extraction error:', error)
    }

    // Fallback extraction
    const words = userMessage.toLowerCase().split(' ')
    let topic = 'content creation'
    let context = 'general'
    let intent = 'video ideas'

    // Simple keyword extraction
    if (words.includes('going') || words.includes('trip') || words.includes('visit')) {
      context = 'travel'
      const locations = ['san francisco', 'sf', 'new york', 'la', 'los angeles', 'miami', 'chicago']
      for (const location of locations) {
        if (userMessage.toLowerCase().includes(location)) {
          topic = location
          break
        }
      }
    }

    return { topic, context, intent }
  }

  private async generateVideoIdeas(topicData: any, transcripts: any[]): Promise<VideoIdeaResult> {
    const scriptPrompts = [
      {
        type: "Quick Tips",
        template: `Create a viral "5 things" style script about ${topicData.topic}`,
        hook: `Only have 1 day in ${topicData.topic}? Here's how to do it all.`
      },
      {
        type: "AI Experiment", 
        template: `Create an "I let AI plan my..." style script for ${topicData.topic}`,
        hook: `Can AI plan the perfect ${topicData.topic} experience?`
      },
      {
        type: "Hidden Gems",
        template: `Create a "locals only" secrets script about ${topicData.topic}`,
        hook: `Hidden gems only locals know about ${topicData.topic}`
      }
    ]

    const scripts: VideoScript[] = []

    for (const prompt of scriptPrompts) {
      try {
        const scriptResult = await this.executeScriptGeneration({
          tool: 'generate_script',
          inputText: `Topic: ${topicData.topic}. Context: ${topicData.context}. Style: ${prompt.type}`,
          niche: topicData.context || 'lifestyle',
          tone: 'casual',
          duration: 30
        })

        scripts.push({
          title: `${prompt.type}: ${topicData.topic}`,
          hook: prompt.hook,
          script: scriptResult.script || prompt.template,
          cta: this.generateCTA(prompt.type),
          reasoning: `This ${prompt.type.toLowerCase()} format works because it's highly shareable and creates FOMO`,
          hashtags: this.generateHashtags(topicData.topic, prompt.type)
        })
      } catch (error) {
        // Fallback script
        scripts.push({
          title: `${prompt.type}: ${topicData.topic}`,
          hook: prompt.hook,
          script: prompt.template,
          cta: this.generateCTA(prompt.type),
          reasoning: `This format is proven to drive engagement`,
          hashtags: this.generateHashtags(topicData.topic, prompt.type)
        })
      }
    }

    return {
      summary: `Here are 3 video ideas based on current trends about ${topicData.topic}:`,
      scripts,
      sourceVideos: transcripts.map(t => t.video),
      suggestions: [
        "Make this into a carousel post",
        "Give me captions and hashtags", 
        "Create a longer version",
        `Try this for a different location`
      ]
    }
  }

  private generateCTA(scriptType: string): string {
    const ctas = {
      "Quick Tips": "Save this for your next trip!",
      "AI Experiment": "Would you trust AI with your plans?",
      "Hidden Gems": "Follow for more local secrets!",
      default: "Double tap if this helped!"
    }
    return ctas[scriptType as keyof typeof ctas] || ctas.default
  }

  private generateHashtags(topic: string, scriptType: string): string[] {
    const baseTags = ['#viral', '#fyp', '#trending']
    const topicTags = [`#${topic.replace(/\s+/g, '').toLowerCase()}`]
    const typeTags = scriptType === 'Quick Tips' ? ['#tips', '#guide'] : 
                    scriptType === 'AI Experiment' ? ['#ai', '#experiment'] :
                    ['#hidden', '#local', '#secret']
    
    return [...baseTags, ...topicTags, ...typeTags].slice(0, 8)
  }

  private formatVideoIdeaResponse(videoIdeas: VideoIdeaResult, topicData: any): string {
    let response = `🧠 ${videoIdeas.summary}\n\n`

    videoIdeas.scripts.forEach((script, index) => {
      response += `## 🎥 **${script.title}**\n\n`
      response += `**Hook:** "${script.hook}"\n\n`
      response += `**Script:**\n${script.script}\n\n`
      response += `**CTA:** ${script.cta}\n\n`
      response += `**Why this works:** ${script.reasoning}\n\n`
      response += `**Hashtags:** ${script.hashtags.join(' ')}\n\n`
      response += `---\n\n`
    })

    response += `✨ **Want to explore more?**\n`
    videoIdeas.suggestions.forEach(suggestion => {
      response += `• ${suggestion}\n`
    })

    return response
  }

  private async decideToolUse(userMessage: string): Promise<z.infer<typeof ToolCall>> {
    const systemPrompt = `You are OpenScript AI, an intelligent agent that helps users create viral video content. 

Available tools:
1. youtube_search - Search for trending YouTube videos by keyword or get popular videos
2. transcribe_video - Transcribe audio from a YouTube video URL  
3. generate_script - Generate viral scripts from transcripts or ideas
4. chat_response - Provide direct conversational responses
5. create_video_idea - Full workflow for high-level video content requests

Analyze the user's message and decide which tool to use. Consider:
- If they want to find/search videos → youtube_search
- If they have a video URL to transcribe → transcribe_video  
- If they want to create a script from content → generate_script
- If they're asking for video ideas or mentioning travel/events → create_video_idea
- If they're asking questions or chatting → chat_response

User message: "${userMessage}"

Respond ONLY with a JSON object matching one of these schemas:
- {"tool": "youtube_search", "query": "search term", "type": "search" or "popular"}
- {"tool": "transcribe_video", "videoUrl": "youtube url", "videoTitle": "optional title"}
- {"tool": "generate_script", "inputText": "content", "niche": "category", "tone": "casual/professional/energetic/educational", "duration": 60}
- {"tool": "create_video_idea", "topic": "main topic", "context": "additional context", "userIntent": "what they want"}
- {"tool": "chat_response", "message": "your response"}

JSON:`

    try {
      const response = await this.callFriendliAPI(systemPrompt, userMessage)
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{.*\}/)
      if (jsonMatch) {
        const toolCall = JSON.parse(jsonMatch[0])
        return ToolCall.parse(toolCall)
      }
      
      throw new Error('No valid JSON found in response')
    } catch (error) {
      console.error('Tool decision error:', error)
      // Fallback to chat response if parsing fails
      return {
        tool: 'chat_response',
        message: "I'd be happy to help you with viral video content creation! You can ask me to find trending videos, transcribe content, or generate scripts."
      }
    }
  }

  private async callFriendliAPI(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch('https://api.friendli.ai/serverless/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.friendliApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama-3.1-8b-instruct',
        prompt: `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`,
        max_tokens: 500,
        temperature: 0.1,
        top_p: 0.9,
        stop: ['\n\nUser:', '\nUser:']
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Friendli API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.text || ''
  }

  private async executeToolAndRespond(toolCall: z.infer<typeof ToolCall>): Promise<AgentMessage[]> {
    const responses: AgentMessage[] = []

    // Add tool call message
    const toolMsg: AgentMessage = {
      id: `tool_${Date.now()}`,
      role: 'tool',
      content: `Using ${toolCall.tool}...`,
      toolCall,
      timestamp: new Date()
    }
    responses.push(toolMsg)

    let toolResult: any
    let assistantResponse: string

    try {
      switch (toolCall.tool) {
        case 'youtube_search':
          toolResult = await this.executeYouTubeSearch(toolCall.query, toolCall.type)
          assistantResponse = this.formatYouTubeResults(toolResult, toolCall.query)
          break

        case 'transcribe_video':
          toolResult = await this.executeTranscription(toolCall.videoUrl)
          assistantResponse = this.formatTranscriptionResult(toolResult, toolCall.videoTitle)
          break

        case 'generate_script':
          toolResult = await this.executeScriptGeneration(toolCall)
          assistantResponse = this.formatScriptResult(toolResult)
          break

        case 'chat_response':
          assistantResponse = toolCall.message
          break

        default:
          assistantResponse = "I'm not sure how to help with that. Try asking me to find videos, transcribe content, or generate scripts!"
      }
    } catch (error: any) {
      assistantResponse = `Sorry, I encountered an error: ${error.message}. Please try again or ask me something else!`
    }

    // Add assistant response
    const assistantMsg: AgentMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: assistantResponse,
      toolResult,
      timestamp: new Date()
    }
    responses.push(assistantMsg)

    return responses
  }

  private async executeYouTubeSearch(query: string, type: 'search' | 'popular') {
    const endpoint = type === 'search' ? '/api/trends/search' : '/api/trends/popular'
    const body = type === 'search' 
      ? { query } 
      : { categoryId: '0', regionCode: 'US', maxResults: 5 }

    // Try multiple ports to find the running Next.js server
    const ports = [3004, 3003, 3002, 3001, 3000]
    let lastError: Error | null = null

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (response.ok) {
          return await response.json()
        }
        
        if (response.status !== 500) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to search YouTube')
        }
      } catch (error: any) {
        lastError = error
        continue
      }
    }

    throw lastError || new Error('Could not connect to Next.js server')
  }

  private async executeTranscription(videoUrl: string) {
    const ports = [3004, 3003, 3002, 3001, 3000]
    let lastError: Error | null = null

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/api/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl })
        })

        if (response.ok) {
          return await response.json()
        }
        
        if (response.status !== 500) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to transcribe video')
        }
      } catch (error: any) {
        lastError = error
        continue
      }
    }

    throw lastError || new Error('Could not connect to Next.js server')
  }

  private async executeScriptGeneration(params: z.infer<typeof GenerateScriptTool>) {
    const ports = [3004, 3003, 3002, 3001, 3000]
    let lastError: Error | null = null

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/api/generate-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputText: params.inputText,
            niche: params.niche,
            tone: params.tone,
            duration: params.duration
          })
        })

        if (response.ok) {
          return await response.json()
        }
        
        if (response.status !== 500) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate script')
        }
      } catch (error: any) {
        lastError = error
        continue
      }
    }

    throw lastError || new Error('Could not connect to Next.js server')
  }

  private formatYouTubeResults(result: any, query: string): string {
    if (!result.videos || result.videos.length === 0) {
      return `I couldn't find any videos for "${query}". Try a different search term!`
    }

    const videos = result.videos.slice(0, 5)
    let response = `🎥 **Found ${videos.length} trending videos for "${query}":**\n\n`

    videos.forEach((video: any, index: number) => {
      const views = this.formatNumber(video.views)
      const duration = this.formatDuration(video.duration)
      
      response += `**${index + 1}. ${video.caption}**\n`
      response += `👤 ${video.author} • 👁️ ${views} views • ⏱️ ${duration}\n`
      response += `🔗 ${video.url}\n\n`
    })

    response += `💡 **What would you like to do next?**\n`
    response += `• Ask me to transcribe any of these videos\n`
    response += `• Generate a script based on a video\n`
    response += `• Search for different content`

    return response
  }

  private formatTranscriptionResult(result: any, videoTitle?: string): string {
    if (!result.transcript) {
      return "I couldn't transcribe that video. It might be private or unavailable."
    }

    const title = videoTitle ? ` for "${videoTitle}"` : ""
    let response = `📝 **Transcription complete${title}!**\n\n`
    response += `**Transcript:**\n${result.transcript}\n\n`
    response += `💡 **Next steps:**\n`
    response += `• Ask me to generate a viral script from this transcript\n`
    response += `• Search for more videos to analyze\n`
    response += `• Get content optimization tips`

    return response
  }

  private formatScriptResult(result: any): string {
    if (!result.script) {
      return "I couldn't generate a script. Please try again with different parameters."
    }

    let response = `🎬 **Your viral script is ready!**\n\n`
    response += `${result.script}\n\n`
    
    if (result.hooks && result.hooks.length > 0) {
      response += `🎯 **Alternative hooks:**\n`
      result.hooks.forEach((hook: string, index: number) => {
        response += `${index + 1}. ${hook}\n`
      })
      response += `\n`
    }

    response += `💡 **Want to improve this script?**\n`
    response += `• Ask me to adjust the tone or style\n`
    response += `• Generate variations for different platforms\n`
    response += `• Get tips for better engagement`

    return response
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  getConversationHistory(): AgentMessage[] {
    return this.conversationHistory
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
} 