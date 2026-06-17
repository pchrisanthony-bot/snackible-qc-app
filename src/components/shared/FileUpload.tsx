"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, X, FileImage, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  accept?: string;
  label: string;
  hint?: string;
  onFile: (file: File, preview?: string) => void;
}

export default function FileUpload({ accept = "image/*,.pdf", label, hint, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    // Always read as DataURL — images get a visual preview, PDFs get base64 for OCR
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (file.type.startsWith("image/")) setPreview(url);
      onFile(file, url);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setFileName(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {!fileName ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            dragging
              ? "border-[#2D6A4F] bg-[#EAF3DE]"
              : "border-[#C5DFAC] hover:border-[#2D6A4F] hover:bg-[#EAF3DE]"
          )}
        >
          <Upload className="w-8 h-8 text-[#7A9186] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#1A2B22]">{label}</p>
          {hint && <p className="text-xs text-[#7A9186] mt-1">{hint}</p>}
          <p className="text-xs text-[#7A9186] mt-2">Drag & drop or click to browse</p>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
        </div>
      ) : (
        <div className="border border-[#C5DFAC] rounded-xl overflow-hidden bg-[#EAF3DE]">
          {preview ? (
            // Image: show visual preview
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Artwork preview" className="w-full max-h-48 object-contain bg-white" />
              <button onClick={clear} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50">
                <X className="w-4 h-4 text-[#7A9186]" />
              </button>
              <p className="text-xs text-[#4A6358] px-4 py-2 truncate">{fileName}</p>
            </div>
          ) : (
            // PDF or other: show icon + filename only
            <div className="flex items-center gap-3 p-4">
              {fileName?.endsWith(".pdf") ? (
                <FileText className="w-6 h-6 text-red-500 flex-shrink-0" />
              ) : (
                <FileImage className="w-6 h-6 text-[#2D6A4F] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[#1A2B22] font-medium truncate block">{fileName}</span>
                <span className="text-xs text-[#7A9186]">Ready for OCR analysis</span>
              </div>
              <button onClick={clear}>
                <X className="w-4 h-4 text-[#7A9186] hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
