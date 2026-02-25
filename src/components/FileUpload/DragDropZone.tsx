"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  label?: string;
  selectedFile?: File | null;
  onClear?: () => void;
}

/**
 * DragDropZone handles the interactive file drop area.
 * It strictly separates the UI state (dragging, error) from the upload logic,
 * making it a clean, reusable component.
 */
export function DragDropZone({
  onFileSelect,
  isLoading,
  label = "Drop document here",
  selectedFile,
  onClear,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (selectedFile: File) => {
      setError(null);

      const ALLOWED_TYPES = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (
        !ALLOWED_TYPES.includes(selectedFile.type) &&
        !selectedFile.name.endsWith(".txt")
      ) {
        setError("Unsupported file format. Please upload PDF, DOCX, or TXT.");
        return;
      }
      onFileSelect(selectedFile);
    },
    [onFileSelect],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndSelect(e.dataTransfer.files[0]);
      }
    },
    [validateAndSelect],
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndSelect(e.target.files[0]);
      }
    },
    [validateAndSelect],
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* 
        The dropzone uses framer-motion for a smooth hover/tap feeling. 
        It dynamically alters border colors based on drag state. 
      */}
      <motion.div
        whileHover={{ scale: isLoading ? 1 : 1.01 }}
        whileTap={{ scale: isLoading ? 1 : 0.99 }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "glass-panel relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300",
          isDragging
            ? "border-primary-500 bg-primary-500/10"
            : selectedFile
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 cursor-pointer",
          isLoading && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <File className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-emerald-400">
                {label} Selected
              </p>
              <p className="text-slate-300">{selectedFile.name}</p>
            </div>
            {!isLoading && onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClear();
                }}
                className="mt-2 text-sm text-slate-400 hover:text-rose-400 transition-colors underline"
              >
                Remove File
              </button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-4 cursor-pointer w-full h-full">
            <UploadCloud
              className={cn(
                "w-12 h-12 text-slate-400 transition-colors",
                isDragging && "text-primary-500",
              )}
            />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-200">
                {isDragging ? "Drop document here" : label}
              </p>
              <p className="text-sm text-slate-400">
                PDF, DOCX, or TXT up to 10MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt"
              onChange={onFileInputChange}
              disabled={isLoading}
            />
          </label>
        )}
      </motion.div>

      {/* Error display cleanly separated from the upload zone */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center p-4 space-x-3 text-red-200 bg-red-900/40 border border-red-500/30 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
