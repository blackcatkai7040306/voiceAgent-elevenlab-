interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  model: string
  voice_settings: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export class ElevenLabsClient {
  private config: ElevenLabsConfig
  private baseUrl = "https://api.elevenlabs.io/v1"

  constructor(config: ElevenLabsConfig) {
    this.config = config
  }

  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.config.voiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: this.config.model,
            voice_settings: this.config.voice_settings,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error("Error generating speech:", error)
      throw error
    }
  }

  async textToSpeechStream(text: string): Promise<ReadableStream> {
    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.config.voiceId}/stream`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: this.config.model,
            voice_settings: this.config.voice_settings,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      return response.body!
    } catch (error) {
      console.error("Error generating speech stream:", error)
      throw error
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.config.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.voices
    } catch (error) {
      console.error("Error fetching voices:", error)
      throw error
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new AudioContext()

        audioContext
          .decodeAudioData(audioBuffer)
          .then((decodedData) => {
            const source = audioContext.createBufferSource()
            source.buffer = decodedData
            source.connect(audioContext.destination)

            source.onended = () => resolve()
            source.start()
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  createAudioUrl(audioBuffer: ArrayBuffer): string {
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
    return URL.createObjectURL(blob)
  }
}

// Create client instance with environment variables
export const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "sk_8a53c6b4b716cc206df1806ef03ef165def50417ccec09eb",
  voiceId:
    process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  model: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL || "eleven_monolingual_v1",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: true,
  },
})

// Helper function to speak text using ElevenLabs
export const speakText = async (text: string): Promise<void> => {
  try {
    const audioBuffer = await elevenLabsClient.textToSpeech(text)
    await elevenLabsClient.playAudio(audioBuffer)
  } catch (error) {
    console.error("Error speaking text:", error)
    // Fallback to browser speech synthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    speechSynthesis.speak(utterance)
  }
}

// Helper function to create audio element from text
export const createAudioElement = async (
  text: string
): Promise<HTMLAudioElement> => {
  try {
    const audioBuffer = await elevenLabsClient.textToSpeech(text)
    const audioUrl = elevenLabsClient.createAudioUrl(audioBuffer)

    const audio = new Audio(audioUrl)
    return audio
  } catch (error) {
    console.error("Error creating audio element:", error)
    throw error
  }
}
