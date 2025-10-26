import { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axios";
import {
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  User,
  ChevronDown,
  ChevronUp,
  Mail,
  Hash,
  BookOpen,
  Download,
} from "lucide-react";

const MentorDocumentReview = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  // Handle document download
  const handleDownload = async (teamId, documentType, originalName) => {
    try {
      const response = await axios.get(
        `/common/mentor/team/${teamId}/document/${documentType}`,
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

  // Fetch teams and document data
  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/common/mentor/document-review-status");
      const { teams: teamsData, statistics: stats } = response.data;

      setTeams(teamsData);
      setStatistics(stats);

      // Auto-select first team if available
      if (teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0]._id);
      }
    } catch (err) {
      console.error("Error fetching document data:", err);
      setError(err.response?.data?.message || "Failed to fetch document data");
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

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
            color: "bg-teal-100 text-teal-800 border-teal-200",
            icon: CheckCircle,
            text: "Admin Approved",
          };
        case "mentor_approved":
          return {
            color: "bg-teal-100 text-teal-800 border-teal-200",
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
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: FileText,
            text: "Draft",
          };
        case "not_submitted":
          return {
            color: "bg-gray-100 text-gray-600 border-gray-200",
            icon: AlertCircle,
            text: "Not Submitted",
          };
        default:
          return {
            color: "bg-gray-100 text-gray-600 border-gray-200",
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
    const isProjectAbstract = docKey === "projectAbstract";
    const isRoleSpecification = docKey === "roleSpecification";

    return (
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">{document.name}</h4>
          </div>
          {isWeeklyStatus ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                  <span className="text-gray-600">Total Reports:</span>
                  <span className="font-medium">{document.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Files:</span>
                  <span className="font-medium">
                    {document.reportsWithFiles}
                  </span>
                </div>
              </div>
              {document.latestSubmission && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest:</span>
                  <span className="font-medium">
                    {new Date(document.latestSubmission).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          ) : isProjectAbstract && document.data ? (
            // Display Project Abstract form details
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <h5 className="font-semibold text-gray-800 mb-2">Project Information</h5>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-gray-600 font-medium">Title: </span>
                    <span className="text-gray-900">{document.data.projectTitle || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Track: </span>
                    <span className="text-gray-900">{document.data.projectTrack || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Category: </span>
                    <span className="text-gray-900">{document.data.projectCategory || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Modules: </span>
                    <span className="text-gray-900">{document.data.numberOfModules || 'N/A'}</span>
                  </div>
                  {document.data.githubRepo && (
                    <div>
                      <span className="text-gray-600 font-medium">GitHub: </span>
                      <a href={document.data.githubRepo} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">
                        {document.data.githubRepo}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {document.data.tools && document.data.tools.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Tools & Technologies</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {document.data.tools.map((tool, idx) => (
                      <span key={idx} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                        {typeof tool === 'string' ? tool : tool.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {document.data.modules && document.data.modules.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Project Modules</h5>
                  <div className="space-y-2">
                    {document.data.modules.map((module, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-900">{module.moduleName}</div>
                        <div className="text-xs text-gray-600 mt-1">{module.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {document.data.objectives && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Objectives</h5>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{document.data.objectives}</p>
                </div>
              )}

              {document.data.scopeOfWork && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Scope of Work</h5>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{document.data.scopeOfWork}</p>
                </div>
              )}

              {document.data.teamMembers && document.data.teamMembers.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Team Member Roles</h5>
                  <div className="space-y-1.5">
                    {document.data.teamMembers.map((member, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <span className="text-gray-900">{member.name}</span>
                        <span className="text-gray-600 text-xs">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isRoleSpecification && document.data ? (
            // Display Role Specification form details
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <h5 className="font-semibold text-gray-800 mb-2">Project Title</h5>
                <p className="text-gray-900">{document.data.projectTitle || 'N/A'}</p>
              </div>

              {document.data.assignments && document.data.assignments.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-semibold text-gray-800 mb-2">Role Assignments</h5>
                  <div className="space-y-3">
                    {document.data.assignments.map((assignment, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border-l-4 border-teal-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{assignment.memberName}</div>
                            <div className="text-xs text-gray-600">{assignment.memberEmail}</div>
                          </div>
                          <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-medium">
                            {assignment.role}
                          </span>
                        </div>

                        {assignment.responsibilities && assignment.responsibilities.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Responsibilities:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700">
                              {assignment.responsibilities.map((resp, rIdx) => (
                                <li key={rIdx}>{resp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {assignment.technologies && assignment.technologies.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Technologies:</div>
                            <div className="flex flex-wrap gap-1">
                              {assignment.technologies.map((tech, tIdx) => (
                                <span key={tIdx} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.modules && assignment.modules.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Assigned Modules:</div>
                            <div className="flex flex-wrap gap-1">
                              {assignment.modules.map((module, mIdx) => (
                                <span key={mIdx} className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                  {module}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span
                  className={`font-medium ${document.submitted ? "text-teal-600" : "text-gray-400"
                    }`}
                >
                  {document.submitted ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Has Data:</span>
                <span
                  className={`font-medium ${document.hasData ? "text-teal-600" : "text-gray-400"
                    }`}
                >
                  {document.hasData ? "Yes" : "No"}
                </span>
              </div>
              {document.uploadedAt && (
                <div className="col-span-2 flex justify-between">
                  <span className="text-gray-600">Uploaded At:</span>
                  <span className="font-medium">
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {document.originalName && (
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-600">File:</span>
                  <button
                    onClick={() =>
                      handleDownload(teamId, docKey, document.originalName)
                    }
                    className="font-medium text-teal-600 hover:text-teal-800 flex items-center transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {document.originalName}
                  </button>
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
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Team Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-teal-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <span>{team.code}</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {team.batch} • {team.department} • {team.teamSize} members
                </p>
                {team.finalProject && (
                  <p className="text-sm text-teal-600 mt-1 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {team.finalProject.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {approvedDocuments}/{totalDocuments} Approved
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => toggleTeamExpansion(team._id)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
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
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Leader */}
                <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="bg-teal-100 rounded-full p-2">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-teal-900">
                      {team.leader.name} (Leader)
                    </p>
                    <p className="text-sm text-teal-600 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {team.leader.email}
                    </p>
                    {team.leader.rollNumber && (
                      <p className="text-sm text-teal-600 flex items-center">
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
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="bg-gray-100 rounded-full p-2">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </p>
                      {member.rollNumber && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {member.rollNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Document Status
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(team.documents).map(([docKey, document]) => {
                  const isFormDocument = docKey === "projectAbstract" || docKey === "roleSpecification";
                  return (
                    <div key={docKey} className={isFormDocument ? "col-span-1" : "lg:col-span-1"}>
                      <DocumentCard
                        document={document}
                        docKey={docKey}
                        teamId={team._id}
                      />
                    </div>
                  );
                })}
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
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDocumentData}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Teams Assigned
            </h2>
            <p className="text-gray-600">
              You don&apos;t have any teams assigned to you yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayedTeams = selectedTeam
    ? teams.filter((t) => t._id === selectedTeam)
    : teams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Review Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Review and monitor your assigned teams&apos; document submissions
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Assigned Teams
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.totalTeams}
                  </p>
                </div>
                <div className="bg-teal-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Teams with Submissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.teamsWithDocuments}
                  </p>
                </div>
                <div className="bg-teal-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
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

        {/* Team Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Select Team:
            </label>
            <div className="flex gap-3 flex-1 max-w-md w-full">
              <select
                value={selectedTeam || ""}
                onChange={(e) => setSelectedTeam(e.target.value || null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.code} - {team.leader.name}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchDocumentData}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-6">
          {displayedTeams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorDocumentReview;
