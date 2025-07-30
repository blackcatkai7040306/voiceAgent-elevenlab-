const API_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL

export interface VoiceProcessingResponse {
  success: boolean
  transcription: string
  aiResponse: string
  extractedData: any
  followUpQuestions: string[]
  error?: string
}

/**
 * Process voice input by sending audio to backend
 * Backend handles STT, AI processing, and TTS
 */
export async function processVoiceInput(
  audioBlob: Blob,
  conversationHistory: any[] = [],
  extractedData: any = {}
): Promise<VoiceProcessingResponse> {
  try {
    console.log("🎙️ Sending voice input to backend for processing...")

    const formData = new FormData()
    formData.append("audio", audioBlob, "audio.webm")
    formData.append("conversationHistory", JSON.stringify(conversationHistory))
    formData.append("extractedData", JSON.stringify(extractedData))

    const response = await fetch(`${API_BASE_URL}/api/voice/process`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Request failed: ${response.status}`)
    }

    // Get data from headers
    const transcription = decodeURIComponent(
      response.headers.get("X-Transcription") || ""
    )
    const aiResponse = decodeURIComponent(
      response.headers.get("X-AI-Response") || ""
    )
    const extractedDataHeader = response.headers.get("X-Extracted-Data")
    const followUpQuestionsHeader = response.headers.get(
      "X-Follow-Up-Questions"
    )

    const parsedExtractedData = extractedDataHeader
      ? JSON.parse(decodeURIComponent(extractedDataHeader))
      : {}
    const parsedFollowUpQuestions = followUpQuestionsHeader
      ? JSON.parse(decodeURIComponent(followUpQuestionsHeader))
      : []

    // Get audio data
    const audioBuffer = await response.arrayBuffer()

    console.log("✅ Voice processing successful")
    console.log("📝 Transcription:", transcription)
    console.log("🤖 AI Response:", aiResponse)

    // Play the audio response
    if (audioBuffer.byteLength > 0) {
      await playAudioBuffer(audioBuffer)
    }

    return {
      success: true,
      transcription,
      aiResponse,
      extractedData: parsedExtractedData,
      followUpQuestions: parsedFollowUpQuestions,
    }
  } catch (error) {
    console.error("❌ Voice processing error:", error)
    return {
      success: false,
      transcription: "",
      aiResponse: "",
      extractedData: {},
      followUpQuestions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Convert text to speech using backend
 */
export async function convertTextToSpeech(text: string): Promise<boolean> {
  try {
    console.log("🔊 Converting text to speech via backend...")

    const response = await fetch(`${API_BASE_URL}/api/voice/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Request failed: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()

    if (audioBuffer.byteLength > 0) {
      await playAudioBuffer(audioBuffer)
      return true
    }

    return false
  } catch (error) {
    console.error("❌ Text-to-speech error:", error)
    return false
  }
}

/**
 * Test connection to voice service
 */
export async function testVoiceConnection(): Promise<boolean> {
  try {
    console.log("🔍 Testing voice service connection...")

    const response = await fetch(`${API_BASE_URL}/api/voice/test-connection`)
    const data = await response.json()

    const isConnected = data.success && data.connected
    console.log(
      isConnected
        ? "✅ Voice service connected"
        : "❌ Voice service connection failed"
    )

    return isConnected
  } catch (error) {
    console.error("❌ Voice connection test failed:", error)
    return false
  }
}

/**
 * Play audio buffer using Web Audio API
 */
async function playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
  try {
    const audioContext = new AudioContext()
    const decodedData = await audioContext.decodeAudioData(audioBuffer)

    const source = audioContext.createBufferSource()
    source.buffer = decodedData
    source.connect(audioContext.destination)

    return new Promise((resolve) => {
      source.onended = () => resolve()
      source.start()
    })
  } catch (error) {
    console.error("❌ Error playing audio:", error)
    // Fallback: try to create audio element
    try {
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.play()
      })
    } catch (fallbackError) {
      console.error("❌ Audio fallback also failed:", fallbackError)
      throw fallbackError
    }
  }
}

/**
 * Record audio from microphone
 */
export async function recordAudio(): Promise<{
  start: () => void
  stop: () => Promise<Blob>
  isRecording: () => boolean
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    let mediaRecorder: MediaRecorder
    let audioChunks: Blob[] = []
    let isRecording = false

    // Determine the best supported audio format
    let mimeType = "audio/webm;codecs=opus"
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm"
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4"
    } else if (MediaRecorder.isTypeSupported("audio/wav")) {
      mimeType = "audio/wav"
    }

    console.log("🎵 Using audio format:", mimeType)

    mediaRecorder = new MediaRecorder(stream, { mimeType })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    const start = () => {
      audioChunks = []
      isRecording = true
      mediaRecorder.start()
      console.log("🎤 Recording started")
    }

    const stop = (): Promise<Blob> => {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          isRecording = false
          stream.getTracks().forEach((track) => track.stop())

          const audioBlob = new Blob(audioChunks, { type: mimeType })
          console.log("⏹️ Recording stopped, audio size:", audioBlob.size)
          resolve(audioBlob)
        }

        mediaRecorder.stop()
      })
    }

    const isRecordingFn = () => isRecording

    return { start, stop, isRecording: isRecordingFn }
  } catch (error) {
    console.error("❌ Error setting up audio recording:", error)
    throw error
  }
}
