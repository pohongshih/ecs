import { storage, ref, uploadBytes, getDownloadURL } from '../lib/firebase';

export async function uploadAudio(file: Blob, path: string): Promise<string> {
  const fileRef = ref(storage, path);
  const metadata = { contentType: file.type || 'audio/mp4' };
  await uploadBytes(fileRef, file, metadata);
  return await getDownloadURL(fileRef);
}
