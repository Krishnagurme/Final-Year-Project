import React, { useState, useEffect } from 'react';
import { courseService } from '../services/index.js';
import { Plus, Trash2, Edit2, BookOpen, Loader, X, Check } from 'lucide-react';

const emptyTopicForm = {
  title: '',
  description: '',
  notes: '',
  notesFileUrl: '',
  studyMaterial: '',
  studyMaterialFileUrl: '',
  pdfUrl: '',
  duration: 45,
  resources: [{ title: '', url: '', type: 'Reference' }],
};

const AdminTopicSection = ({ courseId, courseTitle }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyTopicForm);
  const [uploadingField, setUploadingField] = useState(null);

  const handleFileUpload = async (e, field, refIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingField(field === 'reference' ? `reference-${refIndex}` : field);
      setError('');
      const res = await courseService.uploadFile(formData);
      if (res.data?.success) {
        const fileUrl = res.data.url;
        if (field === 'notes') {
          setForm(f => ({ ...f, notesFileUrl: fileUrl }));
        } else if (field === 'material') {
          setForm(f => ({ ...f, studyMaterialFileUrl: fileUrl }));
        } else if (field === 'pdf') {
          setForm(f => ({ ...f, pdfUrl: fileUrl }));
        } else if (field === 'reference') {
          const resources = [...form.resources];
          resources[refIndex] = {
            title: resources[refIndex].title || file.name,
            url: fileUrl,
            type: 'File',
          };
          setForm(f => ({ ...f, resources }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const fetchTopics = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError('');
      const res = await courseService.getTopics(courseId);
      setTopics(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load topics');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const resetForm = () => {
    setForm(emptyTopicForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = topic => {
    setEditingId(topic._id);
    setForm({
      title: topic.title || '',
      description: topic.description || '',
      notes: topic.notes || topic.content || '',
      notesFileUrl: topic.notesFileUrl || '',
      studyMaterial: topic.studyMaterial || '',
      studyMaterialFileUrl: topic.studyMaterialFileUrl || '',
      pdfUrl: topic.pdfUrl || '',
      duration: topic.duration || 45,
      resources: topic.resources?.length ? topic.resources : [{ title: '', url: '', type: 'Reference' }],
    });
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      setError('');
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        notesFileUrl: form.notesFileUrl.trim(),
        content: form.notes.trim() || form.title.trim(),
        studyMaterial: form.studyMaterial.trim(),
        studyMaterialFileUrl: form.studyMaterialFileUrl.trim(),
        pdfUrl: form.pdfUrl.trim(),
        duration: Number(form.duration) || 45,
        resources: form.resources.filter(r => r.title || r.url),
        isPublished: true,
      };

      if (editingId) {
        await courseService.updateTopic(courseId, editingId, payload);
      } else {
        await courseService.createTopic(courseId, payload);
      }
      resetForm();
      await fetchTopics();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async topicId => {
    if (!window.confirm('Delete this topic? Student progress for it will be removed.')) return;
    try {
      await courseService.deleteTopic(courseId, topicId);
      await fetchTopics();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete topic');
    }
  };

  if (!courseId) {
    return (
      <div className="text-sm text-slate-500 italic py-4">
        Select a course from the table above to manage its topics.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            Course Topics — {courseTitle}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Each topic includes notes, study material, PDFs, and references for the student LMS workflow.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1"
          >
            <Plus size={14} />
            Add Topic
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-800 text-sm">
              {editingId ? 'Edit Topic' : 'New Topic'}
            </h5>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input text-sm"
              placeholder="Topic title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            <input
              className="input text-sm"
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            />
          </div>
          <input
            className="input text-sm"
            placeholder="Short description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <textarea
              className="input text-sm min-h-[80px]"
              placeholder="Lecture notes (shown in Notes tab)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Or upload Notes file:</span>
              <input
                type="file"
                id="notes-file-upload"
                className="hidden"
                onChange={e => handleFileUpload(e, 'notes')}
              />
              <label
                htmlFor="notes-file-upload"
                className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-850 border border-indigo-200 rounded px-2.5 py-1 bg-white hover:bg-slate-50"
              >
                {uploadingField === 'notes' ? 'Uploading...' : 'Choose File'}
              </label>
              {form.notesFileUrl && (
                <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  <span className="truncate max-w-[150px] font-medium">{form.notesFileUrl.split('/').pop()}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 font-bold"
                    onClick={() => setForm(f => ({ ...f, notesFileUrl: '' }))}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <textarea
              className="input text-sm min-h-[80px]"
              placeholder="Study material (student must open before completing topic)"
              value={form.studyMaterial}
              onChange={e => setForm(f => ({ ...f, studyMaterial: e.target.value }))}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Or upload Study Material:</span>
              <input
                type="file"
                id="material-file-upload"
                className="hidden"
                onChange={e => handleFileUpload(e, 'material')}
              />
              <label
                htmlFor="material-file-upload"
                className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-855 border border-indigo-200 rounded px-2.5 py-1 bg-white hover:bg-slate-50"
              >
                {uploadingField === 'material' ? 'Uploading...' : 'Choose File'}
              </label>
              {form.studyMaterialFileUrl && (
                <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  <span className="truncate max-w-[150px] font-medium">{form.studyMaterialFileUrl.split('/').pop()}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 font-bold"
                    onClick={() => setForm(f => ({ ...f, studyMaterialFileUrl: '' }))}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="PDF URL (optional)"
                value={form.pdfUrl}
                onChange={e => setForm(f => ({ ...f, pdfUrl: e.target.value }))}
              />
              <input
                type="file"
                id="pdf-file-upload"
                className="hidden"
                onChange={e => handleFileUpload(e, 'pdf')}
              />
              <label
                htmlFor="pdf-file-upload"
                className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-860 border border-indigo-200 rounded px-4 py-2 bg-white hover:bg-slate-50 flex items-center text-xs justify-center shrink-0"
              >
                {uploadingField === 'pdf' ? 'Uploading...' : 'Upload File'}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">References</p>
            {form.resources.map((ref, i) => (
              <div key={i} className="flex flex-col gap-1.5 border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className="input text-xs"
                    placeholder="Title"
                    value={ref.title}
                    onChange={e => {
                      const resources = [...form.resources];
                      resources[i] = { ...resources[i], title: e.target.value };
                      setForm(f => ({ ...f, resources }));
                    }}
                  />
                  <input
                    className="input text-xs col-span-2"
                    placeholder="URL (or upload file)"
                    value={ref.url}
                    onChange={e => {
                      const resources = [...form.resources];
                      resources[i] = { ...resources[i], url: e.target.value };
                      setForm(f => ({ ...f, resources }));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`ref-file-upload-${i}`}
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'reference', i)}
                    />
                    <label
                      htmlFor={`ref-file-upload-${i}`}
                      className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {uploadingField === `reference-${i}` ? 'Uploading...' : '📁 Upload File Reference'}
                    </label>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                      Type: {ref.type || 'Reference'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 font-semibold"
                    onClick={() => {
                      const resources = form.resources.filter((_, idx) => idx !== i);
                      setForm(f => ({ ...f, resources }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-indigo-600 font-semibold"
              onClick={() =>
                setForm(f => ({
                  ...f,
                  resources: [...f.resources, { title: '', url: '', type: 'Reference' }],
                }))
              }
            >
              + Add reference
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1">
              {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
              {editingId ? 'Update Topic' : 'Create Topic'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <Loader size={16} className="animate-spin" />
          Loading topics...
        </div>
      ) : topics.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-2">No topics yet. Add topics for students to complete.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-2">#</th>
                <th className="pb-2">Title</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Material</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topics.map((t, idx) => (
                <tr key={t._id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 text-slate-400 font-bold">{t.order || idx + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-800">{t.title}</td>
                  <td className="py-2.5 text-slate-600">{t.duration || 0} min</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.studyMaterial ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {t.studyMaterial ? 'Ready' : 'Missing'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTopicSection;
