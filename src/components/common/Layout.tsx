import React from 'react';
import { LayoutDashboard, Users, BookOpen, GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { auth, signOut } from '../../lib/firebase';
import { Button } from './Button';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  role: 'teacher' | 'student';
}

export const Layout: React.FC<LayoutProps> = ({ children, user, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = role === 'teacher' 
    ? [
        { label: 'Dashboard', icon: LayoutDashboard, path: '#' },
        { label: 'Classes', icon: Users, path: '#' },
        { label: 'Homework', icon: BookOpen, path: '#' },
      ]
    : [
        { label: 'My Assignments', icon: BookOpen, path: '#' },
        { label: 'My Progress', icon: GraduationCap, path: '#' },
      ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">E</div>
          <span className="font-black text-slate-900 tracking-tight">ELT Pro</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 bg-white border-r border-slate-200 w-72 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-8">
          <div className="hidden md:flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-2xl tracking-tighter leading-none">
                ELT <span className="text-indigo-600">Pro</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">AI Studio</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 pl-3">Main Navigation</p>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all duration-200 group font-bold text-sm"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-black overflow-hidden shadow-sm">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">({role})</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl py-4" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
