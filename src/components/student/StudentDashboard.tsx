import React from 'react';
import { BookOpen, Clock, CheckCircle2, AlertCircle, ChevronRight, GraduationCap, Mic } from 'lucide-react';
import { Button } from '../common/Button';
import { 
  getClassesForStudent, 
  getHomeworkByClass, 
  getSubmissionByStudentAndHomework,
  submitHomework,
  getStudentPastSubmissions,
  ClassData, 
  HomeworkData, 
  SubmissionData 
} from '../../services/dbService';
import { uploadAudio } from '../../services/storageService';
import { AudioRecorder } from './AudioRecorder';

export const StudentDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [classes, setClasses] = React.useState<ClassData[]>([]);
  const [homeworks, setHomeworks] = React.useState<(HomeworkData & { submission?: SubmissionData | null })[]>([]);
  const [selectedHw, setSelectedHw] = React.useState<(HomeworkData & { submission?: SubmissionData | null }) | null>(null);
  
  const [loading, setLoading] = React.useState(false);
  const [showRecorder, setShowRecorder] = React.useState(false);
  const [errorObj, setErrorObj] = React.useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorObj(null);
    const studentClasses = await getClassesForStudent(user.email);
    setClasses(studentClasses);

    const allHw: (HomeworkData & { submission?: SubmissionData | null })[] = [];
    for (const cls of studentClasses) {
      const clsHw = await getHomeworkByClass(cls.id!);
      for (const hw of clsHw) {
        const sub = await getSubmissionByStudentAndHomework(user.uid, hw.id!);
        allHw.push({ ...hw, submission: sub });
      }
    }
    setHomeworks(allHw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleAudioSave = async (blob: Blob) => {
    if (!selectedHw?.id) return;
    setLoading(true);
    try {
      const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const path = `audio/${user.uid}/${selectedHw.id}_${Date.now()}.${extension}`;
      const url = await uploadAudio(blob, path);
      
      await submitHomework({
        homeworkId: selectedHw.id,
        studentId: user.uid,
        audioUrl: url,
        status: 'submitted'
      });
      
      setShowRecorder(false);
      setSelectedHw(null);
      loadData();
    } catch (error: any) {
      console.error("Submission failed", error);
      const errorMessage = error?.message || JSON.stringify(error);
      setErrorObj("Submission failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 pb-20">
      {/* Welcome Header */}
      <div className="col-span-12 bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 mb-4">
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter">Bonjour, {user.displayName?.split(' ')[0]}!</h2>
          <p className="text-indigo-100 font-bold mt-2 text-lg">You have <span className="text-cyan-300 underline underline-offset-4 decoration-2">{homeworks.filter(h => !h.submission).length} assignments</span> to complete today.</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <GraduationCap className="absolute -bottom-12 -right-12 w-64 h-64 text-indigo-500 opacity-30 rotate-12" />
      </div>

      {/* Status Bento Cards */}
      <div className="col-span-12 md:col-span-3 bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col justify-center items-center shadow-sm">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Average Grade</span>
        <span className="text-4xl font-black text-slate-900">A-</span>
      </div>
      <div className="col-span-12 md:col-span-3 bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col justify-center items-center shadow-sm">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Recordings</span>
        <span className="text-4xl font-black text-slate-900">{homeworks.filter(h => h.submission).length}</span>
      </div>
      <div className="col-span-12 md:col-span-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 p-6 flex items-center gap-6 shadow-sm">
        <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black">AI</div>
        <div>
          <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Recent Feedback</p>
          <p className="text-sm text-emerald-700 italic font-medium leading-tight mt-1 line-clamp-2">"Great improvement on your Unit 3 pronunciation!"</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="col-span-12 grid grid-cols-12 gap-6 mt-4">
        {/* Assignments List Bento */}
        <section className="col-span-12 lg:col-span-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-4 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Assignments List
          </h3>
          <div className="space-y-4">
            {homeworks.length === 0 && !loading && (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-200 text-center">
                <p className="text-slate-400 italic font-medium">No assignments found.</p>
              </div>
            )}
            {homeworks.map((hw) => (
              <div 
                key={hw.id}
                className={`bg-white p-6 rounded-[2rem] border transition-all cursor-pointer group ${selectedHw?.id === hw.id ? 'border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setSelectedHw(hw)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{classes.find(c => c.id === hw.classId)?.name}</p>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{hw.title}</h4>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 ${hw.submission ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                    {hw.submission ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">{hw.submission.status}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase font-mono tracking-tighter">Pending</span>
                      </>
                    )}
                  </div>
                </div>

                {hw.submission?.score !== undefined && (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm border border-slate-100 text-xl">
                      {hw.submission.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Received</p>
                      <p className="text-xs text-slate-600 truncate italic font-medium">"{hw.submission.aiFeedback || 'Excellent attempt!'}"</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    Due: {hw.dueDate}
                  </span>
                  <ChevronRight className={`w-5 h-5 text-slate-200 transition-transform ${selectedHw?.id === hw.id ? 'rotate-90 text-indigo-600' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Content Bento (Recording/Feedback) */}
        <section className="col-span-12 lg:col-span-7">
          <div className="sticky top-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-4 mb-2">Assignment Workspace</h3>
            {!selectedHw ? (
              <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-bold italic">Select an assignment to start working.</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden">
                <div className="p-10 space-y-8">
                  <div>
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest pl-1">Active Assignment</span>
                    <h4 className="text-3xl font-black text-slate-900 mt-2 mb-4 tracking-tighter">{selectedHw.title}</h4>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-slate-600 leading-relaxed italic font-medium">"{selectedHw.instructions}"</p>
                    </div>
                  </div>

                  {!selectedHw.submission && !showRecorder && (
                    <Button className="w-full py-6 text-lg font-black rounded-3xl gap-4" onClick={() => setShowRecorder(true)}>
                      <Mic className="w-6 h-6" />
                      Start Homework Recording
                    </Button>
                  )}

                  {errorObj && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200">
                      {errorObj}
                    </div>
                  )}

                  {showRecorder && !selectedHw.submission && (
                    <div className="pt-8 border-t border-slate-100">
                      <AudioRecorder onSave={handleAudioSave} />
                      <Button variant="ghost" className="w-full mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs" onClick={() => setShowRecorder(false)}>Cancel Recording</Button>
                    </div>
                  )}

                  {selectedHw.submission && (
                    <div className="space-y-8 pt-8 border-t border-slate-100">
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">Audio Submission</p>
                        <audio src={selectedHw.submission.audioUrl} controls className="w-full accent-indigo-600" />
                        <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Submitted at {new Date(selectedHw.submission.createdAt.toDate()).toLocaleString()}</p>
                      </div>

                      {selectedHw.submission.status === 'graded' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-1 p-8 bg-indigo-900 text-white rounded-[2rem] shadow-xl shadow-indigo-100">
                            <h5 className="text-lg font-black mb-6 italic flex items-center gap-2">
                              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                              AI 分析預覽
                            </h5>
                            <div className="space-y-6">
                              <div>
                                <div className="flex justify-between text-[10px] mb-1.5 font-black text-indigo-300 uppercase tracking-widest"><span>Fluency</span><span>85%</span></div>
                                <div className="w-full h-1.5 bg-indigo-800 rounded-full"><div className="w-[85%] h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div></div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] mb-1.5 font-black text-indigo-300 uppercase tracking-widest"><span>Score</span><span>{selectedHw.submission.score}%</span></div>
                                <div className="w-full h-1.5 bg-indigo-800 rounded-full"><div style={{ width: `${selectedHw.submission.score}%` }} className="h-full bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div></div>
                              </div>
                              <div className="bg-indigo-800/40 p-5 rounded-2xl border border-indigo-700/50">
                                <p className="text-xs text-indigo-100 font-medium italic leading-snug">
                                  <span className="text-cyan-300 font-black uppercase inline-block mr-2">AI Feedback:</span> {selectedHw.submission.aiFeedback}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-1 flex flex-col gap-4">
                            <div className="bg-emerald-50 rounded-[2rem] border border-emerald-100 p-8 flex-grow shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xs">TEA</div>
                                <h5 className="font-black text-emerald-900 tracking-tight">老師的評語</h5>
                              </div>
                              <p className="text-sm text-emerald-800 italic font-medium leading-relaxed">
                                「{selectedHw.submission.teacherComment || 'Your oral expression is getting more natural, keep it up!'}」
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-[1.5rem] border border-slate-100 p-6">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Transcript</p>
                               <p className="text-xs text-slate-500 font-mono italic leading-normal">"{selectedHw.submission.transcript}"</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
