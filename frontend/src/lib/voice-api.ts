const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'

export interface VoiceProcessingResponse {
  success: boolean
  transcription: string
  aiResponse: string
  extractedData: any
  error?: string
}

let globalAudioContext: AudioContext | null = null

export async function processVoiceInput(
  audioBlob: Blob,
  conversationHistory: any[] = [],
  extractedData: any = {},
  sessionId: string
): Promise<VoiceProcessingResponse> {
  try {
    console.log("🎙️ Sending voice input to backend for processing...")

    const formData = new FormData()
    formData.append("audio", audioBlob, "audio.webm")
    formData.append("conversationHistory", JSON.stringify(conversationHistory))
    formData.append("extractedData", JSON.stringify(extractedData))

    const response = await fetch(`${API_BASE_URL}/voice/process`, {
      method: "POST",
      headers: {
        'X-Session-ID': sessionId
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Request failed: ${response.status}`)
    }

    const transcription = decodeURIComponent(
      response.headers.get("X-Transcription") || ""
    )
    const aiResponse = decodeURIComponent(
      response.headers.get("X-AI-Response") || ""
    )
    const extractedDataHeader = response.headers.get("X-Extracted-Data")

    const parsedExtractedData = extractedDataHeader
      ? JSON.parse(decodeURIComponent(extractedDataHeader))
      : {}

    const audioBuffer = await response.arrayBuffer()

    console.log("✅ Voice processing successful")
    console.log("📝 Transcription:", transcription)
    console.log("🤖 AI Response:", aiResponse)

    if (audioBuffer.byteLength > 0) {
      await playAudioBuffer(audioBuffer)
    }

    return {
      success: true,
      transcription,
      aiResponse,
      extractedData: parsedExtractedData,
    }
  } catch (error) {
    console.error("❌ Voice processing error:", error)
    return {
      success: false,
      transcription: "",
      aiResponse: "",
      extractedData: {},
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function convertTextToSpeech(
  text: string,
  sessionId?: string
): Promise<boolean> {
  try {
    console.log("🔊 Converting text to speech via backend...")

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (sessionId) {
      headers['X-Session-ID'] = sessionId
    }

    const response = await fetch(`${API_BASE_URL}/voice/text-to-speech`, {
      method: "POST",
      headers,
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

export async function testVoiceConnection(): Promise<boolean> {
  try {
    console.log("🔍 Testing voice service connection...")

    const response = await fetch(`${API_BASE_URL}/voice/test-connection`)
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

async function playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
  try {
    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    const audioContext = globalAudioContext
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const decodedData = await audioContext.decodeAudioData(audioBuffer)
    const source = audioContext.createBufferSource()
    source.buffer = decodedData
    source.connect(audioContext.destination)

    return new Promise((resolve) => {
      source.onended = () => {
        source.disconnect()
        resolve()
      }
      source.start(0)
    })
  } catch (error) {
    console.error("❌ Error playing audio:", error)
    
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
      console.error("❌ Audio fallback failed:", fallbackError)
      throw fallbackError
    }
  }
}

export async function recordAudio(options = { 
  silenceTimeout: 2000, 
  maxDuration: 15000 
}): Promise<{
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

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    let silenceStart = Date.now()
    let isNoisy = false
    let vadInterval: NodeJS.Timeout

    const checkVAD = () => {
      analyser.getByteFrequencyData(dataArray)
      
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      
      if (average > 25) {
        isNoisy = true
        silenceStart = Date.now()
      } else if (isNoisy && Date.now() - silenceStart > options.silenceTimeout) {
        stop().catch(console.error)
      }
    }

    const start = () => {
      audioChunks = []
      isRecording = true
      mediaRecorder.start()
      silenceStart = Date.now()
      
      vadInterval = setInterval(checkVAD, 100)
      
      setTimeout(() => {
        if (isRecording) {
          stop().catch(console.error)
        }
      }, options.maxDuration)
    }

    const stop = (): Promise<Blob> => {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          isRecording = false
          clearInterval(vadInterval)
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()

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