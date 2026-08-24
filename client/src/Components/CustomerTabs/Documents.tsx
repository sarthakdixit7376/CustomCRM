import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FolderOpen, Upload, Trash2, RefreshCw, UserCircle2 } from 'lucide-react';
import { API_BASE } from '../../config';

interface PolicyDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  originalFilename?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string };
  uploadedBy?: { id: string; name: string };
  policy?: { id: string; policyNumber: string; policyType: string } | null;
}

interface DocumentsProps {
  customerId?: string | null;
  customerName?: string | null;
}

export default function Documents({ customerId, customerName }: DocumentsProps) {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploading = uploadProgress !== null;

  const fetchDocuments = async () => {
    if (!customerId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/customers/${customerId}/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, [customerId]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0 || !customerId) return;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await axios.post(`${API_BASE}/api/customers/${customerId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDocuments((prev) => [res.data, ...prev]);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
    setUploadProgress(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE}/api/policies/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!customerId) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6">
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-3 text-center shadow-card">
          <UserCircle2 size={36} className="text-neutral-300" />
          <div className="text-base font-bold text-text">Select a customer to view documents</div>
          <div className="text-sm text-text-muted max-w-[360px]">Go to the Customer List tab and check a customer's row, or click the documents button on their row.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-5">

      {/* Selected customer banner */}
      <div className="shrink-0 bg-surface border border-border rounded-xl px-7 py-5 flex items-center justify-between gap-3 flex-wrap shadow-card">
        <div className="flex items-center gap-3">
          <FolderOpen size={20} className="text-primary-600 shrink-0" />
          <div className="text-sm text-text">
            Documents for <span className="font-semibold">{customerName}</span>
          </div>
        </div>
        <div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} disabled={uploading} />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-2"
          >
            {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={2.5} />}
            {uploading ? `Classifying ${uploadProgress!.current}/${uploadProgress!.total}…` : 'Upload Documents'}
          </button>
        </div>
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="shrink-0 flex justify-center p-8"><RefreshCw size={20} className="animate-spin text-primary-500" /></div>
      ) : documents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-surface border border-border rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium whitespace-nowrap">{doc.documentType}</span>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline truncate text-sm">
                  {doc.originalFilename || 'View file'}
                </a>
                {doc.policy && (
                  <span className="shrink-0 text-xs text-text-muted whitespace-nowrap">Policy {doc.policy.policyNumber}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {(doc.uploadedBy?.name || doc.createdBy?.name) ? `${doc.uploadedBy?.name || doc.createdBy?.name} · ` : ''}
                  {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  disabled={deletingId === doc.id}
                  className="bg-transparent border-none p-1.5 cursor-pointer text-text-muted rounded transition-all hover:text-danger-600 hover:bg-danger-50 disabled:opacity-50 disabled:cursor-wait"
                  title="Delete document"
                  onClick={() => handleDelete(doc.id)}
                ><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <FolderOpen size={42} className="text-neutral-300" />
          <div className="text-lg font-bold text-text">No documents yet</div>
          <div className="text-sm text-text-muted max-w-[320px]">Upload one above — it's automatically OCR'd and sorted by document type.</div>
        </div>
      )}
    </div>
  );
}
