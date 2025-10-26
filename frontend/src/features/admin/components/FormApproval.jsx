import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "../../../services/axios";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaInfoCircle,
  FaPrint,
  FaCommentDots,
  FaUsers,
  FaCode,
  FaTasks,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const FormApproval = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    action: "", // 'approve' or 'reject'
    formType: "", // 'projectAbstract' or 'roleSpecification'
    customMessage: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  // Fetch teams with pending forms
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        user.role === "admin" || user.role === "sub-admin"
          ? "/team/admin/forms-for-approval"
          : "/team/mentor/forms-for-approval";

      const response = await axios.get(endpoint);
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err.response?.data?.message || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Handle form approval/rejection
  const handleFormAction = async () => {
    try {
      setActionLoading(true);

      const endpoint =
        user.role === "admin" || user.role === "sub-admin"
          ? "/team/admin/approve-form"
          : "/team/mentor/approve-form";

      await axios.post(endpoint, {
        teamId: selectedTeam._id,
        formType: approvalData.formType,
        action: approvalData.action,
        customMessage: approvalData.customMessage,
      });

      // Refresh teams list
      await fetchTeams();

      // Close modal
      setShowApprovalModal(false);
      setApprovalData({ action: "", formType: "", customMessage: "" });
      setSelectedTeam(null);
    } catch (err) {
      console.error("Error processing form action:", err);
      setError(err.response?.data?.message || "Failed to process form action");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle print form (placeholder for now)
  const handlePrintForm = (team, formType) => {
    console.log("Print form:", { team: team.code, formType });
    // TODO: Implement print functionality
    alert(`Print functionality for ${formType} will be implemented next.`);
  };

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

  // Open approval modal
  const openApprovalModal = (team, formType, action) => {
    setSelectedTeam(team);
    setApprovalData({ action, formType, customMessage: "" });
    setShowApprovalModal(true);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      mentor_approved: "bg-green-100 text-green-700",
      admin_approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  // Check if form should be shown for approval based on user role
  const shouldShowFormForApproval = (form, userRole) => {
    if (!form) return false;

    if (userRole === "admin" || userRole === "sub-admin") {
      // Admin sees forms that are mentor-approved
      return form.status === "mentor_approved";
    } else {
      // Mentor sees forms that are submitted
      return form.status === "submitted";
    }
  };

  // Render form details
  const renderFormDetails = (team, formType) => {
    const form = team[formType];
    if (!form) return null;

    // Get project details from team's finalProject or first projectChoice
    const project = team.finalProject || (team.projectChoices && team.projectChoices.length > 0 ? team.projectChoices[0] : null);
    
    // Compute fallbacks for fields that may be stored under different keys depending on submission shape
    const projectTitle = project?.title || form.projectTitle || form.project?.title || "N/A";
    const projectCategory = project?.category || form.projectCategory || form.project?.category || "N/A";
    const numberOfModules =
      form.numberOfModules || (form.modules && form.modules.length) || (team.projectAbstract && team.projectAbstract.modules && team.projectAbstract.modules.length) || "N/A";

    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Submitted:</span>
            <span className="ml-2">
              {form.submittedAt
                ? new Date(form.submittedAt).toLocaleDateString()
                : "Not submitted"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-xs ${getStatusBadge(
                form.status
              )}`}
            >
              {form.status === "submitted"
                ? "AWAITING MENTOR APPROVAL"
                : form.status === "mentor_approved"
                  ? "AWAITING ADMIN APPROVAL"
                  : form.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <div className="text-sm">
            <div className="font-medium text-blue-800 mb-2">
              Approval Workflow:
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div
                className={`flex items-center ${form.status !== "draft" ? "text-green-600" : "text-gray-400"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-current mr-1"></span>
                Submitted
              </div>
              <div
                className={`flex items-center ${form.status === "mentor_approved" ||
                  form.status === "admin_approved"
                  ? "text-green-600"
                  : form.status === "submitted"
                    ? "text-blue-600"
                    : "text-gray-400"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-current mr-1"></span>
                Mentor Approval
              </div>
              <div
                className={`flex items-center ${form.status === "admin_approved"
                  ? "text-green-600"
                  : form.status === "mentor_approved"
                    ? "text-blue-600"
                    : "text-gray-400"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-current mr-1"></span>
                Admin Approval
              </div>
            </div>
          </div>
        </div>

        {/* PROJECT ABSTRACT FORM - COMPLETE DETAILS */}
        {formType === "projectAbstract" && (
          <div className="mt-4 space-y-4">
            {/* Project Information */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-3 text-base">📋 Project Information</h5>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-gray-700">Project Title:</span>
                    <p className="text-gray-900 mt-1">{projectTitle}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Project Track:</span>
                    <p className="text-gray-900 mt-1">{form.projectTrack || form.project?.track || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Project Category:</span>
                    <p className="text-gray-900 mt-1">{projectCategory}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Number of Modules:</span>
                    <p className="text-gray-900 mt-1">{numberOfModules}</p>
                  </div>
                </div>
                {form.githubRepo && (
                  <div className="mt-2">
                    <span className="font-semibold text-gray-700">GitHub Repository:</span>
                    <p className="mt-1">
                      <a href={form.githubRepo} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all">
                        {form.githubRepo}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tools & Technologies */}
            {form.tools && form.tools.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-base">🛠️ Tools & Technologies</h5>
                <div className="flex flex-wrap gap-2">
                  {form.tools.map((tool, idx) => {
                    // Handle both string and object formats
                    const toolName = typeof tool === 'string' ? tool : tool?.name || 'Unknown Tool';
                    const toolVersion = typeof tool === 'object' ? tool?.version : null;
                    return (
                      <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                        {toolName} {toolVersion && `(${toolVersion})`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Project Modules */}
            {form.modules && form.modules.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-base">📦 Project Modules</h5>
                <div className="space-y-3">
                  {form.modules.map((module, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="font-semibold text-gray-900 mb-1">
                        Module {idx + 1}: {module?.name || 'Unnamed Module'}
                      </div>
                      {module?.functionality && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Functionality:</span> {module.functionality}
                        </p>
                      )}
                      {module?.description && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Description:</span> {module.description}
                        </p>
                      )}
                      {!module?.functionality && !module?.description && (
                        <p className="text-sm text-gray-500 italic">No details provided</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members & Roles */}
            {form.teamMembers && form.teamMembers.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-base">👥 Team Members & Roles</h5>
                <div className="space-y-2">
                  {form.teamMembers.map((member, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <span className="text-sm text-gray-600 italic">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objectives */}
            {form.objectives && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-base">🎯 Objectives</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {form.objectives}
                </p>
              </div>
            )}

            {/* Scope of Work */}
            {form.scopeOfWork && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-base">📝 Scope of Work</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {form.scopeOfWork}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ROLE SPECIFICATION FORM - COMPLETE DETAILS */}
        {formType === "roleSpecification" && (
          <div className="mt-4 space-y-4">
            {/* Project Title */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-2 text-base">📋 Project Title</h5>
              <p className="text-gray-900">{projectTitle}</p>
            </div>

            {/* Role Assignments */}
            {form.assignments && form.assignments.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-4 text-base">👥 Role Assignments ({form.assignments.length} members)</h5>
                <div className="space-y-4">
                  {form.assignments.map((assignment, idx) => {
                    // Get member details - handle both populated and non-populated member field
                    const member = assignment.member;
                    const memberName = member?.name || assignment.memberName || `Member ${idx + 1}`;
                    const memberEmail = member?.email || assignment.memberEmail || 'No email';
                    const memberRollNumber = member?.studentData?.rollNumber || '';

                    return (
                      <div key={idx} className="p-4 bg-linear-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-500">
                        {/* Member Info */}
                        <div className="mb-3">
                          <div className="font-semibold text-gray-900 text-base">
                            {memberName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {memberEmail}
                            {memberRollNumber && <span className="ml-2">• {memberRollNumber}</span>}
                          </div>
                        </div>

                        {/* Responsibilities */}
                        {assignment.responsibilities && assignment.responsibilities.length > 0 && (
                          <div className="mb-3">
                            <div className="font-semibold text-gray-700 text-sm mb-2">📌 Responsibilities:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {assignment.responsibilities.map((resp, rIdx) => {
                                const respText = typeof resp === 'string' ? resp : resp?.description || resp?.name || 'Responsibility';
                                return (
                                  <li key={rIdx} className="text-sm text-gray-700 ml-2">{respText}</li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Technologies */}
                        {assignment.technologies && assignment.technologies.length > 0 && (
                          <div className="mb-3">
                            <div className="font-semibold text-gray-700 text-sm mb-2">💻 Technologies:</div>
                            <div className="flex flex-wrap gap-2">
                              {assignment.technologies.map((tech, tIdx) => {
                                const techName = typeof tech === 'string' ? tech : tech?.name || 'Unknown Tech';
                                return (
                                  <span key={tIdx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {techName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Modules */}
                        {assignment.modules && assignment.modules.length > 0 && (
                          <div className="mb-3">
                            <div className="font-semibold text-gray-700 text-sm mb-2">📦 Assigned Modules:</div>
                            <div className="flex flex-wrap gap-2">
                              {assignment.modules.map((module, mIdx) => {
                                const moduleName = typeof module === 'string' ? module : module?.moduleName || module?.name || 'Module';
                                return (
                                  <span key={mIdx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    {moduleName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Activities */}
                        {assignment.activities && assignment.activities.length > 0 && (
                          <div>
                            <div className="font-semibold text-gray-700 text-sm mb-2">✅ Activities:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {assignment.activities.map((activity, aIdx) => {
                                const activityText = typeof activity === 'string' ? activity : activity?.description || activity?.name || 'Activity';
                                return (
                                  <li key={aIdx} className="text-sm text-gray-700 ml-2">{activityText}</li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-slate-200 rounded w-56 mb-3 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-96 animate-pulse" />
              </div>
            </div>
          </div>

          {/* List skeletons */}
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg bg-white">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
                      <div>
                        <div className="h-4 bg-slate-200 rounded w-40 mb-2 animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <FaTimesCircle className="mr-2" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchTeams}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <FaCommentDots className="mr-3 text-blue-600" />
          Form Approval Center
        </h2>
        <p className="text-gray-600 mb-6">
          {user.role === "admin" || user.role === "sub-admin"
            ? "Review and approve forms that have been approved by mentors. Final approval step."
            : "Review and approve forms from your assigned teams. First approval step."}
        </p>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">
              No forms pending approval at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-lg">
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleTeamExpansion(team._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUsers className="text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Team {team.code}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {team.batch} - {team.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {team.pendingFormsCount} pending form(s)
                      </span>
                      {expandedTeams.has(team._id) ? (
                        <FaChevronUp className="text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedTeams.has(team._id) && (
                  <div className="p-4 border-t border-gray-200">
                    {/* Project Abstract Form */}
                    {team.projectAbstract &&
                      shouldShowFormForApproval(
                        team.projectAbstract,
                        user.role
                      ) && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-800 flex items-center">
                              <FaCode className="mr-2 text-green-600" />
                              Project Abstract (Form 1)
                            </h4>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handlePrintForm(team, "projectAbstract")
                                }
                                className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                              >
                                <FaPrint className="mr-1" />
                                Print
                              </button>
                              <button
                                onClick={() =>
                                  openApprovalModal(
                                    team,
                                    "projectAbstract",
                                    "approve"
                                  )
                                }
                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                              >
                                <FaCheckCircle className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  openApprovalModal(
                                    team,
                                    "projectAbstract",
                                    "reject"
                                  )
                                }
                                className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                              >
                                <FaTimesCircle className="mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                          {renderFormDetails(team, "projectAbstract")}
                        </div>
                      )}

                    {/* Role Specification Form */}
                    {team.roleSpecification &&
                      shouldShowFormForApproval(
                        team.roleSpecification,
                        user.role
                      ) && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-800 flex items-center">
                              <FaTasks className="mr-2 text-purple-600" />
                              Role Specification (Form 2)
                            </h4>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handlePrintForm(team, "roleSpecification")
                                }
                                className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                              >
                                <FaPrint className="mr-1" />
                                Print
                              </button>
                              <button
                                onClick={() =>
                                  openApprovalModal(
                                    team,
                                    "roleSpecification",
                                    "approve"
                                  )
                                }
                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                              >
                                <FaCheckCircle className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  openApprovalModal(
                                    team,
                                    "roleSpecification",
                                    "reject"
                                  )
                                }
                                className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                              >
                                <FaTimesCircle className="mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                          {renderFormDetails(team, "roleSpecification")}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {approvalData.action === "approve" ? "Approve" : "Reject"} Form
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Team: <strong>{selectedTeam?.code}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Form:{" "}
                <strong>
                  {approvalData.formType === "projectAbstract"
                    ? "Project Abstract (Form 1)"
                    : "Role Specification (Form 2)"}
                </strong>
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={approvalData.customMessage}
                onChange={(e) =>
                  setApprovalData((prev) => ({
                    ...prev,
                    customMessage: e.target.value,
                  }))
                }
                placeholder={`Add a custom message for ${approvalData.action}...`}
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows="3"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFormAction}
                disabled={actionLoading}
                className={`flex items-center px-4 py-2 text-white rounded transition-colors disabled:opacity-50 ${approvalData.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {actionLoading && <FaSpinner className="animate-spin mr-2" />}
                {approvalData.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormApproval;
