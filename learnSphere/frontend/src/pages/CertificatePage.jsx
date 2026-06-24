import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { StudentLayout } from '../components/Layout.jsx';
import { userService, certificateService } from '../services/index.js';
import { jsPDF } from 'jspdf';
import { Award, Download, Share2, Clock, CheckCircle, Lock, Zap, QrCode, Loader, AlertCircle } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '—' : x.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const CertificatePage = () => {
  const user = useSelector(state => state.auth.user);
  const studentName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student'
    : 'Student';


  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [issuedCerts, setIssuedCerts] = useState([]);

  // Fetch stats and certificates on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, certsRes] = await Promise.all([
        userService.getDashboardStats(),
        certificateService.getMyCertificates(),
      ]);
      setStats(statsRes.data?.data || null);
      setIssuedCerts(certsRes.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load certificate dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute certificate lists
  const { certificates, eligibleCourses, completedCourses } = useMemo(() => {
    const enrolled = stats?.enrolledCourses || [];
    
    const certs = enrolled
      .filter(c => {
        const isClaimed = c.certificateObtained || issuedCerts.some(ic => String(ic.courseId) === String(c.courseId));
        return c.certificateEligible || (c.progress || 0) >= 100 || isClaimed;
      })
      .map((c, idx) => {
        const weeks = c.durationMinutes > 0 ? Math.max(1, Math.round(c.durationMinutes / (60 * 5))) : null;
        
        const issuedCert = issuedCerts.find(ic => String(ic.courseId) === String(c.courseId));
        
        const isCompleted = c.certificateObtained || !!issuedCert;
        const isEligible = (c.certificateEligible || (c.progress || 0) >= 100) && !isCompleted;
        
        // Use backend certificateNumber if issued, else fallback to a generated ID
        const certificateId = issuedCert?.certificateNumber || 
          `LS-${new Date().getFullYear()}-${String(c.courseId || idx).slice(-5).padStart(5, '0').toUpperCase()}`;
        
        return {
          id: String(c.courseId || idx),
          title: c.title || 'Course',
          issuer: 'LearnSphere',
          issueDate: formatDate(c.certificateIssuedAt || (issuedCert && issuedCert.issuedAt) || c.enrolledAt),
          completionDate: formatDate(c.certificateIssuedAt || (issuedCert && (issuedCert.completedAt || issuedCert.issuedAt)) || c.enrolledAt),
          score: Math.round(c.progress || 100),
          duration: weeks ? `${weeks} wk est.` : '—',
          status: isCompleted ? 'completed' : isEligible ? 'eligible' : 'in_progress',
          certificateId,
          skills: c.category ? [c.category] : [],
          description: c.shortDescription || c.description || 'Course completed on LearnSphere.',
          progress: c.progress || 0,
          courseId: c.courseId,
          isEligible,
          isCompleted,
          verificationToken: issuedCert?.verificationToken || '',
          issuedCertData: issuedCert,
        };
      });

    const eligible = certs.filter(c => c.isEligible);
    const completed = certs.filter(c => c.isCompleted);

    return { certificates: certs, eligibleCourses: eligible, completedCourses: completed };
  }, [stats, issuedCerts]);

  const avgScore = certificates.length > 0
    ? Math.round(certificates.reduce((a, c) => a + c.score, 0) / certificates.length)
    : 0;

  // Generate certificate PDF client-side using jsPDF
  const handleDownload = (cert) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const certId = cert.certificateId;
      const courseTitle = cert.title;
      const issueDate = cert.completionDate;
      const token = cert.verificationToken || 'LS-VERIFY-TKN';
      const verificationUrl = `${window.location.origin}/certificate/verify/${token}`;

      // PDF Outer border/frame (Dark Indigo/Blue)
      doc.setDrawColor(30, 58, 138); 
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190); 

      // Inner golden border
      doc.setDrawColor(217, 119, 6); 
      doc.setLineWidth(0.5);
      doc.rect(13, 13, 271, 184);

      // Decorative corner fills
      doc.setFillColor(30, 58, 138);
      doc.rect(10, 10, 8, 8, 'F');
      doc.rect(279, 10, 8, 8, 'F');
      doc.rect(10, 192, 8, 8, 'F');
      doc.rect(279, 192, 8, 8, 'F');

      // Certificate Main Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(30, 58, 138); 
      doc.text('CERTIFICATE OF COMPLETION', 148.5, 45, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); 
      doc.text('This is proudly presented to', 148.5, 58, { align: 'center' });

      // Student Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(15, 23, 42); 
      doc.text(studentName, 148.5, 76, { align: 'center' });

      // Description text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      doc.text('for successfully completing all requirements and passing the course', 148.5, 91, { align: 'center' });

      // Course Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); 
      doc.text(courseTitle, 148.5, 108, { align: 'center' });

      // Fine print
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('with exceptional performance, demonstrating mastery of the skills and topics.', 148.5, 120, { align: 'center' });

      // Soft Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(70, 130, 227, 130);

      // Left Signature: Instructor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('LearnSphere Team', 60, 153, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Course Instructor', 60, 159, { align: 'center' });
      doc.line(30, 148, 90, 148); 

      // Right Signature: Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(issueDate, 237, 153, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Date of Issue', 237, 159, { align: 'center' });
      doc.line(207, 148, 267, 148); 

      // Muted Bottom Details: Certificate ID & verification URL
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); 
      doc.text(`Certificate ID: ${certId}`, 148.5, 176, { align: 'center' });
      doc.text(`Verify authenticity: ${verificationUrl}`, 148.5, 181, { align: 'center' });

      // Save PDF
      doc.save(`Certificate_${certId}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  // Generate certificate on backend
  const handleGenerateCertificate = async (courseId) => {
    try {
      setGeneratingId(courseId);
      const result = await certificateService.generateCertificate({ courseId });
      if (result.data?.success) {
        // Refresh both statistics (progress and flags) and certificates list
        const [statsRes, certsRes] = await Promise.all([
          userService.getDashboardStats(),
          certificateService.getMyCertificates(),
        ]);
        setStats(statsRes.data?.data || null);
        setIssuedCerts(certsRes.data?.data || []);
        alert('Certificate generated successfully!');
      } else {
        alert(result.data?.message || 'Failed to generate certificate');
      }
    } catch (e) {
      alert('Error generating certificate: ' + (e.response?.data?.message || e.message));
    } finally {
      setGeneratingId(null);
    }
  };


  // Share certificate link
  const handleShare = async (cert) => {
    try {
      if (!cert.issuedCertData) return;
      const result = await certificateService.shareCertificate(cert.issuedCertData._id);
      const shareUrl = result.data?.shareLink || `${window.location.origin}/certificate/verify/${cert.verificationToken}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Certificate link copied to clipboard!\nShare URL: ${shareUrl}`);
      }).catch(() => {
        alert(`Share Link:\n${shareUrl}`);
      });
    } catch (e) {
      alert('Failed to get shareable link: ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600">Loading certificate workspace...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Hub</h1>
          <p className="mt-2 text-gray-600 font-medium">Verify, download, and share your earned academic credentials.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-xl bg-emerald-100 p-3.5">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Issued Certificates</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedCourses.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-xl bg-blue-100 p-3.5">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Eligible for Issue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{eligibleCourses.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-xl bg-purple-100 p-3.5">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Avg. Completion Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Check & Quick Generation Banner */}
        {eligibleCourses.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-amber-900">
              <Award className="h-5 w-5 text-amber-600 animate-pulse" />
              Courses Ready for Certificate Claim
            </h2>
            <p className="mb-5 text-sm text-amber-800 leading-relaxed">
              🎉 Congratulations! You have completed the requirements for the following course(s) and can now generate your official certificate.
            </p>
            <div className="space-y-3">
              {eligibleCourses.map((cert) => (
                <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-200 bg-white p-4 shadow-sm hover:border-amber-300 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{cert.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Final Score: {cert.score}% | Progress: 100% completed
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateCertificate(cert.courseId)}
                    disabled={generatingId === cert.courseId}
                    className="btn btn-primary min-w-[180px] text-sm py-2 px-4 flex items-center justify-center gap-2"
                  >
                    {generatingId === cert.courseId ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        Claim Certificate
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Table / Panel */}
        {certificates.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl py-16 text-center shadow">
            <Award className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-800">No Credentials Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
              Complete a course to 100% progress, and your certificate will be generated and available here.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="mb-5 text-xl font-bold text-gray-900">Academic Transcript & Certificates</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50/70 border-b border-gray-200 text-left">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Completion Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Verification ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{cert.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{cert.description}</p>
                      </td>
                      <td className="px-6 py-4.5 text-sm text-gray-600">{cert.completionDate}</td>
                      <td className="px-6 py-4.5">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {cert.certificateId}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cert.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          cert.status === 'eligible' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {cert.status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                          {cert.status === 'eligible' && <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                          {cert.status === 'in_progress' && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                          {cert.status === 'completed' ? 'Verified' : cert.status === 'eligible' ? 'Claim Ready' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right text-sm">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                          >
                            View
                          </button>
                          {cert.isCompleted && (
                            <>
                              <button
                                onClick={() => handleDownload(cert)}
                                className="text-emerald-600 hover:text-emerald-800 font-bold transition-colors flex items-center gap-1"
                              >
                                <Download size={13} />
                                Download
                              </button>
                              <button
                                onClick={() => handleShare(cert)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors flex items-center gap-1"
                              >
                                <Share2 size={13} />
                                Share
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificate Preview Modal */}
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between transform transition-all duration-300 scale-100 animate-in fade-in zoom-in">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Certificate Review
                </h2>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  ✕
                </button>
              </div>
              
              {/* Certificate Visual Card Frame */}
              <div className="relative border-[6px] border-double border-blue-900 p-6 bg-slate-50/50 rounded-xl shadow-inner my-6">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>

                <div className="text-center space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">Certificate of Completion</h3>
                  <p className="text-[10px] text-gray-500 italic">This is proudly presented to</p>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{studentName}</h2>
                  <p className="text-[10px] text-gray-500 italic">for successfully completing the course</p>
                  <h4 className="text-lg font-extrabold text-indigo-700 leading-snug">{selectedCert.title}</h4>
                  <p className="text-[10px] text-gray-500 max-w-md mx-auto">{selectedCert.description}</p>
                  
                  <div className="flex justify-between items-end pt-5 px-6 text-[9px] text-gray-500">
                    <div className="text-left">
                      <p className="border-t border-gray-200 pt-1 font-semibold text-gray-800">LearnSphere Team</p>
                      <p className="text-gray-400">Course Instructor</p>
                    </div>
                    <div className="text-right">
                      <p className="border-t border-gray-200 pt-1 font-semibold text-gray-800">{selectedCert.completionDate}</p>
                      <p className="text-gray-400">Date of Issue</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Verification info */}
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <QrCode className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Official Authenticity Status</p>
                    <p className="text-xs text-gray-500 mt-0.5">Verification token: {selectedCert.verificationToken || 'N/A (Generate first)'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${selectedCert.isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                  <span className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                    {selectedCert.isCompleted ? 'Verified Valid' : 'Unclaimed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedCert.isCompleted ? (
                  <>
                    <button
                      onClick={() => handleDownload(selectedCert)}
                      className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      <Download size={15} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleShare(selectedCert)}
                      className="btn btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      <Share2 size={15} />
                      Share
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleGenerateCertificate(selectedCert.courseId);
                      setSelectedCert(null);
                    }}
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <Zap size={15} />
                    Generate Certificate
                  </button>
                )}
                <button
                  onClick={() => setSelectedCert(null)}
                  className="btn btn-secondary py-2.5 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default CertificatePage;
