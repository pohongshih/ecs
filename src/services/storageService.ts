import { storage, ref, uploadBytes, getDownloadURL } from '../lib/firebase';

export async function uploadAudio(file: Blob, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}
