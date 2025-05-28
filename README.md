# 🎬 OpenScript - AI-Powered Viral Video Script Generator

Transform trending YouTube videos into viral scripts with AI-powered transcription and script generation.

## 🚀 Features

### 🔍 YouTube Trend Discovery
- **Real-time Search**: Find trending videos by keyword, topic, or niche
- **Popular Videos**: Get the most popular videos in your region
- **Engagement Metrics**: View counts, likes, comments, and estimated shares
- **Video Details**: Thumbnails, duration, publish date, and channel info

### 🎵 AI-Powered Transcription
- **Real Audio Extraction**: Uses `yt-dlp` to download YouTube audio
- **Groq Whisper Integration**: High-accuracy speech-to-text transcription
- **Automatic Cleanup**: Temporary audio files are automatically deleted
- **Error Handling**: Robust handling of private/restricted videos

### 🤖 AI Script Generation
- **Viral Pattern Analysis**: Learns from successful video structures
- **Customizable Tone**: Professional, casual, energetic, or educational
- **Duration Control**: 30 seconds to 10+ minutes
- **Hook Generation**: Attention-grabbing openings and CTAs

### 💬 AI Chat Assistant
- **Content Optimization**: Get suggestions to improve your scripts
- **Trend Analysis**: Understand what makes content go viral
- **Quick Prompts**: Pre-built prompts for common content needs
- **Interactive Refinement**: Iterate and improve your content ideas

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **AI APIs**: Groq Whisper (transcription), Friendli.ai (script generation)
- **Video Processing**: yt-dlp for YouTube audio extraction
- **Data Source**: YouTube Data API v3
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js 18+** installed
2. **yt-dlp** installed (for audio extraction)
3. **API Keys**:
   - YouTube Data API v3 key
   - Groq API key (for Whisper transcription)
   - Friendli.ai API key (for script generation)

### Installing yt-dlp

**macOS (Homebrew):**
```bash
brew install yt-dlp
```

**Linux (pip):**
```bash
pip install yt-dlp
```

**Windows:**
Download from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openscript
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   FRIENDLI_API_KEY=your_friendli_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 API Endpoints

### YouTube Trends
- `POST /api/trends/search` - Search for trending videos by keyword
- `POST /api/trends/popular` - Get most popular videos by region

### Transcription
- `POST /api/transcribe` - Download and transcribe YouTube video audio
  ```json
  {
    "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
  ```

### AI Generation
- `POST /api/generate-script` - Generate viral scripts from transcripts
- `POST /api/chat` - Interactive AI chat for content optimization

## 🎯 Usage Examples

### 1. Find Trending Videos
1. Go to the "Find Trends" tab
2. Search for topics like "AI", "productivity", "viral"
3. Or click "Get Most Popular Videos" for trending content

### 2. Transcribe Videos
1. Click "Transcribe" on any video card
2. Wait for audio download and transcription (30-60 seconds)
3. View the full transcript in the video details modal

### 3. Generate Scripts
1. Go to the "Generate Script" tab
2. Paste a transcript or enter your own content
3. Choose tone (casual, professional, energetic, educational)
4. Set target duration (30s to 10+ minutes)
5. Get your viral script with hooks and CTAs

### 4. Optimize with AI Chat
1. Go to the "AI Chat" tab
2. Ask for content improvements, trend analysis, or viral tips
3. Use quick prompts or ask custom questions

## 🔍 Testing Transcription

Test the transcription feature:

```bash
node scripts/test-transcribe.js
```

This will test transcription with a sample YouTube video.

## 📁 Project Structure

```
openscript/
├── app/
│   ├── api/
│   │   ├── trends/          # YouTube API integration
│   │   ├── transcribe/      # Audio transcription
│   │   ├── generate-script/ # AI script generation
│   │   └── chat/           # AI chat assistant
│   ├── components/         # React components
│   └── globals.css        # Tailwind styles
├── temp/audio/            # Temporary audio files (auto-cleanup)
├── scripts/               # Utility scripts
└── README.md
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will handle the build automatically

**Note**: Make sure your deployment environment has `yt-dlp` available, or consider using a Docker container with pre-installed dependencies.

### Docker Deployment

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp
# ... rest of Dockerfile
```

## 🔑 Getting API Keys

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API v3

### Groq API (Whisper)
1. Sign up at [Groq Console](https://console.groq.com/)
2. Create a new API key
3. Copy the key starting with `gsk_`

### Friendli.ai API
1. Sign up at [Friendli.ai](https://friendli.ai/)
2. Navigate to API settings
3. Generate a new API key

## 🛡️ Security & Privacy

- **Temporary Files**: Audio files are automatically deleted after transcription
- **API Keys**: Never commit API keys to version control
- **Rate Limiting**: Respects YouTube API quotas and Groq limits
- **Error Handling**: Graceful handling of private/restricted content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**"yt-dlp not found"**
- Make sure yt-dlp is installed and in your PATH
- Try `yt-dlp --version` to verify installation

**"Failed to download video audio"**
- Video might be private, age-restricted, or region-blocked
- Try with a different public video

**"Groq API key not configured"**
- Check your `.env` file has the correct `GROQ_API_KEY`
- Verify the key is valid in Groq Console

**"YouTube API quota exceeded"**
- YouTube API has daily quotas
- Wait for quota reset or use a different API key

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review API documentation for Groq and YouTube
- Open an issue in the repository

---

**Built for the AI-powered content creation revolution** 🚀