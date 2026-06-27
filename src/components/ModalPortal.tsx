import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}

export function ModalPortal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  onSubmit,
}: ModalPortalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col overflow-hidden flex-1 h-full">
      {/* Scrollable Content Body */}
      <div className="p-6 overflow-y-auto flex-1 text-slate-800">
        {children}
      </div>

      {/* Fixed Footer */}
      {footer && (
        <div className="flex justify-end space-x-2 p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop occupying 100% of the screen */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm md:w-[85vw] md:max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[90vh] z-10 animate-fadeIn">
        {/* Fixed Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-2xl leading-none focus:outline-none transition cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Form Wrap */}
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col overflow-hidden flex-1">
            {content}
          </form>
        ) : (
          <div className="flex flex-col overflow-hidden flex-1">
            {content}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
