const fs = require('fs');
require('dotenv').config();
// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const VOICE_ID = process.env.VOICE_ID; // Josh voice - middle-aged professional male
const API_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs TTS
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Voice settings (optional)
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeech(text, options = {}) {
  try {
    const { default: fetch } = await import('node-fetch');
    console.log('🔊 Converting text to speech with ElevenLabs...');

    const voiceSettings = {
      stability: options.stability || 0.5,
      similarity_boost: options.similarity_boost || 0.5,
      style: options.style || 0.0,
      use_speaker_boost: options.use_speaker_boost || true,
      ...options.voice_settings
    };

    const requestBody = {
      text: text,
      model_id: options.model_id || "eleven_monolingual_v1",
      voice_settings: voiceSettings
    };

    const response = await fetch(`${API_BASE_URL}/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs TTS error:', response.status, errorText);
      throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    console.log('✅ Text-to-speech successful, audio buffer size:', audioBuffer.length);

    return audioBuffer;

  } catch (error) {
    console.error('❌ Error in textToSpeech:', error);
    throw new Error(`Text-to-speech conversion failed: ${error.message}`);
  }
}

/**
 * Get available voices from ElevenLabs
 * @returns {Promise<Array>} - List of available voices
 */
async function getVoices() {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${API_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];

  } catch (error) {
    console.error('❌ Error getting voices:', error);
    throw new Error(`Failed to get voices: ${error.message}`);
  }
}

/**
 * Check ElevenLabs API connection
 * @returns {Promise<boolean>} - Connection status
 */
async function testConnection() {
  try {
    const { default: fetch } = await import('node-fetch');
    console.log('🔍 Testing ElevenLabs API connection...');

    const response = await fetch(`${API_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    const isConnected = response.ok;
    console.log(isConnected ? '✅ ElevenLabs connected' : '❌ ElevenLabs connection failed');

    return isConnected;

  } catch (error) {
    console.error('❌ ElevenLabs connection test failed:', error);
    return false;
  }
}

module.exports = {
  textToSpeech,
  getVoices,
  testConnection,
  VOICE_ID
}; 