import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save,
  Search,
  Clock,
  BookOpen,
  Download
} from 'lucide-react';

const StudentNotesPage = () => {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('learnsphere_student_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { 
        id: 1, 
        title: 'Web Dev Basics', 
        content: 'Remember to use semantic HTML. Section, article, nav, header, footer.', 
        updatedAt: new Date().toISOString() 
      },
    ];
  });
  
  const [activeNoteId, setActiveNoteId] = useState(notes.length > 0 ? notes[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('learnsphere_student_notes', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id, e) => {
    e.stopPropagation();
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (activeNoteId === id) {
      setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    }
  };

  const updateActiveNote = (field, value) => {
    if (!activeNoteId) return;
    
    const updatedNotes = notes.map(note => {
      if (note.id === activeNoteId) {
        return { 
          ...note, 
          [field]: value,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });
    
    // Sort so newest edited is at top, optional, but let's just keep order for now
    setNotes(updatedNotes);
  };
  
  const handleDownloadNote = () => {
    if (!activeNote) return;
    const element = document.createElement("a");
    const file = new Blob([activeNote.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    let title = activeNote.title.trim() || 'Untitled_Note';
    title = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    element.download = `${title}.txt`;
    document.body.appendChild(element); // Required for FireFox
    element.click();
    document.body.removeChild(element);
  };
  
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <StudentLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col">
        
        {/* Header Section */}
        <div className="mb-6 shrink-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <BookOpen size={28} strokeWidth={2.5} />
            </div>
            My Notes
          </h1>
          <p className="text-slate-500 text-base md:text-lg ml-2">Jot down your learning insights and ideas.</p>
        </div>

        {/* Main Workspace Container */}
        <div className="flex-1 bg-white/60 backdrop-blur-2xl border border-white p-4 rounded-[2rem] shadow-xl shadow-indigo-900/5 flex flex-col md:flex-row gap-4 overflow-hidden">
          
          {/* Left Panel: Note List */}
          <div className="w-full md:w-1/3 lg:w-1/4 h-1/3 md:h-full flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-200/60 pb-4 md:pb-0 md:pr-4 shrink-0">
            
            {/* Search and Add */}
            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={handleCreateNote}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-[0.98]"
              >
                <Plus size={18} strokeWidth={2.5} />
                New Note
              </button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  {searchQuery ? 'No notes match your search.' : 'No notes yet. Create one!'}
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`group cursor-pointer p-4 rounded-xl transition-all duration-200 border text-left flex flex-col relative overflow-hidden ${
                      activeNoteId === note.id
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                        : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold truncate pr-6 ${activeNoteId === note.id ? 'text-indigo-800' : 'text-slate-700'}`}>
                        {note.title || 'Untitled Note'}
                      </h3>
                      <button 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className={`absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${
                          activeNoteId === note.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">
                      {note.content || 'No content...'}
                    </p>
                    <div className="flex items-center gap-1 mt-auto text-[10px] text-slate-400">
                      <Clock size={10} />
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Editor */}
          <div className="flex-1 h-2/3 md:h-full flex flex-col relative bg-white/40 rounded-xl md:rounded-2xl border border-white overflow-hidden shadow-inner">
            {activeNote ? (
              <>
                <div className="shrink-0 p-4 md:p-6 border-b border-slate-100/60 bg-white/50 flex flex-col relative">
                  <div className="flex justify-between items-start gap-4">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => updateActiveNote('title', e.target.value)}
                      placeholder="Note Title"
                      className="flex-1 w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-slate-800 placeholder-slate-300"
                    />
                    <button 
                      onClick={handleDownloadNote}
                      title="Download Note"
                      className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <Save size={12} className="text-emerald-500" />
                    Last saved: {formatDate(activeNote.updatedAt)}
                  </div>
                </div>
                
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateActiveNote('content', e.target.value)}
                  placeholder="Start typing your notes here. They are saved automatically to your browser..."
                  className="flex-1 w-full bg-transparent border-none outline-none p-4 md:p-6 text-slate-700 leading-relaxed resize-none custom-scrollbar"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText size={64} className="text-indigo-100 mb-4" strokeWidth={1} />
                <p className="text-lg font-medium text-slate-500">Select a note or create a new one</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentNotesPage;
