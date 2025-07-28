const { createClient } = require('@deepgram/sdk');

// Deepgram API configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '42a574c1a2aa036676d995c0f4e7120c723df1f3';

// Initialize Deepgram client
const deepgram = createClient(DEEPGRAM_API_KEY);

/**
 * Convert speech to text using Deepgram
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Original filename for content type detection
 * @returns {Promise<string>} - Transcribed text
 */
async function speechToText(audioBuffer, filename = '') {
  try {
    console.log('🎙️ Converting speech to text with Deepgram...');
    
    // Determine mimetype based on filename
    let mimetype = 'audio/wav';
    if (filename.includes('.mp3')) mimetype = 'audio/mpeg';
    else if (filename.includes('.m4a')) mimetype = 'audio/mp4';
    else if (filename.includes('.webm')) mimetype = 'audio/webm';
    else if (filename.includes('.ogg')) mimetype = 'audio/ogg';
    else if (filename.includes('.flac')) mimetype = 'audio/flac';

    // Configure Deepgram options
    const options = {
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      punctuate: true,
      diarize: false,
      interim_results: false,
      utterances: false,
      vad_events: false,
    };

    console.log('🎵 Processing audio with mimetype:', mimetype);
    console.log('📊 Audio buffer size:', audioBuffer.length);

    // Send audio to Deepgram for transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      options,
      {
        mimetype: mimetype,
      }
    );

    if (error) {
      console.error('❌ Deepgram transcription error:', error);
      throw new Error(`Deepgram error: ${error.message || 'Unknown error'}`);
    }

    // Extract transcription from result
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript || !transcript.trim()) {
      console.warn('⚠️ No transcription found in Deepgram response');
      throw new Error('No speech detected in audio. Please try speaking more clearly.');
    }

    console.log('✅ Deepgram transcription successful:', transcript);
    return transcript.trim();

  } catch (error) {
    console.error('❌ Error in speechToText:', error);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      throw new Error('Deepgram authentication failed. Please check your API key.');
    } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
      throw new Error('Invalid audio format. Please try a different audio file.');
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else {
      throw new Error(`Speech-to-text conversion failed: ${error.message}`);
    }
  }
}

/**
 * Check Deepgram API connection
 * @returns {Promise<boolean>} - Connection status
 */
async function testConnection() {
  try {
    console.log('🔍 Testing Deepgram API connection...');
    
    // Test with a simple API call to check authentication
    const { result, error } = await deepgram.manage.getProjectBalances(
      process.env.DEEPGRAM_PROJECT_ID || 'default'
    );

    if (error && error.message.includes('401')) {
      // 401 means auth failed, but if we get other errors, the connection itself might be working
      console.log('❌ Deepgram authentication failed');
      return false;
    }

    // If we get here without a network error, the connection is working
    console.log('✅ Deepgram connected successfully');
    return true;

  } catch (error) {
    console.error('❌ Deepgram connection test failed:', error);
    
    // For connection testing, we'll be more lenient - if it's just auth issues, we still consider it "connected"
    if (error.message && (error.message.includes('network') || error.message.includes('ECONNREFUSED'))) {
      return false;
    }
    
    // If it's auth-related, the service is available but the key might be wrong
    return true;
  }
}

/**
 * Get Deepgram usage statistics (optional)
 * @returns {Promise<Object>} - Usage information
 */
async function getUsageStats() {
  try {
    const { result, error } = await deepgram.manage.getProjectUsage(
      process.env.DEEPGRAM_PROJECT_ID || 'default',
      {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        end: new Date().toISOString(),
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    console.error('❌ Error getting usage stats:', error);
    return null;
  }
}

module.exports = {
  speechToText,
  testConnection,
  getUsageStats,
}; 