import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { authService } from '../services/index.js';
import SkillBadge from '../components/SkillBadge.jsx';
import { User, Mail, FileText } from 'lucide-react';

const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authService.getProfile();
        if (!cancelled) setProfile(res.data?.data || null);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Your profile from the server (live data).</p>

        {loading && <p className="text-gray-600">Loading profile…</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {!loading && profile && (
          <div className="card space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail size={16} /> {profile.email}
                </p>
              </div>
              <SkillBadge level={profile.skillLevel || 'BEGINNER'} size="lg" />
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <FileText size={18} className="shrink-0 mt-0.5" />
              <p>{profile.bio || 'No bio yet.'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} />
              Role: {profile.role || 'STUDENT'}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentProfilePage;
