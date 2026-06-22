import React, { useState } from 'react';
import { StudentSidebar } from './Sidebar.jsx';
import { Menu } from 'lucide-react';

const StudentLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50/50">
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none"></div>
        <div className="md:hidden p-4 glass sticky top-0 z-10 border-b border-white/20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
        <main className="p-4 md:p-8 relative z-0">{children}</main>
      </div>
    </div>
  );
};

export { StudentLayout };
