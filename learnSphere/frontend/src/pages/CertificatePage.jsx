import React, { useEffect, useState, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { userService } from '../services/index.js';
import { Award, Download, Share2, Clock, CheckCircle } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '—' : x.toLocaleDateString();
}

const CertificatePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getDashboardStats();
        if (!cancelled) setStats(res.data?.data || null);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const certificates = useMemo(() => {
    const enrolled = stats?.enrolledCourses || [];
    return enrolled
      .filter(c => (c.progress || 0) >= 100 || c.certificateObtained)
      .map((c, idx) => {
        const weeks =
          c.durationMinutes > 0 ? Math.max(1, Math.round(c.durationMinutes / (60 * 5))) : null;
        return {
          id: String(c.courseId || idx),
          title: c.title || 'Course',
          issuer: 'LearnSphere',
          issueDate: formatDate(c.certificateIssuedAt || c.enrolledAt),
          completionDate: formatDate(c.certificateIssuedAt || c.enrolledAt),
          score: Math.round(c.progress || 100),
          duration: weeks ? `${weeks} wk est.` : '—',
          status: c.certificateObtained ? 'issued' : 'eligible',
          certificateId: `LS-${String(c.courseId || idx).slice(-8).toUpperCase()}`,
          skills: c.category ? [c.category] : [],
          description: c.shortDescription || c.description || 'Course completed on LearnSphere.',
        };
      });
  }, [stats]);

  const avgScore =
    certificates.length > 0
      ? Math.round(certificates.reduce((a, c) => a + c.score, 0) / certificates.length)
      : 0;

  const totalWeeksLabel = useMemo(() => {
    const mins = (stats?.enrolledCourses || []).reduce(
      (t, c) => t + (c.durationMinutes && (c.progress || 0) >= 100 ? c.durationMinutes : 0),
      0
    );
    if (mins <= 0) return '—';
    return `${Math.max(1, Math.round(mins / 60))} h est. content`;
  }, [stats]);

  const handleDownload = certificateId => {
    window.alert(`Certificate ${certificateId}: export is not wired yet.`);
  };

  const handleShare = certificateId => {
    window.alert(`Certificate ${certificateId}: share link not configured yet.`);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600">Loading certificates…</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your certificates</h1>
          <p className="mt-2 text-gray-600">
            Built from courses you completed (100% progress) or marked with a certificate.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total certificates</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. completion</p>
                <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed volume</p>
                <p className="text-2xl font-bold text-gray-900">{totalWeeksLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <Award className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No certificates yet</h3>
            <p className="text-gray-600">
              Finish a course to 100% progress (or mark certificate issued) to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {certificates.map(certificate => (
              <div
                key={certificate.id}
                className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <Award className="h-8 w-8" />
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                      {certificate.status}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{certificate.title}</h3>
                  <p className="text-sm text-blue-100">Certificate ID: {certificate.certificateId}</p>
                </div>
                <div className="p-6">
                  <p className="mb-4 text-sm text-gray-600">{certificate.description}</p>
                  {certificate.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Category</h4>
                      <div className="flex flex-wrap gap-2">
                        {certificate.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{certificate.score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration (est.)</span>
                      <span className="font-semibold text-gray-900">{certificate.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-gray-900">{certificate.completionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued</span>
                      <span className="font-semibold text-gray-900">{certificate.issueDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(certificate.certificateId)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare(certificate.certificateId)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default CertificatePage;
