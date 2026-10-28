'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/data/sources';
import confetti from 'canvas-confetti';
import useModal from '@/components/useModal';

export default function SubmissionModal({
  isOpen,
  onClose,
  source,
  currentSubmission,
  onSave,
  initialStatus = null,
}) {
  const [status, setStatus] = useState('unsubmitted');
  const [liveUrl, setLiveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (source) {
      const sub = currentSubmission || {};
      setStatus(initialStatus || sub.status || 'unsubmitted');
      setLiveUrl(sub.live_url || '');
      setNotes(sub.notes || '');
      setErrorMsg('');
    }
  }, [source, currentSubmission, initialStatus]);

  const dialogRef = useModal(isOpen && Boolean(source), onClose);

  if (!isOpen || !source) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (status === 'secured' && !liveUrl.trim()) {
      setErrorMsg('Add the live URL where your backlink appears before marking this Secured.');
      return;
    }

    const result = onSave({
      source,
      newStatus: status,
      liveUrl: liveUrl.trim(),
      notes: notes.trim(),
    });

    if (result && !result.success) {
      if (result.requiresAuth) {
        onClose();
        return;
      }
      setErrorMsg(result.reason || 'Failed to update submission');
      return;
    }

    if (status === 'secured') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0B6B4F', '#10B981', '#111111'],
        });
      } catch (err) {}
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-modal-title"
        tabIndex={-1}
        className="bg-[#F7F7F7] dark:bg-[#141619] border border-[#111111] dark:border-[#26292E] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative transition-colors max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
            SUBMISSION TRACKER
          </div>
          <h2 id="submission-modal-title" className="text-2xl font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
            {source.name}
          </h2>
          <div className="flex items-center space-x-3 text-xs text-[#888888] dark:text-[#9CA3AF] font-mono mt-1">
            <span>DR {source.dr}</span>
            <span>·</span>
            <span className="capitalize">{source.source_follow_status}</span>
            {source.submission_url && (
              <>
                <span>·</span>
                <a
                  href={source.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0B6B4F] dark:text-[#10B981] hover:underline inline-flex items-center"
                >
                  <span>Open Submission</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Workflow Status Selector */}
          <div>
            <span id="workflow-status-label" className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-2">
              Workflow Status
            </span>
            <div role="group" aria-labelledby="workflow-status-label" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['unsubmitted', 'on_progress', 'submitted', 'secured', 'rejected', 'unable'].map(
                (st) => {
                  const isSelected = status === st;
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      aria-pressed={isSelected}
                      className={`text-xs py-2 px-3 font-semibold uppercase tracking-wider text-left transition-colors border ${
                        isSelected
                          ? st === 'secured'
                            ? 'bg-[#0B6B4F] dark:bg-[#10B981] text-white dark:text-[#0C0D0E] border-[#0B6B4F] dark:border-[#10B981]'
                            : 'bg-[#111111] dark:bg-[#F3F4F6] text-white dark:text-[#111111] border-[#111111] dark:border-[#F3F4F6]'
                          : 'bg-white dark:bg-[#1A1D21] text-[#555555] dark:text-[#9CA3AF] border-[#E0E0E0] dark:border-[#26292E] hover:border-[#111111] dark:hover:border-[#F3F4F6]'
                      }`}
                    >
                      {STATUS_LABELS[st] || st}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Live Link Input */}
          <div>
            <label htmlFor="submission-live-url" className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
              Live Backlink / Listing URL {status === 'secured' && <span className="text-[#0B6B4F] dark:text-[#10B981]">*</span>}
            </label>
            <input
              id="submission-live-url"
              type="url"
              required={status === 'secured'}
              placeholder="https://directory.com/listing/my-product"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] px-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
            />
            <p className="text-[11px] text-[#888888] dark:text-[#6B7280] mt-1">
              Record the URL where your profile or link appears live.
            </p>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="submission-notes" className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
              Submission Notes / Credentials
            </label>
            <textarea
              id="submission-notes"
              rows={3}
              placeholder="e.g. Submitted under Marketing category; pending manual review in 3-5 days."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] p-3 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
            />
          </div>

          {/* Timestamps Info (if present) */}
          {(currentSubmission?.submitted_at || currentSubmission?.secured_at) && (
            <div className="pt-2 border-t border-[#E0E0E0] dark:border-[#26292E] text-[11px] text-[#888888] dark:text-[#9CA3AF] space-y-1">
              {currentSubmission?.submitted_at && (
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Submitted on:{' '}
                    <strong className="text-[#111111] dark:text-[#F3F4F6]">
                      {new Date(currentSubmission.submitted_at).toLocaleString()}
                    </strong>
                  </span>
                </div>
              )}
              {currentSubmission?.secured_at && (
                <div className="flex items-center space-x-1.5 text-[#0B6B4F] dark:text-[#10B981]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Secured on:{' '}
                    <strong>
                      {new Date(currentSubmission.secured_at).toLocaleString()}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Form CTA Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E0E0E0] dark:border-[#26292E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
