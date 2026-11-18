/**
 * Extracts 16kHz mono PCM WAV audio directly inside the user's browser using Web Audio API.
 * Runs in ~1 second with zero server CPU and zero bandwidth.
 */
export async function extractAudioFromVideoBlob(videoBlob: Blob): Promise<Blob> {
  const arrayBuffer = await videoBlob.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBufferToWavBlob(audioBuffer, 16000);
  } finally {
    audioCtx.close();
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer, targetSampleRate = 16000): Blob {
  const numChannels = 1;
  const sourceData = buffer.getChannelData(0);
  const ratio = buffer.sampleRate / targetSampleRate;
  const newLength = Math.round(sourceData.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetSource = 0;
  while (offsetResult < newLength) {
    const nextOffsetSource = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetSource; i < nextOffsetSource && i < sourceData.length; i++) {
      accum += sourceData[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetSource = nextOffsetSource;
  }

  const wavBytes = new Uint8Array(44 + result.length * 2);
  const view = new DataView(wavBytes.buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + result.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, result.length * 2, true);

  let pcmOffset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pcmOffset += 2;
  }

  return new Blob([wavBytes], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
