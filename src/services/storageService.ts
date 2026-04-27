import { storage, ref, uploadBytes, getDownloadURL } from '../lib/firebase';

export async function uploadAudio(file: Blob, path: string): Promise<string> {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
