'use client'

import React, { useState } from 'react'
import { Zap, Copy, Download, RefreshCw, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScriptSection {
  type: 'hook' | 'intro' | 'body' | 'cta'
  content: string
  timestamp?: string
}

interface GeneratedScript {
  id: string
  title: string
  sections: ScriptSection[]
  tone: string
  duration: number
  hooks: string[]
  suggestions: string[]
}

export default function ScriptGenerator() {
  const [inputText, setInputText] = useState('')
  const [niche, setNiche] = useState('')
  const [tone, setTone] = useState('engaging')
  const [duration, setDuration] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null)

  const toneOptions = [
    { value: 'engaging', label: 'Engaging & Fun' },
    { value: 'educational', label: 'Educational' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'dramatic', label: 'Dramatic' },
  ]

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Please provide some input text or transcript')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          niche,
          tone,
          duration
        })
      })

      if (!response.ok) throw new Error('Failed to generate script')
      
      const data = await response.json()
      setGeneratedScript(data.script)
      toast.success('Script generated successfully!')
    } catch (error) {
      toast.error('Failed to generate script')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const downloadScript = () => {
    if (!generatedScript) return
    
    const scriptText = generatedScript.sections
      .map(section => `${section.type.toUpperCase()}: ${section.content}`)
      .join('\n\n')
    
    const blob = new Blob([scriptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedScript.title.replace(/\s+/g, '_')}_script.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Generate Viral Script
        </h3>
        <p className="text-gray-600 mb-6">
          Input a transcript, video idea, or trending content to generate a personalized viral script.
        </p>
        
        <div className="space-y-6">
          {/* Input Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Text / Transcript
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste a video transcript, describe your video idea, or input trending content..."
              rows={6}
              className="input-field resize-none"
            />
          </div>

          {/* Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niche/Topic
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., fitness, cooking, tech"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-field"
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating Script...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Generate Script</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Script */}
      {generatedScript && (
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {generatedScript.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Tone: {generatedScript.tone}</span>
                <span>Duration: {generatedScript.duration}s</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(
                  generatedScript.sections.map(s => s.content).join('\n\n')
                )}
                className="btn-secondary flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={downloadScript}
                className="btn-secondary flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleGenerate}
                className="btn-secondary flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Script Sections */}
          <div className="space-y-6">
            {generatedScript.sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {section.type}
                    {section.timestamp && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({section.timestamp})
                      </span>
                    )}
                  </h4>
                  <button
                    onClick={() => copyToClipboard(section.content)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Alternative Hooks */}
          {generatedScript.hooks.length > 0 && (
            <div className="mt-8 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Alternative Hooks
              </h4>
              <div className="space-y-2">
                {generatedScript.hooks.map((hook, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-purple-800 text-sm">{hook}</p>
                    <button
                      onClick={() => copyToClipboard(hook)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {generatedScript.suggestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">
                💡 Optimization Suggestions
              </h4>
              <ul className="space-y-1">
                {generatedScript.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 