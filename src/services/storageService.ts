import { storage, ref, uploadBytes, getDownloadURL } from '../lib/firebase';

export async function uploadAudio(file: Blob, path: string): Promise<string> {
  if (file.size === 0) {
    throw new Error("Recording is empty (0 bytes). Please record again.");
  }
  const fileRef = ref(storage, path);
  const metadata = { contentType: file.type || 'audio/mp4' };
  
  // Convert to Uint8Array to prevent iOS Safari upload hang issues
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  await uploadBytes(fileRef, uint8Array, metadata);
  return await getDownloadURL(fileRef);
}
