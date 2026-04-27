import React from 'react';
import { auth, onAuthStateChanged } from './lib/firebase';
import { getUserProfile } from './services/dbService';
import { Auth } from './components/Auth';
import { Layout } from './components/common/Layout';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [role, setRole] = React.useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setRole(profile.role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: any, role: 'teacher' | 'student') => {
    setUser(user);
    setRole(role);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Layout user={user} role={role}>
      {role === 'teacher' ? (
        <TeacherDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
    </Layout>
  );
}

