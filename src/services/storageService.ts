import { storage, ref, uploadString, getDownloadURL } from '../lib/firebase';

export async function uploadAudio(file: Blob, path: string): Promise<string> {
  if (file.size === 0) {
    throw new Error("Recording is empty (0 bytes). Please record again.");
  }
  const fileRef = ref(storage, path);
  const metadata = { contentType: file.type || 'audio/mp4' };
  
  // Convert blob to base64 (data_url format) to prevent iOS Safari upload hang issues
  const base64DataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  await uploadString(fileRef, base64DataUrl, 'data_url', metadata);
  return await getDownloadURL(fileRef);
}
