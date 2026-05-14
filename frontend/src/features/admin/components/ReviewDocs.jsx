import { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axios";
import {
  Search,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  BarChart3,
  User,
  ChevronDown,
  ChevronUp,
  Mail,
  Hash,
  BookOpen,
  Download,
} from "lucide-react";

const ReviewDocs = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // UI states
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState({ show: false, teamId: null, docKey: null });
  const [rejectReason, setRejectReason] = useState("");

  // Handle document download
  const handleDownload = async (teamId, documentType, originalName) => {
    try {
      const response = await axios.get(
        `/admin/team/${teamId}/document/${documentType}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName || "document.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      setError(err.response?.data?.message || "Failed to download document");
    }
  };

  // Handle document approve
  const handleApprove = async (teamId, docKey) => {
    try {
      setActionLoading({ ...actionLoading, [`approve-${teamId}-${docKey}`]: true });
      setError("");

      await axios.put(`/admin/team/${teamId}/document/${docKey}/approve`);

      // Refresh data
      await fetchDocumentData();
    } catch (err) {
      console.error("Error approving document:", err);
      setError(err.response?.data?.message || "Failed to approve document");
    } finally {
      setActionLoading({ ...actionLoading, [`approve-${teamId}-${docKey}`]: false });
    }
  };

  // Handle document reject (opens modal)
  const handleRejectClick = (teamId, docKey) => {
    setRejectModal({ show: true, teamId, docKey });
    setRejectReason("");
  };

  // Confirm reject
  const confirmReject = async () => {
    const { teamId, docKey } = rejectModal;
    setRejectModal({ show: false, teamId: null, docKey: null });

    try {
      setActionLoading({ ...actionLoading, [`reject-${teamId}-${docKey}`]: true });
      setError("");

      await axios.put(`/admin/team/${teamId}/document/${docKey}/reject`, {
        reason: rejectReason.trim() || "Document rejected by admin",
      });

      // Refresh data
      await fetchDocumentData();
      setRejectReason("");
    } catch (err) {
      console.error("Error rejecting document:", err);
      setError(err.response?.data?.message || "Failed to reject document");
    } finally {
      setActionLoading({ ...actionLoading, [`reject-${teamId}-${docKey}`]: false });
    }
  };

  // Cancel reject
  const cancelReject = () => {
    setRejectModal({ show: false, teamId: null, docKey: null });
    setRejectReason("");
  };

  // Fetch teams and document data
  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/admin/document-review-status");
      const { teams: teamsData, statistics: stats } = response.data;

      setTeams(teamsData);
      setFilteredTeams(teamsData);
      setStatistics(stats);
    } catch (err) {
      console.error("Error fetching document data:", err);
      setError(err.response?.data?.message || "Failed to fetch document data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

  // Filter teams based on search and filters
  useEffect(() => {
    let filtered = teams;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.leader.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.members.some(
            (member) =>
              member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              member.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((team) => team.status === statusFilter);
    }

    // Document completion filter
    if (documentFilter !== "all") {
      filtered = filtered.filter((team) => {
        const { submittedDocuments, approvedDocuments } =
          team.completionSummary;
        switch (documentFilter) {
          case "complete":
            return approvedDocuments === 3;
          case "partial":
            return submittedDocuments > 0 && approvedDocuments < 3;
          case "none":
            return submittedDocuments === 0;
          default:
            return true;
        }
      });
    }

    // Batch filter
    if (batchFilter !== "all") {
      filtered = filtered.filter((team) => team.batch === batchFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (team) => team.department === departmentFilter
      );
    }

    setFilteredTeams(filtered);
  }, [
    teams,
    searchTerm,
    statusFilter,
    documentFilter,
    batchFilter,
    departmentFilter,
  ]);

  // Get unique values for filters
  const uniqueBatches = [...new Set(teams.map((team) => team.batch))];
  const uniqueDepartments = [...new Set(teams.map((team) => team.department))];

  // Toggle team expansion
  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Get status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case "admin_approved":
          return {
            color: "bg-primary-subtle text-heading border-primary/20",
            icon: CheckCircle,
            text: "Admin Approved",
          };
        case "mentor_approved":
          return {
            color: "bg-primary-subtle text-heading border-primary/20",
            icon: CheckCircle,
            text: "Mentor Approved",
          };
        case "submitted":
          return {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            icon: Clock,
            text: "Pending Review",
          };
        case "rejected":
          return {
            color: "bg-red-100 text-red-800 border-red-200",
            icon: XCircle,
            text: "Rejected",
          };
        case "draft":
          return {
            color: "bg-surface-alt text-heading border-edge",
            icon: FileText,
            text: "Draft",
          };
        case "not_submitted":
          return {
            color: "bg-surface-alt text-body border-edge",
            icon: AlertCircle,
            text: "Not Submitted",
          };
        case "approved":
          return {
            color: "bg-primary-subtle text-heading border-primary/20",
            icon: CheckCircle,
            text: "Approved",
          };
        case "pending":
          return {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            icon: Clock,
            text: "Pending",
          };
        default:
          return {
            color: "bg-surface-alt text-body border-edge",
            icon: AlertCircle,
            text: status || "Unknown",
          };
      }
    };

    const config = getStatusConfig();
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
  const DocumentCard = ({ document, docKey, teamId }) => {
    const isWeeklyStatus = docKey === "weeklyStatus";
    const isApproving = actionLoading[`approve-${teamId}-${docKey}`];
    const isRejecting = actionLoading[`reject-${teamId}-${docKey}`];

    return (
      <div className="bg-surface-alt rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-muted" />
            <h4 className="font-medium text-heading">{document.name}</h4>
          </div>
          {isWeeklyStatus ? (
            <div className="flex items-center space-x-2 text-sm text-body">
              <span>
                {document.approvedReports}/{document.totalReports} approved
              </span>
              <StatusBadge
                status={
                  document.totalReports > 0 ? "submitted" : "not_submitted"
                }
              />
            </div>
          ) : (
            <StatusBadge status={document.status} />
          )}
        </div>

        <div className="space-y-2 text-sm">
          {isWeeklyStatus ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-body">Total Reports:</span>
                  <span className="font-medium">{document.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body">With Files:</span>
                  <span className="font-medium">
                    {document.reportsWithFiles}
                  </span>
                </div>
              </div>
              {document.latestSubmission && (
                <div className="flex justify-between">
                  <span className="text-body">Latest:</span>
                  <span className="font-medium">
                    {new Date(document.latestSubmission).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-body">Submitted:</span>
                  <span
                    className={`font-medium ${document.submitted ? "text-primary" : "text-muted"
                      }`}
                  >
                    {document.submitted ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body">Has Data:</span>
                  <span
                    className={`font-medium ${document.hasData ? "text-primary" : "text-muted"
                      }`}
                  >
                    {document.hasData ? "Yes" : "No"}
                  </span>
                </div>
                {document.submittedAt && (
                  <div className="col-span-2 flex justify-between">
                    <span className="text-body">Submitted At:</span>
                    <span className="font-medium">
                      {new Date(document.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {document.originalName && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-body">File:</span>
                    <span className="font-medium text-sm truncate max-w-[180px]">
                      {document.originalName}
                    </span>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() =>
                      handleDownload(teamId, docKey, document.originalName)
                    }
                    className="w-full flex items-center justify-center px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-hover transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>

                  {/* Approve/Reject Buttons - only for submitted or mentor_approved documents */}
                  {(document.status === "submitted" || document.status === "mentor_approved") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(teamId, docKey)}
                        disabled={isApproving || isRejecting}
                        className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApproving ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectClick(teamId, docKey)}
                        disabled={isApproving || isRejecting}
                        className="flex-1 flex items-center justify-center px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRejecting ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Show rejection reason if rejected */}
                  {document.status === "rejected" && document.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-800 font-medium">Rejection Reason:</p>
                      <p className="text-xs text-red-700">{document.rejectionReason}</p>
                    </div>
                  )}

                  {/* Show admin approval message */}
                  {document.status === "admin_approved" && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="text-xs text-green-800 font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved by Admin
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Team card component
  const TeamCard = ({ team }) => {
    const isExpanded = expandedTeams.has(team._id);
    const { approvedDocuments, totalDocuments } = team.completionSummary;
    const completionPercentage = Math.round(
      (approvedDocuments / totalDocuments) * 100
    );

    return (
      <div className="bg-surface rounded-lg shadow-md border border-edge overflow-hidden">
        {/* Team Header */}
        <div className="p-6 border-b border-edge-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-subtle rounded-lg p-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-heading flex items-center space-x-2">
                  <span>{team.code}</span>
                  <StatusBadge status={team.status} />
                </h3>
                <p className="text-sm text-body mt-1">
                  {team.batch} • {team.department} • {team.teamSize} members
                </p>
                {team.finalProject && (
                  <p className="text-sm text-primary mt-1 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {team.finalProject.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-heading">
                  {approvedDocuments}/{totalDocuments} Approved
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-primary-subtle0 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => toggleTeamExpansion(team._id)}
                className="p-2 rounded-lg hover:bg-surface-alt transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Team Members */}
            <div>
              <h4 className="font-medium text-heading mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Leader */}
                <div className="flex items-center space-x-3 p-3 bg-primary-subtle rounded-lg border border-primary/20">
                  <div className="bg-primary-subtle rounded-full p-2">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-heading">
                      {team.leader.name} (Leader)
                    </p>
                    <p className="text-sm text-primary flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {team.leader.email}
                    </p>
                    {team.leader.rollNumber && (
                      <p className="text-sm text-primary flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        {team.leader.rollNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Members */}
                {team.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center space-x-3 p-3 bg-surface-alt rounded-lg border"
                  >
                    <div className="bg-surface-alt rounded-full p-2">
                      <User className="w-4 h-4 text-body" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-heading">{member.name}</p>
                      <p className="text-sm text-body flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </p>
                      {member.rollNumber && (
                        <p className="text-sm text-body flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {member.rollNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor Information */}
            {team.mentor && (
              <div>
                <h4 className="font-medium text-heading mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Assigned Mentor
                </h4>
                <div className="flex items-center space-x-3 p-3 bg-primary-subtle rounded-lg border border-primary/20">
                  <div className="bg-primary-subtle rounded-full p-2">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-heading">
                      {team.mentor.name}
                    </p>
                    <p className="text-sm text-primary flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {team.mentor.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Per-team Document Type Statistics (moved from global stats) */}
            <div>
              <h4 className="font-medium text-heading mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Document Type Statistics (This Team)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {Object.entries(team.documents).map(([docKey, document]) => {
                  const isWeekly = docKey === "weeklyStatus";
                  const submitted = isWeekly
                    ? document.totalReports || 0
                    : document.submitted
                      ? 1
                      : 0;
                  const mentorApproved = isWeekly
                    ? document.approvedReports || 0
                    : document.mentorApproved
                      ? 1
                      : 0;
                  const adminApproved = isWeekly
                    ? 0
                    : document.adminApproved
                      ? 1
                      : 0;
                  const pending = isWeekly
                    ? Math.max((document.totalReports || 0) - (document.approvedReports || 0), 0)
                    : (document.status === "submitted" || document.status === "mentor_approved")
                      ? 1
                      : 0;

                  return (
                    <div key={docKey} className="bg-surface rounded-lg p-3 border">
                      <h5 className="font-medium text-sm text-heading mb-2">{document.name}</h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between text-body">
                          <span>Submitted</span>
                          <span className="font-medium text-primary">{submitted}</span>
                        </div>
                        <div className="flex justify-between text-body">
                          <span>Mentor Approved</span>
                          <span className="font-medium text-primary">{mentorApproved}</span>
                        </div>
                        {!isWeekly && (
                          <div className="flex justify-between text-body">
                            <span>Admin Approved</span>
                            <span className="font-medium text-primary">{adminApproved}</span>
                          </div>
                        )}
                        {pending > 0 && (
                          <div className="flex justify-between text-body">
                            <span>Pending Review</span>
                            <span className="font-medium text-yellow-600">{pending}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="font-medium text-heading mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Document Status
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(team.documents).map(([docKey, document]) => (
                  <DocumentCard
                    key={docKey}
                    document={document}
                    docKey={docKey}
                    teamId={team._id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-body">
              Loading document review data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-heading mb-2">
              Error Loading Data
            </h2>
            <p className="text-body mb-4">{error}</p>
            <button
              onClick={fetchDocumentData}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading mb-2">
            Document Review Dashboard
          </h1>
          <p className="text-lg text-body">
            Review and monitor team document submissions and approvals
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-body">
                    Total Teams
                  </p>
                  <p className="text-2xl font-bold text-heading">
                    {statistics.totalTeams}
                  </p>
                </div>
                <div className="bg-primary-subtle rounded-lg p-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-body">
                    Teams with Documents
                  </p>
                  <p className="text-2xl font-bold text-heading">
                    {statistics.teamsWithDocuments}
                  </p>
                </div>
                <div className="bg-primary-subtle rounded-lg p-3">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-body">
                    Fully Approved
                  </p>
                  <p className="text-2xl font-bold text-heading">
                    {statistics.fullyApprovedTeams}
                  </p>
                </div>
                <div className="bg-primary-subtle rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-body">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-heading">
                    {statistics.pendingReviewCount}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-3">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Type Statistics moved: per-team stats are shown inside each team's expanded card */}

        {/* Filters and Search */}
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search teams, members, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={documentFilter}
                onChange={(e) => setDocumentFilter(e.target.value)}
                className="px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Documents</option>
                <option value="complete">Fully Approved</option>
                <option value="partial">Partially Complete</option>
                <option value="none">No Documents</option>
              </select>

              {uniqueBatches.length > 0 && (
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Batches</option>
                  {uniqueBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              )}

              {uniqueDepartments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={fetchDocumentData}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-body">
            Showing {filteredTeams.length} of {teams.length} teams
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDocumentFilter("all");
                setBatchFilter("all");
                setDepartmentFilter("all");
              }}
              className="text-primary hover:text-primary text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Teams List */}
        <div className="space-y-6">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-heading mb-2">
                No teams found
              </h3>
              <p className="text-body">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            filteredTeams.map((team) => <TeamCard key={team._id} team={team} />)
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-heading mb-4">
              Reject Document
            </h3>
            <p className="text-sm text-body mb-4">
              Please provide a reason for rejection (optional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Confirm Reject
              </button>
              <button
                onClick={cancelReject}
                className="flex-1 px-4 py-2 bg-gray-200 text-heading rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDocs;
