import React from 'react';
import { signInWithPopup, googleProvider, auth } from '../lib/firebase';
import { GraduationCap, BookOpen, UserCircle } from 'lucide-react';
import { Button } from './common/Button';
import { createUserProfile, getUserProfile } from '../services/dbService';
import { serverTimestamp } from '../lib/firebase';

interface AuthProps {
  onAuthSuccess: (user: any, role: 'teacher' | 'student') => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [showRoleSelect, setShowRoleSelect] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await getUserProfile(result.user.uid);
      
      if (profile) {
        onAuthSuccess(result.user, profile.role);
      } else {
        setCurrentUser(result.user);
        setShowRoleSelect(true);
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = async (role: 'teacher' | 'student') => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await createUserProfile({
        uid: currentUser.uid,
        name: currentUser.displayName || 'Anonymous',
        email: currentUser.email || '',
        role,
        createdAt: serverTimestamp()
      });
      onAuthSuccess(currentUser, role);
    } catch (error) {
      console.error("Role selection failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (showRoleSelect) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">Choose Your Role</h2>
            <p className="text-zinc-500 mt-2">Identify your primary use of the system</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => selectRole('teacher')}
              className="flex flex-col items-center p-6 border-2 border-zinc-100 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100">
                <BookOpen className="w-8 h-8 text-zinc-600 group-hover:text-indigo-600" />
              </div>
              <span className="font-bold text-zinc-900">Teacher</span>
              <span className="text-sm text-zinc-500 text-center mt-1">Manage classes, create content, grade assignments</span>
            </button>
            <button
              onClick={() => selectRole('student')}
              className="flex flex-col items-center p-6 border-2 border-zinc-100 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100">
                <GraduationCap className="w-8 h-8 text-zinc-600 group-hover:text-indigo-600" />
              </div>
              <span className="font-bold text-zinc-900">Student</span>
              <span className="text-sm text-zinc-500 text-center mt-1">Join classes, submit recordings, view feedback</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <GraduationCap className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">ECS</h1>
          <p className="text-lg font-medium text-zinc-500 mb-10">English Coaching System</p>
          
          <div className="w-full space-y-4">
            <Button 
              size="lg" 
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-base flex items-center justify-center gap-3"
              onClick={handleLogin}
              disabled={loading}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
              <span>Continue with Google</span>
            </Button>
            <p className="text-xs text-zinc-400">By continuing, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>
    </div>
  );
};
