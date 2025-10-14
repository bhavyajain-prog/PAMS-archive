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

        {formType === "projectAbstract" && (
          <div className="mt-3 space-y-2">
            <div>
              <strong>Track:</strong> {form.projectTrack}
            </div>
            <div>
              <strong>GitHub:</strong> {form.githubRepo || "Not provided"}
            </div>
            <div>
              <strong>Tools:</strong> {form.tools?.length || 0} tools specified
            </div>
          </div>
        )}

        {formType === "roleSpecification" && (
          <div className="mt-3">
            <div>
              <strong>Assignments:</strong> {form.assignments?.length || 0}{" "}
              members assigned
            </div>
            <div className="mt-2">
              {form.assignments?.map((assignment, idx) => (
                <div key={idx} className="text-sm bg-white rounded p-2 mb-1">
                  <strong>Member {idx + 1}:</strong>{" "}
                  {assignment.modules?.length || 0} modules,{" "}
                  {assignment.activities?.length || 0} activities
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
        <span className="text-lg">Loading forms for approval...</span>
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
