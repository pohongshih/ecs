import React from 'react';
import { Mic, Square, Play, RefreshCcw, Check, Clock, Award, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';

interface AudioRecorderProps {
  onSave: (blob: Blob) => void;
  maxRecordings?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordings, setRecordings] = React.useState<{ blob: Blob; url: string; timestamp: Date }[]>([]);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/mp4'; // Fallback for iOS
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, { blob, url, timestamp: new Date() }]);
        
        // Stop stream tracks here instead of exactly when stopping recorder
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access denied", err);
      setMicError(err?.message || 'Microphone access denied. Please allow microphone permissions in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const deleteRecording = (idx: number) => {
    const newRecordings = recordings.filter((_, i) => i !== idx);
    setRecordings(newRecordings);
    if (selectedIdx === idx) setSelectedIdx(null);
  };

  return (
    <div className="space-y-6">
      {micError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200">
          {micError}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse scale-110 shadow-2xl shadow-red-200' : 'bg-indigo-600 shadow-xl shadow-indigo-100'}`}>
          {isRecording ? (
            <Button variant="ghost" className="w-full h-full text-white" onClick={stopRecording}>
              <Square className="w-8 h-8 fill-current" />
            </Button>
          ) : (
            <Button variant="ghost" className="w-full h-full text-white rounded-full" onClick={startRecording}>
              <Mic className="w-10 h-10" />
            </Button>
          )}
        </div>
        <p className={`mt-6 font-black uppercase tracking-widest text-xs ${isRecording ? 'text-red-500 animate-bounce' : 'text-slate-400'}`}>
          {isRecording ? 'Recording Live...' : 'Tap for Voice Input'}
        </p>
      </div>

      {/* Recording List */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pl-4">Recording History (Bento Takes)</h4>
        {recordings.length === 0 && (
          <div className="p-6 text-center text-zinc-400 border border-zinc-100 rounded-2xl bg-white/50 italic text-sm">
            No recordings yet. Give it a try!
          </div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {recordings.map((rec, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${selectedIdx === idx ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className="flex items-center gap-3 w-full">
                <audio src={rec.url} controls className="max-w-[150px] md:max-w-[200px]" />
                <div className="flex-col">
                  <p className="text-sm font-black text-slate-800">Version {idx + 1}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{rec.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteRecording(idx); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedIdx === idx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                  {selectedIdx === idx && <Check className="w-3 h-3 stroke-[4]" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedIdx !== null && (
        <Button className="w-full py-5 text-base font-black gap-3 rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-100" onClick={() => onSave(recordings[selectedIdx].blob)}>
          Submit Version {selectedIdx + 1}
        </Button>
      )}
    </div>
  );
};
