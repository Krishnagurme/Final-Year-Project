import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Calendar,
  Clock,
  CheckSquare
} from 'lucide-react';

const StudentTodoPage = () => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('learnsphere_sidebar_todos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 1, text: 'Review Web Dev notes', completed: false, date: new Date().toISOString() },
      { id: 2, text: 'Complete AI quiz', completed: true, date: new Date().toISOString() },
    ];
  });
  
  const [inputValue, setInputValue] = useState('');

  // Sync to local storage whenever todos change
  useEffect(() => {
    localStorage.setItem('learnsphere_sidebar_todos', JSON.stringify(todos));
  }, [todos]);

  // Also listen for cross-tab or cross-component changes (like from the Sidebar widget)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'learnsphere_sidebar_todos' && e.newValue) {
        try {
          setTodos(JSON.parse(e.newValue));
        } catch (error) {}
      }
    };
    
    // In same tab, the widget might update localStorage, but standard 'storage' event doesn't fire for same tab.
    // For a simple implementation, it will sync on mount/unmount and cross-tab.
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setTodos([
      ...todos,
      { 
        id: Date.now(), 
        text: inputValue.trim(), 
        completed: false,
        date: new Date().toISOString()
      },
    ]);
    setInputValue('');
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };
  
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;
  const progress = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  return (
    <StudentLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
              <CheckSquare size={32} strokeWidth={2.5} />
            </div>
            My Tasks
          </h1>
          <p className="text-slate-500 text-lg ml-2">Stay on top of your learning goals and assignments.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <h3 className="text-slate-500 font-medium mb-1">Total Tasks</h3>
            <div className="text-4xl font-bold text-slate-800">{todos.length}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-xl border border-emerald-200/50 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <h3 className="text-emerald-600 font-medium mb-1">Completed</h3>
            <div className="text-4xl font-bold text-emerald-700">{completedCount}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 backdrop-blur-xl border border-amber-200/50 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <h3 className="text-amber-600 font-medium mb-1">Pending</h3>
            <div className="text-4xl font-bold text-amber-700">{pendingCount}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 transition-all">
          <div className="flex justify-between items-end mb-3">
             <h3 className="text-slate-700 font-semibold text-lg">Overall Progress</h3>
             <span className="text-blue-600 font-bold text-2xl">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        {/* Main Todo Container */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-blue-900/5">
          
          {/* Input Form */}
          <form onSubmit={handleAddTodo} className="relative mb-10">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What needs to be done today?"
              className="w-full bg-white/80 border-2 border-slate-100 rounded-2xl py-5 pl-6 pr-16 text-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-3 top-3 bottom-3 aspect-square flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:bg-slate-300 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md shadow-blue-600/20"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </form>

          {/* Todo List */}
          <div className="space-y-4">
            {todos.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckSquare size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No tasks yet!</h3>
                <p className="text-slate-500 max-w-md mx-auto">Your list is empty. Add a new task above to start organizing your learning journey.</p>
              </div>
            ) : (
              [...todos].reverse().map((todo) => (
                <div
                  key={todo.id}
                  className={`group flex items-center justify-between gap-4 p-5 rounded-2xl transition-all duration-300 border ${
                    todo.completed 
                      ? 'bg-slate-50/80 border-slate-200/50' 
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200'
                  }`}
                >
                  <div 
                    className="flex items-start md:items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    <button className={`shrink-0 mt-1 md:mt-0 transition-colors ${
                      todo.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-blue-400'
                    }`}>
                      {todo.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                    </button>
                    
                    <div className="flex flex-col">
                      <span className={`text-lg transition-all ${
                        todo.completed ? 'line-through text-slate-400' : 'font-medium text-slate-700'
                      }`}>
                        {todo.text}
                      </span>
                      {todo.date && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Calendar size={12} />
                          {formatDate(todo.date)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="shrink-0 p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentTodoPage;
