import { useState, useRef } from "react";
import axios from "axios";
import { X, Upload, FileDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { playSuccess, playError, playClick } from "@/utils/sounds";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BatchImport({ onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      playError();
      toast.error("Please select a .csv file");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDownloadTemplate = () => {
    playClick();
    window.open(`${API}/students/import/template`, "_blank");
  };

  const handleUpload = async () => {
    if (!file) {
      playError();
      toast.error("Please select a CSV file first");
      return;
    }
    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    try {
      const r = await axios.post(`${API}/students/import`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data);
      if (r.data.imported > 0) {
        playSuccess();
        toast.success(`Imported ${r.data.imported} student${r.data.imported !== 1 ? "s" : ""}! 🎉`);
      } else {
        playError();
        toast.error("No students were imported. Check the errors below.");
      }
    } catch (err) {
      playError();
      toast.error(err.response?.data?.detail || "Failed to import CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleDone = () => {
    // Signal parent to refresh only if something was imported
    onClose(result && result.imported > 0);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
      data-testid="batch-import-modal"
    >
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full my-8 shadow-2xl bounce-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-emerald-900">📥 Batch Import Students</h2>
          <button
            onClick={() => { playClick(); onClose(false); }}
            className="p-2 rounded-full hover:bg-emerald-100 transition-colors"
            data-testid="import-close-btn"
          >
            <X size={20} className="text-emerald-700" />
          </button>
        </div>

        <p className="text-sm text-emerald-600 mb-5">
          Upload a CSV with columns:{" "}
          <span className="font-bold text-emerald-800">name, standard, school, exam_type, BC, EN, BM, MM, SN</span>
        </p>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors mb-5"
          data-testid="download-template-btn"
        >
          <FileDown size={15} /> Download CSV Template
        </button>

        {/* Drop area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
          data-testid="import-dropzone"
        >
          <Upload size={32} className="mx-auto text-emerald-400 mb-2" />
          <div className="font-bold text-emerald-800 text-sm">
            {file ? file.name : "Click to choose a CSV file"}
          </div>
          <div className="text-xs text-emerald-500 mt-1">Only .csv files accepted</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
            data-testid="import-file-input"
          />
        </div>

        {/* Result */}
        {result && (
          <div className="mt-5 space-y-3" data-testid="import-result">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-3 rounded-2xl">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <div className="font-bold text-emerald-800">
                {result.imported} student{result.imported !== 1 ? "s" : ""} imported successfully
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="bg-amber-50 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <div className="font-bold text-amber-800">
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped
                  </div>
                </div>
                <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => { playClick(); onClose(result && result.imported > 0); }}
            className="flex-1 bg-emerald-100 text-emerald-800 font-bold py-3 rounded-full hover:bg-emerald-200 transition-colors"
            data-testid="import-cancel-btn"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 bg-emerald-400 text-white font-bold py-3 rounded-full hover:bg-emerald-500 disabled:opacity-60 shadow-md hover:-translate-y-0.5 transition-all"
              data-testid="import-submit-btn"
            >
              {uploading ? "Importing..." : "Import CSV 📥"}
            </button>
          )}
          {result && result.imported > 0 && (
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 bg-emerald-400 text-white font-bold py-3 rounded-full hover:bg-emerald-500 shadow-md transition-all"
              data-testid="import-done-btn"
            >
              View Students
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
