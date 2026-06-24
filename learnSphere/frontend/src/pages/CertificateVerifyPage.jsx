import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../services/index.js';
import { Award, CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';

const CertificateVerifyPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await certificateService.verifyCertificate(token);
        if (!cancelled) {
          setResult(res.data?.data || null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Certificate could not be verified.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="card text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-indigo-100">
              <Award className="h-10 w-10 text-indigo-600" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
            <p className="text-sm text-gray-500 mt-1">LearnSphere official credential check</p>
          </div>

          {loading && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-gray-600 text-sm">Verifying certificate...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
              <XCircle className="h-10 w-10 text-red-500 mx-auto" />
              <p className="font-semibold text-red-800">Verification Failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-4 text-left">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                <span className="font-bold text-emerald-800">Valid Certificate</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-emerald-100 pb-2">
                  <span className="text-gray-500">Student</span>
                  <span className="font-semibold text-gray-900">{result.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-2">
                  <span className="text-gray-500">Course</span>
                  <span className="font-semibold text-gray-900">{result.courseName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-2">
                  <span className="text-gray-500">Certificate ID</span>
                  <span className="font-mono text-xs font-semibold text-gray-900">
                    {result.certificateNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Issued</span>
                  <span className="font-semibold text-gray-900">
                    {result.issuedAt
                      ? new Date(result.issuedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <ArrowLeft size={14} />
            Back to LearnSphere
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
