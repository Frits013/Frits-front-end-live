# Backend Speech Processing Notes

## Current State
- Backend only handles text messages via `/chat/send_message`
- No audio processing capabilities

## What Needs to Be Added

### 1. Speech-to-Text Endpoint
Create a new endpoint in your FastAPI backend:
```python
@app.post("/chat/speech_to_text")
async def speech_to_text(audio_file: UploadFile):
    # Convert audio to text using OpenAI Whisper
    # Return transcript to be processed by your LLM agent
```

### 2. Audio Processing Pipeline
1. Frontend records audio
2. Send audio to `/chat/speech_to_text` endpoint
3. Backend converts audio to text using Whisper
4. Send text to existing LLM agent
5. Return response

### 3. Required Dependencies
- `openai` (for Whisper API)
- Audio file handling libraries
- Proper audio format support (WAV, MP3, etc.)

### 4. Frontend Changes Needed
- Add audio recording functionality
- Send audio files to new endpoint
- Handle audio processing states

## Implementation Priority
1. Add speech-to-text endpoint to FastAPI backend
2. Test with simple audio files
3. Integrate with existing LLM agent
4. Add frontend audio recording