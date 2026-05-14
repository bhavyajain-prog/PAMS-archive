import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaUndo,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import axios from "../../../services/axios";

const RoleSpecificationForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [existingData, setExistingData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const initialFormState = {
    assignments: [
      {
        member: "",
        modules: [""],
        activities: [
          {
            name: "",
            softDeadline: "",
            hardDeadline: "",
            details: "",
          },
        ],
      },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Check if form should be editable
  const isEditable =
    !existingData ||
    existingData.status === "draft" ||
    existingData.status === "rejected" ||
    !existingData.status;

  // Load existing role specification data and team members
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStatus(true);
        console.log("🔄 Starting Form2 data load...");

        // Load team members first
        const teamResponse = await axios.get("/team/my-team");
        console.log("👥 Team data received:", teamResponse.data);

        if (teamResponse.data.team) {
          const team = teamResponse.data.team;
          const members = [];

          // Add leader
          if (team.leader) {
            members.push({
              _id: team.leader._id,
              name: team.leader.name,
              email: team.leader.email,
              rollNumber: team.leader.studentData?.rollNumber,
              isLeader: true,
            });
          }

          // Add other members
          if (team.members && team.members.length > 0) {
            team.members.forEach((member) => {
              if (member.student && member.student._id !== team.leader._id) {
                members.push({
                  _id: member.student._id,
                  name: member.student.name,
                  email: member.student.email,
                  rollNumber: member.student.studentData?.rollNumber,
                  isLeader: false,
                });
              }
            });
          }

          console.log("👥 Processed team members:", members);
          setTeamMembers(members);

          // Load existing role specification
          try {
            const roleResponse = await axios.get(
              "/team/role-specification/status"
            );
            console.log("📋 Role specification response:", roleResponse.data);

            if (roleResponse.data.roleSpecification) {
              const data = roleResponse.data.roleSpecification;
              setExistingData(data);

              // Process assignments with safer data handling
              const processedAssignments = members.map((member) => {
                // Find existing assignment for this member
                const existingAssignment = data.assignments?.find(
                  (a) => (a.member?._id || a.member) === member._id
                );

                return {
                  member: member._id,
                  modules:
                    existingAssignment?.modules?.length > 0
                      ? existingAssignment.modules
                      : [""],
                  activities:
                    existingAssignment?.activities?.length > 0
                      ? existingAssignment.activities.map((activity) => ({
                          name: activity.name || "",
                          softDeadline: activity.softDeadline
                            ? new Date(activity.softDeadline)
                                .toISOString()
                                .slice(0, 10)
                            : "",
                          hardDeadline: activity.hardDeadline
                            ? new Date(activity.hardDeadline)
                                .toISOString()
                                .slice(0, 10)
                            : "",
                          details: activity.details || "",
                        }))
                      : [
                          {
                            name: "",
                            softDeadline: "",
                            hardDeadline: "",
                            details: "",
                          },
                        ],
                };
              });

              console.log("📋 Processed assignments:", processedAssignments);
              setFormData({ assignments: processedAssignments });
            } else {
              console.log(
                "📋 No existing role specification found - creating assignments for all members"
              );
              // Create default assignments for all team members
              const defaultAssignments = members.map((member) => ({
                member: member._id,
                modules: [""],
                activities: [
                  {
                    name: "",
                    softDeadline: "",
                    hardDeadline: "",
                    details: "",
                    status: "pending",
                  },
                ],
              }));
              setFormData({ assignments: defaultAssignments });
            }
          } catch (roleError) {
            console.log(
              "📋 Role specification not found (404 expected for new forms):",
              roleError.response?.status
            );
            if (roleError.response?.status === 404) {
              // Create default assignments for all team members
              const defaultAssignments = members.map((member) => ({
                member: member._id,
                modules: [""],
                activities: [
                  {
                    name: "",
                    softDeadline: "",
                    hardDeadline: "",
                    details: "",
                    status: "pending",
                  },
                ],
              }));
              setFormData({ assignments: defaultAssignments });
            } else {
              console.error(
                "📋 Unexpected error loading role specification:",
                roleError
              );
              setMessage({
                type: "error",
                text: "Failed to load role specification. Starting with fresh form.",
              });
            }
          }
        }
      } catch (error) {
        console.error("❌ Critical error loading team data:", error);
        setMessage({
          type: "error",
          text: "Failed to load team data. Please refresh the page and try again.",
        });
      } finally {
        setLoadingStatus(false);
        console.log("✅ Form2 data load complete");
      }
    };

    loadData();
  }, []); // ← FIXED: Added proper dependency array

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleModuleChange = (assignmentIndex, moduleIndex, value) => {
    const updatedAssignments = [...formData.assignments];
    updatedAssignments[assignmentIndex].modules[moduleIndex] = value;
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const handleActivityChange = (
    assignmentIndex,
    activityIndex,
    field,
    value
  ) => {
    const updatedAssignments = [...formData.assignments];
    updatedAssignments[assignmentIndex].activities[activityIndex][field] =
      value;
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const addModule = (assignmentIndex) => {
    const updatedAssignments = [...formData.assignments];
    updatedAssignments[assignmentIndex].modules.push("");
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const removeModule = (assignmentIndex, moduleIndex) => {
    const updatedAssignments = [...formData.assignments];
    if (updatedAssignments[assignmentIndex].modules.length <= 1) return;
    updatedAssignments[assignmentIndex].modules = updatedAssignments[
      assignmentIndex
    ].modules.filter((_, i) => i !== moduleIndex);
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const addActivity = (assignmentIndex) => {
    const updatedAssignments = [...formData.assignments];
    updatedAssignments[assignmentIndex].activities.push({
      name: "",
      softDeadline: "",
      hardDeadline: "",
      details: "",
    });
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const removeActivity = (assignmentIndex, activityIndex) => {
    const updatedAssignments = [...formData.assignments];
    if (updatedAssignments[assignmentIndex].activities.length <= 1) return;
    updatedAssignments[assignmentIndex].activities = updatedAssignments[
      assignmentIndex
    ].activities.filter((_, i) => i !== activityIndex);
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const validateForm = () => {
    // Check if all assignments have at least one module
    for (let i = 0; i < formData.assignments.length; i++) {
      const assignment = formData.assignments[i];
      const memberDetails = teamMembers.find(
        (m) => m._id === assignment.member
      );
      const memberName = memberDetails ? memberDetails.name : `Member ${i + 1}`;

      if (!assignment.modules.some((module) => module.trim())) {
        showMessage(
          "error",
          `Please add at least one module for ${memberName}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Filter and clean data for submission
      const submitData = {
        assignments: formData.assignments
          .filter(
            (assignment) =>
              assignment.member &&
              assignment.modules.some((module) => module.trim())
          )
          .map((assignment) => ({
            member: assignment.member,
            modules: assignment.modules.filter((module) => module.trim()),
            activities: assignment.activities
              .filter((activity) => activity.name.trim())
              .map((activity) => ({
                name: activity.name,
                softDeadline: activity.softDeadline
                  ? new Date(activity.softDeadline).toISOString().slice(0, 10)
                  : null,
                hardDeadline: activity.hardDeadline
                  ? new Date(activity.hardDeadline).toISOString().slice(0, 10)
                  : null,
                details: activity.details,
              })),
          })),
      };

      const response = await axios.put("/team/role-specification", submitData);

      showMessage(
        "success",
        response.data.message || "Role specification submitted successfully!"
      );
      setExistingData(response.data.roleSpecification);
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit role specification. Please try again.";
      showMessage("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setMessage({ type: "", text: "" });
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="bg-surface rounded-xl shadow-lg p-8 flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-primary mb-4" />
          <p className="text-body">Loading role specification form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-none mx-auto">
        {/* Header */}
        <div className="bg-surface rounded-t-xl shadow-lg border-b border-edge p-6 sm:p-8 md:p-10">
          <div className="text-center mx-auto max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent mb-1 sm:mb-2">
              Role Specification Form
            </h1>
            <h2 className="text-base sm:text-lg font-medium text-body">
              Assign modules and activities to each team member (one assignment
              per member)
            </h2>
            {existingData && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border rounded-md">
                <FaCheckCircle
                  className={`${
                    existingData.status === "submitted"
                      ? "text-blue-600"
                      : existingData.status === "rejected"
                      ? "text-red-600"
                      : existingData.status === "mentor_approved"
                      ? "text-green-600"
                      : existingData.status === "admin_approved"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                />
                <span
                  className={`font-medium text-sm ${
                    existingData.status === "submitted"
                      ? "text-blue-800 bg-blue-50 border-blue-200"
                      : existingData.status === "rejected"
                      ? "text-red-800 bg-red-50 border-red-200"
                      : existingData.status === "mentor_approved"
                      ? "text-green-800 bg-green-50 border-green-200"
                      : existingData.status === "admin_approved"
                      ? "text-green-800 bg-green-50 border-green-200"
                      : "text-yellow-800 bg-yellow-50 border-yellow-200"
                  }`}
                >
                  Status:{" "}
                  {existingData.status === "submitted"
                    ? "Submitted (Under Review)"
                    : existingData.status === "rejected"
                    ? "Rejected (Can Edit)"
                    : existingData.status === "mentor_approved"
                    ? "Mentor Approved"
                    : existingData.status === "admin_approved"
                    ? "Admin Approved"
                    : existingData.status === "draft"
                    ? "Draft"
                    : "Unknown"}
                </span>
                {existingData.submittedAt && (
                  <span className="text-body text-xs sm:text-sm">
                    • Last updated:{" "}
                    {new Date(existingData.submittedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className="mt-4 mb-4 w-full px-6 sm:px-8 md:px-10">
            <div
              className={`p-4 sm:p-5 rounded-lg border flex items-start gap-2 ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="mt-0.5 flex-shrink-0" />
              ) : (
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm sm:text-base">{message.text}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-surface rounded-b-xl shadow-lg p-8">
          <div className="space-y-8">
            {formData.assignments.map((assignment, assignmentIndex) => {
              // Find the member details for this assignment
              const memberDetails = teamMembers.find(
                (m) => m._id === assignment.member
              );

              return (
                <div
                  key={assignmentIndex}
                  className="bg-surface-alt rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <FaUser className="w-5 h-5 mr-2 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold text-heading">
                          {memberDetails ? (
                            <>
                              {memberDetails.name}
                              {memberDetails.isLeader && (
                                <span className="ml-2 px-2 py-1 bg-primary-subtle text-heading text-xs rounded-full">
                                  Leader
                                </span>
                              )}
                            </>
                          ) : (
                            `Assignment ${assignmentIndex + 1}`
                          )}
                        </h3>
                        {memberDetails && (
                          <p className="text-sm text-body">
                            {memberDetails.rollNumber || memberDetails.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Assignment Info (Read-only) */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-body mb-3">
                      Team Member
                    </label>
                    <div className="w-full border border-edge rounded-lg px-4 py-3 bg-surface-alt text-body">
                      {memberDetails ? (
                        <>
                          {memberDetails.name}{" "}
                          {memberDetails.isLeader ? "(Leader)" : ""} -{" "}
                          {memberDetails.rollNumber || memberDetails.email}
                        </>
                      ) : (
                        "Member not found"
                      )}
                    </div>
                    <p className="mt-1 text-xs text-body">
                      Each team member automatically gets one assignment. Add
                      modules and activities below.
                    </p>
                  </div>

                  {/* Modules */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-body">
                        Modules <span className="text-red-500">*</span>
                      </label>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => addModule(assignmentIndex)}
                          className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all duration-200"
                        >
                          <FaPlus className="w-3 h-3" />
                          Add Module
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {assignment.modules.map((module, moduleIndex) => (
                        <div
                          key={moduleIndex}
                          className="flex items-center gap-3"
                        >
                          <input
                            type="text"
                            value={module}
                            onChange={(e) =>
                              handleModuleChange(
                                assignmentIndex,
                                moduleIndex,
                                e.target.value
                              )
                            }
                            placeholder="e.g., User Authentication, Dashboard"
                            disabled={!isEditable}
                            required
                            className={`flex-1 border border-edge rounded-lg px-3 py-2 transition-all ${
                              isEditable
                                ? "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                                : "bg-surface-alt cursor-not-allowed"
                            }`}
                          />
                          {assignment.modules.length > 1 && isEditable && (
                            <button
                              type="button"
                              onClick={() =>
                                removeModule(assignmentIndex, moduleIndex)
                              }
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                              title="Remove module"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-body">
                        Activities
                      </label>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => addActivity(assignmentIndex)}
                          className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all duration-200"
                        >
                          <FaPlus className="w-3 h-3" />
                          Add Activity
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {assignment.activities.map((activity, activityIndex) => (
                        <div
                          key={activityIndex}
                          className="bg-surface p-5 rounded-lg border border-edge shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-heading">
                              Activity {activityIndex + 1}
                            </h4>
                            <div className="flex items-center gap-2">
                              {assignment.activities.length > 1 &&
                                isEditable && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeActivity(
                                        assignmentIndex,
                                        activityIndex
                                      )
                                    }
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                                    title="Remove activity"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-xs font-semibold text-body mb-2 uppercase tracking-wide">
                                Activity Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={activity.name}
                                onChange={(e) =>
                                  handleActivityChange(
                                    assignmentIndex,
                                    activityIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Design user interface, Implement login system"
                                disabled={!isEditable}
                                required
                                className={`w-full border border-edge rounded-lg px-3 py-2 transition-all ${
                                  isEditable
                                    ? "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                                    : "bg-surface-alt cursor-not-allowed"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-body mb-2 uppercase tracking-wide flex items-center">
                                <FaCalendarAlt className="w-3 h-3 mr-1" />
                                Soft Deadline
                              </label>
                              <input
                                type="date"
                                value={activity.softDeadline}
                                onChange={(e) =>
                                  handleActivityChange(
                                    assignmentIndex,
                                    activityIndex,
                                    "softDeadline",
                                    e.target.value
                                  )
                                }
                                disabled={!isEditable}
                                className={`w-full border border-edge rounded-lg px-3 py-2 transition-all ${
                                  isEditable
                                    ? "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                                    : "bg-surface-alt cursor-not-allowed"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-body mb-2 uppercase tracking-wide flex items-center">
                                <FaCalendarAlt className="w-3 h-3 mr-1" />
                                Hard Deadline
                              </label>
                              <input
                                type="date"
                                value={activity.hardDeadline}
                                onChange={(e) =>
                                  handleActivityChange(
                                    assignmentIndex,
                                    activityIndex,
                                    "hardDeadline",
                                    e.target.value
                                  )
                                }
                                disabled={!isEditable}
                                className={`w-full border border-edge rounded-lg px-3 py-2 transition-all ${
                                  isEditable
                                    ? "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                                    : "bg-surface-alt cursor-not-allowed"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-body mb-2 uppercase tracking-wide">
                                Details
                              </label>
                              <textarea
                                value={activity.details}
                                onChange={(e) =>
                                  handleActivityChange(
                                    assignmentIndex,
                                    activityIndex,
                                    "details",
                                    e.target.value
                                  )
                                }
                                placeholder="Activity details and requirements..."
                                disabled={!isEditable}
                                rows={2}
                                className={`w-full border border-edge rounded-lg px-3 py-2 transition-all resize-none ${
                                  isEditable
                                    ? "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                                    : "bg-surface-alt cursor-not-allowed"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-edge">
              {isEditable && (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        {existingData
                          ? "Update Specification"
                          : "Submit Specification"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={submitting}
                    className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FaUndo />
                    Reset Form
                  </button>
                </>
              )}
              {!isEditable && (
                <div className="text-center py-4">
                  <p className="text-body text-sm">
                    This form is in read-only mode. Status:{" "}
                    <span className="font-semibold capitalize">
                      {existingData?.status || "Unknown"}
                    </span>
                  </p>
                  {existingData?.status === "submitted" && (
                    <p className="text-muted text-xs mt-1">
                      The form will become editable again if rejected by
                      mentor/admin.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSpecificationForm;
