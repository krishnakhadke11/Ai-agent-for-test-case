"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
  const [udFile, setUdFile] = useState<File | null>(null);
  const [hldFile, setHldFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    (TestCaseGenerationResult & { download_url?: string }) | null
  >(null);

  /**
   * Primary upload handler. Packages the files as FormData and calls the Next.js backend API.
   * Modifies component state appropriately.
   */
  const handleSubmit = async () => {
    if (!udFile || !hldFile) {
      setError(
        "Please provide both Usage Decision (UD) and High-Level Design (HLD) documents.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("ud_file", udFile);
      formData.append("hld_file", hldFile);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUdFile(null);
    setHldFile(null);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <DragDropZone
                    label="Usage Decision (UD)"
                    selectedFile={udFile}
                    onFileSelect={setUdFile}
                    onClear={() => setUdFile(null)}
                    isLoading={isLoading}
                  />
                  <DragDropZone
                    label="High-Level Design (HLD)"
                    selectedFile={hldFile}
                    onFileSelect={setHldFile}
                    onClear={() => setHldFile(null)}
                    isLoading={isLoading}
                  />
                </div>

                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleSubmit}
                    disabled={!udFile || !hldFile || isLoading}
                    className="flex w-full sm:w-auto items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20"
                  >
                    <span>Analyze & Generate Test Cases</span>
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>

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
              {result.status === "rejected" ? (
                <div className="w-full space-y-8">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-rose-400 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" /> Requirements
                        Mismatch Detected
                      </h2>
                      <p className="text-slate-400 mt-1">
                        High-Level Design does not adequately cover the Usage
                        Decision.
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

                  <div className="glass-panel p-6 sm:p-8 relative border border-rose-500/30">
                    <div className="mb-8 p-6 bg-slate-800/50 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-medium text-slate-200">
                          Coverage Score
                        </span>
                        <span className="text-3xl font-bold text-rose-400">
                          {Math.round(result.coveragePercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700">
                        <motion.div
                          className="bg-rose-500 h-4 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.coveragePercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-slate-400">
                        <span>Current coverage</span>
                        <span>Threshold: 90%</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-rose-300 border-b border-rose-500/20 pb-2">
                        Missing Requirements
                      </h3>
                      <ul className="list-disc pl-5 space-y-3 text-slate-300">
                        {result.missingRequirements?.map(
                          (req: any, i: number) => (
                            <li key={i}>
                              <strong className="text-white">{req.id}:</strong>{" "}
                              {req.description}
                            </li>
                          ),
                        )}
                      </ul>

                      {result.recommendations &&
                        result.recommendations.length > 0 && (
                          <div className="mt-8 p-5 bg-rose-500/5 rounded-xl border border-rose-500/20">
                            <p className="text-primary-300 text-sm font-semibold tracking-wide uppercase mb-2">
                              Recommendations
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-lg">
                              {result.recommendations.map(
                                (rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="sm:hidden w-full mt-8 flex justify-center items-center space-x-2 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium border border-slate-700"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    <span>Upload Another Document</span>
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-8">
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
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-slate-400 flex items-center space-x-2">
                          <span className="text-slate-300 font-medium bg-slate-800 px-2.5 py-1 rounded-md text-sm border border-slate-700">
                            UD: {udFile?.name}
                          </span>
                          <span className="text-slate-500">+</span>
                          <span className="text-slate-300 font-medium bg-slate-800 px-2.5 py-1 rounded-md text-sm border border-slate-700">
                            HLD: {hldFile?.name}
                          </span>
                        </p>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 text-sm border border-emerald-500/20 rounded-md">
                          {Math.round(result.coveragePercentage)}% Coverage
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="hidden sm:flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Start Over</span>
                    </button>
                  </div>

                  <MetricsBoard summary={result.coverageBreakdown} />

                  <div className="glass-panel p-6 sm:p-8 relative">
                    <TestCasePreview
                      testCases={result.testCases}
                      downloadUrl={result.download_url || ""}
                    />
                  </div>

                  <button
                    onClick={handleReset}
                    className="sm:hidden w-full mt-8 flex justify-center items-center space-x-2 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium border border-slate-700"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    <span>Upload Another Document</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
