'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog behaviour shared by the app's modals: Escape closes, Tab stays inside
// the dialog, focus moves in on open and returns to the opener on close, and the
// page behind doesn't scroll. Attach the returned ref to the dialog panel
// (together with role="dialog" aria-modal="true" and a label).
export default function useModal(isOpen, onClose) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    // Put focus on the first field (skipping the close button) so typing can start.
    const frame = requestAnimationFrame(() => {
      const items = focusables();
      const target =
        items.find((el) => el.matches('input, textarea, select')) || items[0] || dialogRef.current;
      target?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen]);

  return dialogRef;
}
