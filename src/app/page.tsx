"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, RefreshCcw, CheckCircle2 } from "lucide-react";
import { DragDropZone } from "@/components/FileUpload/DragDropZone";
import { FileRequirements } from "@/components/FileUpload/FileRequirements";
import { MetricsBoard } from "@/components/ResultSummary/MetricsBoard";
import { TestCasePreview } from "@/components/ResultSummary/TestCasePreview";
import { type TestCaseGenerationResult } from "@/lib/ai/types";

/**
 * The central page of the application, orchestrating components
 * to deliver a seamless, state-driven user experience.
 */
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    (TestCaseGenerationResult & { download_url: string }) | null
  >(null);

  /**
   * Primary upload handler. Packages the file as FormData and calls the Next.js backend API.
   * Modifies component state appropriately.
   */
  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/generate-testcases", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test cases.");
      }

      setResult(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred connecting to the server.";
      setError(errorMessage);
      setFile(null); // Reset file to allow immediate retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-primary-500/10 text-primary-400 px-4 py-1.5 rounded-full text-sm font-medium border border-primary-500/20 mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered QA Assistant</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-100 to-slate-400"
          >
            Generate Test Cases Instantly
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Upload your Usage Decisions, technical specs, or functional
            requirements. Our intelligent engine will parse the logic and build
            a comprehensive test suite for you.
          </motion.p>
        </div>

        {/* Dynamic Content Area based on Application State */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload-phase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div className="relative">
                <DragDropZone
                  onFileSelect={handleUpload}
                  isLoading={isLoading}
                />

                {/* Visual loading overlay */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-2xl border border-primary-500/30"
                    >
                      <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                      <p className="text-lg font-medium text-slate-200">
                        Analyzing Document Logic...
                      </p>
                      <p className="text-sm text-slate-400 mt-1 animate-pulse">
                        Running AI Models. This may take a moment.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 font-medium"
                >
                  {error}
                </motion.div>
              )}

              <FileRequirements />
            </motion.div>
          ) : (
            <motion.div
              key="results-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-8"
            >
              {/* 
                 Results Dashboard: Shows the breakdown of generated test cases.
                 Provides an option to restart the process and upload another document.
               */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" /> Test Generation
                    Complete
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Successfully parsed specs from:{" "}
                    <span className="text-slate-300 font-medium">
                      {file?.name}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="hidden sm:flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Start Over</span>
                </button>
              </div>

              <MetricsBoard summary={result.summary} />

              <div className="glass-panel p-6 sm:p-8 relative">
                <TestCasePreview
                  testCases={result.test_cases}
                  downloadUrl={result.download_url}
                />
              </div>

              <button
                onClick={handleReset}
                className="sm:hidden w-full mt-8 flex justify-center items-center space-x-2 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium border border-slate-700"
              >
                <RefreshCcw className="w-5 h-5" />
                <span>Upload Another Document</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
