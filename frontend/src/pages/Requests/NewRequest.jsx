import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Wrench, Building2, MapPin, AlertTriangle, Image as ImageIcon, 
  Upload, Send, ArrowLeft, CheckCircle2, Info 
} from 'lucide-react';

export const NewRequest = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [selectedFloor, setSelectedFloor] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/locations'),
      api.get('/departments')
    ]).then(([catRes, locRes, deptRes]) => {
      setCategories(catRes.data.categories || []);
      setLocations(locRes.data.locations || []);
      setDepartments(deptRes.data.departments || []);
    }).catch(err => {
      toast.error('Failed to load form lookup options.');
    });
  }, []);

  const filteredLocations = selectedFloor
    ? locations.filter(l => l.floor === selectedFloor)
    : locations;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !categoryId || !locationId) {
      toast.error('Please complete all required fields (*)');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', categoryId);
      formData.append('location_id', locationId);
      if (departmentId) formData.append('department_id', departmentId);
      formData.append('priority', priority);
      if (attachment) formData.append('attachment', attachment);

      const res = await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Request logged! Reference: ${res.data.referenceNumber}`);
      navigate(`/requests/${res.data.requestId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to log request.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </button>
        <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
          Cosmopolitan University Abuja
        </span>
      </div>

      <div className="uni-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-wide">
            SUBMIT MAINTENANCE / ICT ISSUE REPORT
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide issue details below. An automated reference tracking code will be generated.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Title <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
              placeholder="e.g. Split Air Conditioner Leak in Computer Science Lab 2"
            />
          </div>

          {/* Grid: Category, Campus Floor & Room NO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category / Problem Type <span className="text-blue-600">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Target SLA: {c.sla_hours} hrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campus Floor
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                  setLocationId('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="">All Floors</option>
                <option value="Basement (B)">Basement (B)</option>
                <option value="Ground Floor (GF)">Ground Floor (GF)</option>
                <option value="1st Floor (Floor 1)">1st Floor (Floor 1)</option>
                <option value="2nd Floor (Floor 2)">2nd Floor (Floor 2)</option>
                <option value="3rd Floor (Floor 3)">3rd Floor (Floor 3)</option>
                <option value="Penthouse Floor (PF)">Penthouse Floor (PF)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room NO / Location <span className="text-blue-600">*</span>
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="">Select Room NO</option>
                {filteredLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.floor ? `${l.floor} — ${l.name}` : l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Department & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Associated Department (Optional)
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level <span className="text-blue-600">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="low">Low - Routine repair / non-disruptive</option>
                <option value="medium">Medium - Standard maintenance</option>
                <option value="high">High - Distracting / affecting work</option>
                <option value="urgent">Urgent - Emergency safety or outage</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description <span className="text-blue-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
              placeholder="Describe symptoms, exact room number, specific equipment affected..."
            />
          </div>

          {/* File Upload Evidence */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Photo Evidence / Document Attachment (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-900 transition-colors bg-slate-50">
              <div className="space-y-2 text-center">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Evidence preview" className="max-h-40 mx-auto rounded-xl border border-slate-300" />
                    <p className="text-xs text-slate-500 font-medium">{attachment?.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-xs text-slate-600">
                      <label className="relative cursor-pointer font-bold text-blue-900 hover:underline">
                        <span>Upload a file</span>
                        <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP, or PDF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl uni-banner text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting Report...' : 'Submit Issue Report'}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
