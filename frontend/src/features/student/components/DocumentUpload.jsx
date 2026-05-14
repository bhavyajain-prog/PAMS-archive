import { useState, useEffect } from "react";
import axios from "../../../services/axios";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Users,
  User,
  Shield,
  Eye,
} from "lucide-react";

const DocumentUpload = () => {
  const [teamData, setTeamData] = useState(null);
  const [documents, setDocuments] = useState({});
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, documentType: null, documentName: null });

  // Fetch team documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/team/my-team/documents");
      const {
        team,
        documents: docs,
        documentTypes: types,
        isLeader: leader,
      } = response.data;

      setTeamData(team);
      setDocuments(docs);
      setDocumentTypes(types);
      setIsLeader(leader);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle file upload
  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    // All documents (including presentations) should be uploaded as PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("Only PDF files are allowed");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    try {
      setUploading({ ...uploading, [documentType]: true });
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("document", file);

      await axios.post(
        `/team/my-team/upload-document/${documentType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(
        `${documents[documentType]?.name || "Document"} uploaded successfully!`
      );
      await fetchDocuments();
    } catch (err) {
      console.error("Error uploading document:", err);
      setError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  // Handle file download
  const handleDownload = async (documentType) => {
    try {
      const response = await axios.get(
        `/team/my-team/download-document/${documentType}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Default filename should reflect expected extension
      const docMeta = documents[documentType] || {};
      const isPresentationType =
        String(documentType).toLowerCase().includes("ppt") ||
        String(documentType).toLowerCase().includes("presentation") ||
        String(docMeta.name || "").toLowerCase().includes("presentation") ||
        false;

      const defaultName = isPresentationType ? "presentation.pdf" : "document.pdf";

      link.setAttribute(
        "download",
        documents[documentType]?.originalName || defaultName
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      setError("Failed to download document");
    }
  };

  // Handle file delete
  const handleDeleteClick = (documentType, documentName) => {
    setDeleteModal({ show: true, documentType, documentName });
  };

  const confirmDelete = async () => {
    const { documentType } = deleteModal;
    setDeleteModal({ show: false, documentType: null, documentName: null });

    try {
      setError("");
      setSuccess("");

      await axios.delete(`/team/my-team/delete-document/${documentType}`);

      setSuccess("Document deleted successfully!");
      await fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err.response?.data?.message || "Failed to delete document");
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, documentType: null, documentName: null });
  };

  // Get status badge
  const StatusBadge = ({ status }) => {
    const configs = {
      admin_approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        text: "Admin Approved",
      },
      mentor_approved: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
        text: "Mentor Approved",
      },
      submitted: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        text: "Pending Review",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        text: "Rejected",
      },
      draft: {
        color: "bg-surface-alt text-heading border-edge",
        icon: FileText,
        text: "Draft",
      },
      not_submitted: {
        color: "bg-surface-alt text-body border-edge",
        icon: AlertCircle,
        text: "Not Submitted",
      },
    };

    const config = configs[status] || configs.not_submitted;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Document card component
  const DocumentCard = ({ docKey, document }) => {
    const isUploading = uploading[docKey];
    const hasFile = document.uploaded && document.filename;
    const canUpload = isLeader && !document.adminApproved;
    const canDelete = isLeader && hasFile && !document.adminApproved;

    return (
      <div className="bg-surface rounded-lg shadow-md border border-edge p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-heading mb-1">
                {document.name}
              </h3>
              <p className="text-sm text-body mb-3">{document.description}</p>
              <StatusBadge status={document.status} />
            </div>
            <div className="ml-4">
              <FileText className="w-8 h-8 text-muted" />
            </div>
          </div>

          {/* File info */}
          {hasFile && (
            <div className="bg-surface-alt rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-body">File:</span>
                <span className="font-medium text-heading">
                  {document.originalName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-body">Size:</span>
                <span className="font-medium text-heading">
                  {(document.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-body">Uploaded:</span>
                <span className="font-medium text-heading">
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              {document.mentorApproved && (
                <div className="flex items-center text-sm text-green-600 pt-2 border-t">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Mentor Approved</span>
                </div>
              )}
              {document.adminApproved && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Admin Approved</span>
                </div>
              )}
              {document.rejectionReason && (
                <div className="flex items-start text-sm text-red-600 pt-2 border-t">
                  <XCircle className="w-4 h-4 mr-1 mt-0.5" />
                  <span>{document.rejectionReason}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {/* Upload button (leader only) */}
          {canUpload && (
                <label
                  className={`flex-1 flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isUploading
                    ? "bg-gray-300 text-body cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-hover"
                    }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {hasFile ? "Replace" : "Upload"} PDF
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(docKey, file);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
          )}

          {/* Download button (all members) */}
          {hasFile && (
            <button
              onClick={() => handleDownload(docKey)}
              className="flex items-center justify-center px-3 py-1 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          )}

          {/* Delete button (leader only, not approved) */}
          {canDelete && (
            <button
              onClick={() => handleDeleteClick(docKey, document.name)}
              className="flex items-center justify-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          )}

          {/* View only for non-leaders with uploaded files */}
          {!isLeader && hasFile && (
            <div className="flex-1 flex items-center justify-center px-4 py-2 bg-surface-alt text-body rounded-lg text-sm font-medium">
              <Eye className="w-4 h-4 mr-2" />
              View Only (Not Leader)
            </div>
          )}
        </div>

        {/* Leader only indicator */}
        {!hasFile && !isLeader && (
          <div className="mt-4 flex items-center justify-center text-sm text-muted bg-surface-alt rounded-lg p-3">
            <Shield className="w-4 h-4 mr-2" />
            Only team leader can upload documents
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-body">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !teamData) {
    return (
      <div className="min-h-screen bg-base py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-heading mb-2">
              Error Loading Documents
            </h2>
            <p className="text-body mb-4">{error}</p>
            <button
              onClick={fetchDocuments}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading mb-2">
            Team Document Management
          </h1>
          <p className="text-lg text-body">
            Upload and manage your team&apos;s project documents
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Team Info Card */}
        {teamData && (
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-primary-subtle rounded-lg p-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-heading">
                    Team {teamData.code}
                  </h2>
                  <p className="text-sm text-body">
                    {teamData.members.length + 1} members •{" "}
                    {isLeader ? (
                      <span className="text-primary font-medium">
                        You are the team leader
                      </span>
                    ) : (
                      <span className="text-body">
                        Leader: {teamData.leader.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDocuments}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {/* Role indicator */}
            <div className="mt-4 p-4 bg-surface-alt rounded-lg">
              {isLeader ? (
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-heading">
                      Team Leader Permissions
                    </p>
                    <p className="text-sm text-body mt-1">
                      As the team leader, you can upload, replace, and delete
                      documents. Make sure to upload all required documents in
                      PDF format only.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-body mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-heading">
                      Team Member View
                    </p>
                    <p className="text-sm text-body mt-1">
                      You can view and download uploaded documents. Only your
                      team leader can upload or modify documents.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div>
          <h2 className="text-xl font-semibold text-heading mb-4">
            Required Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {documentTypes.map((docType) => (
              <DocumentCard
                key={docType.key}
                docKey={docType.key}
                document={documents[docType.key]}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-primary-subtle rounded-lg p-2">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-heading">
              Upload Guidelines
            </h3>
          </div>
          <div className="bg-surface-alt rounded-lg p-4">
            <ul className="space-y-3 text-sm text-body">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span>All documents must be in PDF format</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span>Maximum file size is 10MB per document</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span>Only the team leader can upload or modify documents</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  All team members can view and download uploaded documents
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span>Documents cannot be deleted once approved by admin</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 backdrop-blur-md bg-surface/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-heading text-center mb-2">
              Delete Document
            </h3>
            <p className="text-body text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-heading">{deleteModal.documentName}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-surface-alt text-body rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
