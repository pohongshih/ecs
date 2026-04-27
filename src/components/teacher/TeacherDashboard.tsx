import React from 'react';
import { Plus, Users, BookOpen, Trash2, Edit3, ChevronRight, Mic2 } from 'lucide-react';
import { Button } from '../common/Button';
import { 
  createClass, 
  getClassesByTeacher, 
  ClassData, 
  deleteClass, 
  updateClass,
  createHomework, 
  getHomeworkByClass, 
  HomeworkData,
  getSubmissionsByHomework,
  SubmissionData,
  gradeSubmission,
  getUserProfile
} from '../../services/dbService';
import { format } from 'date-fns';
import { analyzeEnglishAudio } from '../../services/aiService';

export const TeacherDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [classes, setClasses] = React.useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<ClassData | null>(null);
  const [homeworks, setHomeworks] = React.useState<HomeworkData[]>([]);
  const [selectedHomework, setSelectedHomework] = React.useState<HomeworkData | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionData[]>([]);
  const [showCreateClass, setShowCreateClass] = React.useState(false);
  const [showEditClass, setShowEditClass] = React.useState(false);
  const [showCreateHomework, setShowCreateHomework] = React.useState(false);
  
  const [loading, setLoading] = React.useState(false);
  const [gradingSubId, setGradingSubId] = React.useState<string | null>(null);
  const [errorObj, setErrorObj] = React.useState<string | null>(null);
  const [studentNames, setStudentNames] = React.useState<Record<string, string>>({});

  // Form states
  const [newClassName, setNewClassName] = React.useState('');
  const [newClassEmails, setNewClassEmails] = React.useState('');
  const [editingClassId, setEditingClassId] = React.useState<string | null>(null);
  const [hwTitle, setHwTitle] = React.useState('');
  const [hwInstructions, setHwInstructions] = React.useState('');
  const [hwDueDate, setHwDueDate] = React.useState('');

  const loadClasses = async () => {
    const data = await getClassesByTeacher(user.uid);
    setClasses(data);
  };

  const loadHomeworks = async (classId: string) => {
    const data = await getHomeworkByClass(classId);
    setHomeworks(data);
  };

  const loadSubmissions = async (hwId: string) => {
    const data = await getSubmissionsByHomework(hwId);
    setSubmissions(data);
    
    // Fetch and map student names
    const names: Record<string, string> = { ...studentNames };
    for (const sub of data) {
      if (!names[sub.studentId]) {
        try {
          const profile = await getUserProfile(sub.studentId);
          names[sub.studentId] = profile?.name || sub.studentId.slice(0, 8);
        } catch (e) {
          names[sub.studentId] = sub.studentId.slice(0, 8);
        }
      }
    }
    setStudentNames(names);
  };

  React.useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createClass({
      name: newClassName,
      teacherId: user.uid,
      description: '',
      studentEmails: newClassEmails.split(',').map(e => e.trim()).filter(e => e)
    });
    setNewClassName('');
    setNewClassEmails('');
    setShowCreateClass(false);
    loadClasses();
    setLoading(false);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId) return;
    setLoading(true);
    await updateClass(editingClassId, {
      name: newClassName,
      studentEmails: newClassEmails.split(',').map(e => e.trim()).filter(e => e)
    });
    setNewClassName('');
    setNewClassEmails('');
    setEditingClassId(null);
    setShowEditClass(false);
    loadClasses();
    setLoading(false);
  };

  const openEditClass = (cls: ClassData) => {
    setEditingClassId(cls.id!);
    setNewClassName(cls.name);
    setNewClassEmails(cls.studentEmails.join(', '));
    setShowEditClass(true);
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass?.id) return;
    setLoading(true);
    await createHomework({
      classId: selectedClass.id,
      title: hwTitle,
      instructions: hwInstructions,
      dueDate: hwDueDate,
      teacherId: user.uid
    });
    setHwTitle('');
    setHwInstructions('');
    setHwDueDate('');
    setShowCreateHomework(false);
    loadHomeworks(selectedClass.id);
    setLoading(false);
  };

  const handleGradeWithAI = async (submission: SubmissionData) => {
    const audioSrc = submission.audioData || submission.audioUrl;
    if (!audioSrc || !submission.id) {
      setErrorObj("No audio data available for this submission.");
      return;
    }
    
    setGradingSubId(submission.id);
    setErrorObj(null);
    try {
      // 1. Extract base64 from data URL
      let base64 = '';
      let mimeType = 'audio/webm';
      if (audioSrc.startsWith('data:')) {
        base64 = audioSrc.split(',')[1];
        mimeType = audioSrc.substring(audioSrc.indexOf(':') + 1, audioSrc.indexOf(';'));
      } else {
        const responseBuffer = await fetch(audioSrc);
        const blobData = await responseBuffer.blob();
        mimeType = blobData.type || 'audio/webm';
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
          reader.readAsDataURL(blobData);
        });
      }

      // 2. Analyze with Gemini
      const title = selectedHomework?.title || "English Speaking Homework";
      const description = selectedHomework?.instructions || "Speak about the given topic clearly.";
      
      const aiResult = await analyzeEnglishAudio(base64, mimeType, title, description);

      // 3. Update Firestore
      await gradeSubmission(submission.id, {
        score: aiResult.score,
        aiFeedback: aiResult.feedback,
        transcript: aiResult.transcript,
        teacherComment: `AI suggests a score of ${aiResult.score}.`
      });

      if (selectedHomework?.id) {
        await loadSubmissions(selectedHomework.id);
      }
    } catch (error) {
      console.error("AI grading failed", error);
      setErrorObj(error instanceof Error ? error.message : "AI Grading failed unpredictably.");
    } finally {
      setGradingSubId(null);
    }
  };

  const deleteClassHandler = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClass(id);
      loadClasses();
      if (selectedClass?.id === id) setSelectedClass(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Teacher Console</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs italic">Management & AI Grading System</p>
        </div>
        <Button onClick={() => setShowCreateClass(true)} className="gap-3 px-8 py-4 text-base font-black shadow-2xl shadow-indigo-100">
          <Plus className="w-5 h-5" />
          <span>New Class</span>
        </Button>
      </div>

      {errorObj && (
        <div className="col-span-12 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <p className="text-sm font-bold">{errorObj}</p>
          <Button variant="ghost" className="text-red-700 hover:bg-red-100 p-2" onClick={() => setErrorObj(null)}>Dismiss</Button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="col-span-12 grid grid-cols-12 gap-6 flex-grow">
        {/* Classes List Bento */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              My Classes
            </h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{classes.length}</span>
          </div>
          <div className="flex-grow overflow-auto max-h-[500px] divide-y divide-slate-50">
            {classes.length === 0 && <p className="p-12 text-center text-slate-400 italic font-medium">Create your first class.</p>}
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                className={`p-5 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group ${selectedClass?.id === cls.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                onClick={() => { setSelectedClass(cls); loadHomeworks(cls.id!); setSelectedHomework(null); }}
              >
                <div>
                  <h4 className="font-black text-slate-900 tracking-tight">{cls.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cls.studentEmails.length} Enrolled</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); openEditClass(cls); }}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteClassHandler(cls.id!); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homework List Bento */}
        <div className={`col-span-12 md:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${!selectedClass ? 'opacity-30' : ''}`}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Active Homework
            </h3>
            {selectedClass && (
              <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] px-3 font-black uppercase tracking-widest" onClick={() => setShowCreateHomework(true)}>
                <Plus className="w-3 h-3 mr-1" /> Add 
              </Button>
            )}
          </div>
          <div className="flex-grow overflow-auto divide-y divide-slate-50">
            {selectedClass && homeworks.length === 0 && <p className="p-12 text-center text-slate-400 italic font-medium">Assign homework for this class.</p>}
            {homeworks.map((hw) => (
              <div 
                key={hw.id} 
                className={`p-5 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group ${selectedHomework?.id === hw.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                onClick={() => { setSelectedHomework(hw); loadSubmissions(hw.id!); }}
              >
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 tracking-tight truncate">{hw.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Due: {hw.dueDate}</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-200 ${selectedHomework?.id === hw.id ? 'rotate-90 text-indigo-600' : ''}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Submissions List Bento */}
        <div className={`col-span-12 md:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${!selectedHomework ? 'opacity-30' : ''}`}>
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-indigo-600" />
              Grading Center
            </h3>
          </div>
          <div className="flex-grow overflow-auto max-h-[500px] divide-y divide-slate-50 space-y-3 p-4">
            {selectedHomework && submissions.length === 0 && <p className="p-12 text-center text-slate-400 italic font-medium">Awaiting submissions.</p>}
            {submissions.map((sub) => (
              <div key={sub.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</p>
                    <h5 className="text-sm font-black text-slate-900 truncate max-w-[120px]">{studentNames[sub.studentId] || sub.studentId.slice(0, 8)}</h5>
                    <p className={`text-[10px] font-black uppercase px-3 py-1 rounded-full inline-block mt-2 border ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100 animate-pulse'}`}>
                      {sub.status}
                    </p>
                  </div>
                  {sub.score !== undefined && (
                    <div className="text-right">
                      <span className="text-3xl font-black text-indigo-600 leading-none">{sub.score}</span>
                      <span className="block text-[10px] font-black text-slate-300 uppercase">Score/100</span>
                    </div>
                  )}
                </div>
                
                <audio src={sub.audioData || sub.audioUrl} controls className="w-full h-10 accent-indigo-600" />
                
                <div className="flex gap-3">
                  <Button className="flex-1 text-[10px] uppercase tracking-widest font-black py-3 rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => handleGradeWithAI(sub)} disabled={gradingSubId === sub.id}>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 shadow-[0_0_8px_cyan]"></span>
                    {gradingSubId === sub.id ? 'Analyzing...' : 'AI Auto-Grade'}
                  </Button>
                </div>

                {sub.status === 'graded' && (
                  <div className="bg-indigo-900 p-5 rounded-2xl text-white space-y-3 shadow-lg shadow-indigo-100">
                    <h6 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] pb-2 border-b border-indigo-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span> AI Report
                    </h6>
                    <p className="text-xs opacity-90 leading-relaxed italic">"{sub.aiFeedback}"</p>
                    <div className="pt-2">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Transcript</p>
                       <p className="text-xs text-indigo-200 italic line-clamp-2">"{sub.transcript}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] max-w-md w-full p-10 border border-slate-100 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-full"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter">Initialize New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Unique Class Name</label>
                <input 
                  type="text" 
                  required 
                  value={newClassName} 
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold" 
                  placeholder="English Grade 12 Advanced"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Enrollment List (Emails)</label>
                <textarea 
                  value={newClassEmails} 
                  onChange={(e) => setNewClassEmails(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all h-32 font-medium" 
                  placeholder="student1@mail.com, student2@mail.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowCreateClass(false)}>Cancel</Button>
                <Button className="flex-1" type="submit" disabled={loading}>Create Class</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] max-w-md w-full p-10 border border-slate-100 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-full"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter">Edit Class Details</h3>
            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Class Name</label>
                <input 
                  type="text" 
                  required 
                  value={newClassName} 
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Enrollment List</label>
                <textarea 
                  value={newClassEmails} 
                  onChange={(e) => setNewClassEmails(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all h-32 font-medium" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowEditClass(false)}>Cancel</Button>
                <Button className="flex-1" type="submit" disabled={loading}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateHomework && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] max-w-md w-full p-10 border border-slate-100 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-full"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter truncate">Assign Homework</h3>
            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Homework Title</label>
                <input 
                  type="text" 
                  required 
                  value={hwTitle} 
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold" 
                  placeholder="Unit 1: Self Intro"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Instructions / Topic</label>
                <textarea 
                  required 
                  value={hwInstructions} 
                  onChange={(e) => setHwInstructions(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all h-24 font-medium" 
                  placeholder="Explain your favorite food..."
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Deadline</label>
                <input 
                  type="date" 
                  required 
                  value={hwDueDate} 
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowCreateHomework(false)}>Cancel</Button>
                <Button className="flex-1" type="submit" disabled={loading}>Dispatch HW</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
