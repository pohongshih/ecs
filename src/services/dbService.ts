import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';

export interface ClassData {
  id?: string;
  name: string;
  teacherId: string;
  description: string;
  studentEmails: string[];
  createdAt: any;
}

export interface HomeworkData {
  id?: string;
  classId: string;
  title: string;
  instructions: string;
  dueDate: string;
  teacherId: string;
  createdAt: any;
}

export interface SubmissionData {
  id?: string;
  homeworkId: string;
  studentId: string;
  audioData?: string;
  audioUrl?: string; // Keep for backward compatibility
  status: 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  aiFeedback?: string;
  teacherComment?: string;
  transcript?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  classIds?: string[];
  createdAt: any;
}

// --- User Profile ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function createUserProfile(profile: UserProfile) {
  try {
    await setDoc(doc(db, 'users', profile.uid), profile);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${profile.uid}`);
  }
}

// --- Classes ---
export async function createClass(classData: Omit<ClassData, 'id' | 'createdAt'>) {
  try {
    const newDocRef = doc(collection(db, 'classes'));
    await setDoc(newDocRef, {
      ...classData,
      createdAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'classes');
  }
}

export async function getClassesByTeacher(teacherId: string) {
  try {
    const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'classes');
    return [];
  }
}

export async function getClassesForStudent(email: string) {
  try {
    const q = query(collection(db, 'classes'), where('studentEmails', 'array-contains', email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'classes');
    return [];
  }
}

export async function updateClass(id: string, data: Partial<ClassData>) {
  try {
    await updateDoc(doc(db, 'classes', id), data);
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `classes/${id}`);
  }
}

export async function deleteClass(id: string) {
  try {
    await deleteDoc(doc(db, 'classes', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `classes/${id}`);
  }
}

// --- Homework ---
export async function createHomework(homework: Omit<HomeworkData, 'id' | 'createdAt'>) {
  try {
    const newDocRef = doc(collection(db, 'homeworks'));
    await setDoc(newDocRef, {
      ...homework,
      createdAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'homeworks');
  }
}

export async function getHomeworkByClass(classId: string) {
  try {
    const q = query(collection(db, 'homeworks'), where('classId', '==', classId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeworkData));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'homeworks');
    return [];
  }
}

// --- Submissions ---
export async function submitHomework(submission: Omit<SubmissionData, 'id' | 'createdAt'>) {
  try {
    const newDocRef = doc(collection(db, 'submissions'));
    await setDoc(newDocRef, {
      ...submission,
      createdAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'submissions');
  }
}

export async function getSubmissionsByHomework(homeworkId: string) {
  try {
    const q = query(collection(db, 'submissions'), where('homeworkId', '==', homeworkId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionData));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'submissions');
    return [];
  }
}

export async function getSubmissionByStudentAndHomework(studentId: string, homeworkId: string) {
  try {
    const q = query(
      collection(db, 'submissions'), 
      where('studentId', '==', studentId),
      where('homeworkId', '==', homeworkId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const d = querySnapshot.docs[0];
      return { id: d.id, ...d.data() } as SubmissionData;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'submissions');
    return null;
  }
}

export async function gradeSubmission(id: string, grade: Partial<SubmissionData>) {
  try {
    await updateDoc(doc(db, 'submissions', id), {
      ...grade,
      status: 'graded',
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `submissions/${id}`);
  }
}

export async function getStudentPastSubmissions(studentId: string) {
  try {
    const q = query(collection(db, 'submissions'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionData));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'submissions');
    return [];
  }
}
