import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaSave,
  FaUndo,
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
            status: "pending",
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

        // Load existing role specification
        const roleResponse = await axios.get("/team/role-specification/status");
        if (roleResponse.data.roleSpecification) {
          const data = roleResponse.data.roleSpecification;
          setExistingData(data);
          setFormData({
            assignments:
              data.assignments && data.assignments.length > 0
                ? data.assignments.map((assignment) => ({
                    member: assignment.member._id || assignment.member,
                    modules:
                      assignment.modules && assignment.modules.length > 0
                        ? assignment.modules
                        : [""],
                    activities:
                      assignment.activities && assignment.activities.length > 0
                        ? assignment.activities.map((activity) => ({
                            name: activity.name || "",
                            softDeadline: activity.softDeadline
                              ? new Date(activity.softDeadline)
                                  .toISOString()
                                  .slice(0, 16)
                              : "",
                            hardDeadline: activity.hardDeadline
                              ? new Date(activity.hardDeadline)
                                  .toISOString()
                                  .slice(0, 16)
                              : "",
                            details: activity.details || "",
                            status: activity.status || "pending",
                          }))
                        : [
                            {
                              name: "",
                              softDeadline: "",
                              hardDeadline: "",
                              details: "",
                              status: "pending",
                            },
                          ],
                  }))
                : initialFormState.assignments,
          });
        }

        // Load team members
        const teamResponse = await axios.get("/team/my-team");
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

          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (error.response?.status !== 404) {
          setMessage({
            type: "error",
            text: "Failed to load existing data. Starting with fresh form.",
          });
        }
      } finally {
        setLoadingStatus(false);
      }
    };

    loadData();
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleAssignmentChange = (assignmentIndex, field, value) => {
    const updatedAssignments = [...formData.assignments];
    updatedAssignments[assignmentIndex][field] = value;
    setFormData({ ...formData, assignments: updatedAssignments });
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

  const addAssignment = () => {
    setFormData({
      ...formData,
      assignments: [
        ...formData.assignments,
        {
          member: "",
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
        },
      ],
    });
  };

  const removeAssignment = (index) => {
    if (formData.assignments.length <= 1) return;
    const updatedAssignments = formData.assignments.filter(
      (_, i) => i !== index
    );
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
      status: "pending",
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
    // Check if at least one assignment has a member selected
    const validAssignments = formData.assignments.filter(
      (assignment) =>
        assignment.member && assignment.modules.some((module) => module.trim())
    );

    if (validAssignments.length === 0) {
      showMessage(
        "error",
        "Please add at least one assignment with a member and module"
      );
      return false;
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
                  ? new Date(activity.softDeadline).toISOString()
                  : null,
                hardDeadline: activity.hardDeadline
                  ? new Date(activity.hardDeadline).toISOString()
                  : null,
                details: activity.details,
                status: activity.status,
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <FaClock className="w-4 h-4 text-blue-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-teal-600 mb-4" />
          <p className="text-gray-600">Loading role specification form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-none mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg border-b border-gray-200 p-6 sm:p-8 md:p-10">
          <div className="text-center mx-auto max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Role Specification Form
            </h1>
            <h2 className="text-base sm:text-lg font-medium text-gray-700">
              Define assignments, modules, and activities for team members
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
                  <span className="text-gray-700 text-xs sm:text-sm">
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
        <div className="bg-white rounded-b-xl shadow-lg p-8">
          <div className="space-y-8">
            {formData.assignments.map((assignment, assignmentIndex) => (
              <div key={assignmentIndex} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaUser className="w-5 h-5 mr-2 text-teal-600" />
                    Assignment {assignmentIndex + 1}
                  </h3>
                  {formData.assignments.length > 1 && isEditable && (
                    <button
                      type="button"
                      onClick={() => removeAssignment(assignmentIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                      title="Remove Assignment"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Member Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Assign to Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignment.member}
                    onChange={(e) =>
                      handleAssignmentChange(
                        assignmentIndex,
                        "member",
                        e.target.value
                      )
                    }
                    disabled={!isEditable}
                    required
                    className={`w-full border border-gray-300 rounded-lg px-4 py-3 transition-all ${
                      isEditable
                        ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <option value="">Select a team member</option>
                    {teamMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} {member.isLeader ? "(Leader)" : ""} -{" "}
                        {member.rollNumber || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modules */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Modules <span className="text-red-500">*</span>
                    </label>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => addModule(assignmentIndex)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all duration-200"
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
                          className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 transition-all ${
                            isEditable
                              ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              : "bg-gray-100 cursor-not-allowed"
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
                    <label className="block text-sm font-semibold text-gray-700">
                      Activities
                    </label>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => addActivity(assignmentIndex)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all duration-200"
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
                        className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-gray-800">
                            Activity {activityIndex + 1}
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex items-center px-2 py-1 rounded-full text-xs border font-medium ${getStatusColor(
                                activity.status
                              )}`}
                            >
                              {getStatusIcon(activity.status)}
                              <span className="ml-1 capitalize">
                                {activity.status.replace("-", " ")}
                              </span>
                            </div>
                            {assignment.activities.length > 1 && isEditable && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeActivity(assignmentIndex, activityIndex)
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
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
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
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${
                                isEditable
                                  ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  : "bg-gray-100 cursor-not-allowed"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                              <FaCalendarAlt className="w-3 h-3 mr-1" />
                              Soft Deadline
                            </label>
                            <input
                              type="datetime-local"
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
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${
                                isEditable
                                  ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  : "bg-gray-100 cursor-not-allowed"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                              <FaCalendarAlt className="w-3 h-3 mr-1" />
                              Hard Deadline
                            </label>
                            <input
                              type="datetime-local"
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
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${
                                isEditable
                                  ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  : "bg-gray-100 cursor-not-allowed"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                              Status
                            </label>
                            <select
                              value={activity.status}
                              onChange={(e) =>
                                handleActivityChange(
                                  assignmentIndex,
                                  activityIndex,
                                  "status",
                                  e.target.value
                                )
                              }
                              disabled={!isEditable}
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${
                                isEditable
                                  ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  : "bg-gray-100 cursor-not-allowed"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
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
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all resize-none ${
                                isEditable
                                  ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  : "bg-gray-100 cursor-not-allowed"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Assignment Button */}
            {isEditable && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addAssignment}
                  className="flex items-center px-6 py-3 text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Another Assignment
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
              {isEditable && (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
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
                  <p className="text-gray-600 text-sm">
                    This form is in read-only mode. Status:{" "}
                    <span className="font-semibold capitalize">
                      {existingData?.status || "Unknown"}
                    </span>
                  </p>
                  {existingData?.status === "submitted" && (
                    <p className="text-gray-500 text-xs mt-1">
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
