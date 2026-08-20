import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { 
  ArrowLeft, Clock, MapPin, User, Building2, Wrench, 
  MessageSquare, Send, CheckCircle2, Star, AlertTriangle, 
  Paperclip, Image as ImageIcon, Shield, RefreshCw 
} from 'lucide-react';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/requests/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/users/technicians');
      setTechnicians(res.data.technicians || []);
    } catch (err) {
      toast.error('Failed to load technician list.');
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      toast.error('Please select a technician.');
      return;
    }

    try {
      await api.post(`/requests/${id}/assign`, {
        technician_id: selectedTechId,
        notes: assignNotes
      });
      toast.success('Technician assigned successfully!');
      setShowAssignModal(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign technician.');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      toast.error('Please select a status.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('remarks', statusRemarks);
      if (resolutionNotes) formData.append('resolution_notes', resolutionNotes);
      if (evidenceFile) formData.append('evidence', evidenceFile);

      await api.patch(`/requests/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}!`);
      setShowStatusModal(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleRateResolution = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/requests/${id}/rate`, { rating, feedback });
      toast.success('Thank you for rating the resolution!');
      setShowRatingModal(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit rating.');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/requests/${id}/comments`, {
        content: commentText,
        is_internal: isInternalComment
      });
      setCommentText('');
      toast.success('Comment posted.');
      fetchDetail();
    } catch (err) {
      toast.error('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-900" />
        <p className="text-sm font-bold">Loading Request Lifecycle Details...</p>
      </div>
    );
  }

  const { request, comments, attachments, history } = data;

  const canAssign = user.role === 'admin' || user.role === 'management';
  const canUpdateStatus = user.role === 'admin' || user.role === 'management' || (user.role === 'technician' && request.assigned_to_id === user.id);
  const canRate = (user.role === 'student' || user.role === 'staff' || user.id === request.reported_by_id) && request.status === 'resolved';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </button>

        <div className="flex items-center gap-2">
          {canAssign && (
            <button
              onClick={() => {
                fetchTechnicians();
                setShowAssignModal(true);
              }}
              className="px-4 py-2 rounded-xl uni-banner text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" /> Assign Technician
            </button>
          )}

          {canUpdateStatus && (
            <button
              onClick={() => {
                setNewStatus(request.status);
                setShowStatusModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Change Status
            </button>
          )}

          {canRate && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" /> Confirm & Rate Resolution
            </button>
          )}
        </div>
      </div>

      {/* Main Request Summary Card */}
      <div className="uni-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-black text-blue-900">{request.reference_number}</span>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-wide">{request.title}</h1>
          </div>

          <div className="text-xs text-slate-500 sm:text-right space-y-0.5">
            <div>Logged: <span className="text-slate-800 font-bold">{new Date(request.created_at).toLocaleString()}</span></div>
            {request.due_date && (
              <div>SLA Target: <span className="text-amber-700 font-bold">{new Date(request.due_date).toLocaleString()}</span></div>
            )}
          </div>
        </div>

        {/* Grid Meta Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Location</span>
              <span className="font-bold text-slate-900">{request.location_name}</span>
              <span className="text-slate-500 block text-[11px]">{request.location_building}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Reported By</span>
              <span className="font-bold text-slate-900">{request.reporter_name}</span>
              <span className="text-slate-500 block text-[11px]">{request.reporter_email}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Assigned Technician</span>
              {request.technician_name ? (
                <>
                  <span className="font-bold text-slate-900">{request.technician_name}</span>
                  <span className="text-slate-500 block text-[11px]">{request.technician_phone}</span>
                </>
              ) : (
                <span className="text-slate-400 italic font-semibold">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Description</h3>
          <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {/* Resolution details if available */}
        {request.resolution_notes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Resolution Summary</h4>
            <p className="text-xs text-emerald-800 leading-relaxed">{request.resolution_notes}</p>
          </div>
        )}

        {/* Rating details if closed */}
        {request.user_rating && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">User Satisfaction Rating</h4>
              <p className="text-xs text-amber-800 mt-0.5">{request.user_feedback || 'No written feedback'}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(request.user_rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
        )}

        {/* Attachments Gallery */}
        {attachments.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments & Evidence</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-900 flex flex-col items-center text-center space-y-2 group transition-all"
                >
                  <ImageIcon className="w-6 h-6 text-blue-900 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-800 truncate w-full">{att.file_name}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">{att.attachment_type}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Timeline & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status History Timeline */}
        <div className="uni-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-900" /> Status Progress Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {history.map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.new_status} />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{h.remarks}</p>
                  <span className="text-[10px] text-slate-500">By: {h.changed_by_name} ({h.changed_by_role})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Communication Comments Thread */}
        <div className="uni-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-blue-900" /> Comments & Log Activity ({comments.length})
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No comments added yet.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      c.is_internal
                        ? 'bg-amber-50 border border-amber-200 text-amber-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {c.user_name}
                        <span className="text-[10px] text-slate-500 font-normal">({c.user_role})</span>
                        {c.is_internal === 1 && (
                          <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            INTERNAL
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handlePostComment} className="pt-4 border-t border-slate-100 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type a comment or work update note..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
            />

            <div className="flex items-center justify-between">
              {(user.role === 'admin' || user.role === 'technician') && (
                <label className="flex items-center gap-1.5 text-xs text-amber-800 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded bg-slate-100 border-slate-300"
                  />
                  <span>Internal note (Staff only)</span>
                </label>
              )}

              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="ml-auto px-4 py-2 rounded-xl uni-banner text-white font-bold text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                Post Comment <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: Assign Technician */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Assign Qualified Technician</h3>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Technician</label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="">Choose Technician</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization}) - {t.active_tasks} active tasks
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instructions / Directions</label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Special directions or target SLA instructions..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl uni-banner text-white text-xs font-bold uppercase tracking-wider"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Change Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Update Request Status</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="reopened">Reopened</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Remarks</label>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              {newStatus === 'resolved' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Resolution Summary</label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attach Resolution Photo (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rating & Confirmation */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <Star className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Rate Resolution Quality</h3>
            <p className="text-xs text-slate-500">Please rate the technician's resolution speed and service quality to close this ticket.</p>

            <form onSubmit={handleRateResolution} className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback comment..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Submit & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
