/**
 * Magic byte validation for audio files
 * Provides additional security by verifying file headers match expected audio formats
 */

interface MagicByteDef {
  signature: number[];
  offset?: number;
  description: string;
}

const AUDIO_MAGIC_BYTES: MagicByteDef[] = [
  // MP3 files
  { signature: [0xFF, 0xFB], offset: 0, description: "MP3 (MPEG-1 Layer 3)" },
  { signature: [0xFF, 0xF3], offset: 0, description: "MP3 (MPEG-1 Layer 3)" },
  { signature: [0xFF, 0xF2], offset: 0, description: "MP3 (MPEG-1 Layer 3)" },
  { signature: [0x49, 0x44, 0x33], offset: 0, description: "MP3 with ID3v2 tag" }, // "ID3"
  
  // WAV files
  { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, description: "WAV (RIFF header)" }, // "RIFF"
  
  // OGG files
  { signature: [0x4F, 0x67, 0x67, 0x53], offset: 0, description: "OGG Vorbis" }, // "OggS"
  
  // M4A/AAC files
  { signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], offset: 0, description: "M4A" }, // "ftypM4A"
  { signature: [0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], offset: 4, description: "M4A (alternative)" }, // "ftypM4A" at offset 4
  
  // FLAC files
  { signature: [0x66, 0x4C, 0x61, 0x43], offset: 0, description: "FLAC" }, // "fLaC"
];

/**
 * Validates if the file buffer starts with any known audio magic bytes
 */
export function validateAudioMagicBytes(buffer: Buffer): { isValid: boolean; detectedType?: string } {
  if (!buffer || buffer.length < 12) {
    return { isValid: false };
  }

  for (const magicByte of AUDIO_MAGIC_BYTES) {
    const offset = magicByte.offset || 0;
    
    // Ensure we have enough bytes to check
    if (buffer.length < offset + magicByte.signature.length) {
      continue;
    }
    
    // Check if the signature matches
    let matches = true;
    for (let i = 0; i < magicByte.signature.length; i++) {
      if (buffer[offset + i] !== magicByte.signature[i]) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      return { 
        isValid: true, 
        detectedType: magicByte.description 
      };
    }
  }

  return { isValid: false };
}

/**
 * Validates file extension against detected magic bytes for consistency
 */
export function validateFileConsistency(buffer: Buffer, filename: string, mimeType: string): { isValid: boolean; reason?: string } {
  const magicValidation = validateAudioMagicBytes(buffer);
  
  if (!magicValidation.isValid) {
    return { 
      isValid: false, 
      reason: "File does not appear to be a valid audio file (invalid magic bytes)" 
    };
  }

  // Additional consistency checks could be added here
  // For now, if magic bytes are valid for any audio format, we accept it
  // The music-metadata library will do deeper validation
  
  return { isValid: true };
}