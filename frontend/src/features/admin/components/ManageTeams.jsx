import { useState, useEffect } from "react";
import axios from "../../../services/axios";
import {
  FaUsers,
  FaFilter,
  FaPlusCircle,
  FaInfoCircle,
  FaProjectDiagram,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaDownload,
  FaCalendarAlt,
  FaStar,
  FaFileArchive,
  FaClock,
  FaComment,
} from "react-icons/fa";

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden border border-gray-100`}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Team Details Modal Component
const TeamDetailsModal = ({ isOpen, onClose, team, onOpenActionModal }) => {
  if (!team) return null;

  const leader = team.leader;

  // Handle file download
  const handleDownloadFile = async (teamId, week) => {
    try {
      const response = await axios.get(
        `/api/teams/admin/download/${teamId}/${week}`,
        {
          responseType: "blob",
        }
      );

      // Get filename from response headers or create default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `team_${teamId}_week_${week}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Team Details: ${team.code}`}
      size="xl"
    >
      <div className="space-y-8">
        {/* Team Status and Basic Info */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-200 pb-2">
                Team Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600">Code:</strong>
                  <span className="font-semibold text-gray-800">
                    {team.code}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600">Status:</strong>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      team.status === "approved"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : team.status === "rejected"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    }`}
                  >
                    {team.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600">Department:</strong>
                  <span className="font-semibold text-gray-800">
                    {team.department ||
                      leader?.studentData?.department ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600">Batch:</strong>
                  <span className="font-semibold text-gray-800">
                    {team.batch || leader?.studentData?.batch || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600">Team Size:</strong>
                  <span className="font-semibold text-gray-800">
                    {(team.members?.length || 0) + 1} members
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-200 pb-2">
                Project & Mentor Status
              </h4>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600 block mb-1">
                    Final Project:
                  </strong>
                  <span className="font-semibold text-gray-800">
                    {team.finalProject?.title || "Not allocated"}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-600 block mb-1">Mentor:</strong>
                  <span className="font-semibold text-gray-800">
                    {team.mentor?.assigned?.name ||
                      (team.mentor?.currentPreference === -1
                        ? "Needs allocation"
                        : "In progress")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Evaluation Summary */}
        {team.evaluation?.weeklyStatus &&
          team.evaluation.weeklyStatus.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200 shadow-sm">
              <h4 className="font-bold text-teal-800 mb-3 text-md flex items-center">
                <FaCheckCircle className="mr-2" />
                Weekly Evaluation Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                  <div className="text-lg font-bold text-teal-700">
                    {team.evaluation.weeklyStatus.length}
                  </div>
                  <div className="text-xs text-teal-600">Submissions</div>
                </div>
                <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-700">
                    {
                      team.evaluation.weeklyStatus.filter(
                        (s) => s.status === "mentor_reviewed"
                      ).length
                    }
                  </div>
                  <div className="text-xs text-green-600">Reviewed</div>
                </div>
                <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">
                    {team.evaluation.weeklyStatus.filter(
                      (s) =>
                        s.mentorScore !== null && s.mentorScore !== undefined
                    ).length > 0
                      ? (
                          team.evaluation.weeklyStatus
                            .filter(
                              (s) =>
                                s.mentorScore !== null &&
                                s.mentorScore !== undefined
                            )
                            .reduce((sum, s) => sum + s.mentorScore, 0) /
                          team.evaluation.weeklyStatus.filter(
                            (s) =>
                              s.mentorScore !== null &&
                              s.mentorScore !== undefined
                          ).length
                        ).toFixed(1)
                      : "N/A"}
                  </div>
                  <div className="text-xs text-blue-600">Avg Score</div>
                </div>
                <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                  <div className="text-lg font-bold text-orange-700">
                    {
                      team.evaluation.weeklyStatus.filter(
                        (s) => s.status === "submitted"
                      ).length
                    }
                  </div>
                  <div className="text-xs text-orange-600">Pending</div>
                </div>
              </div>
            </div>
          )}

        {/* Team Leader */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaUsers className="mr-2 text-teal-600" />
            Team Leader
          </h4>
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{leader?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="font-medium">
                  {leader?.studentData?.rollNumber || leader?.username || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{leader?.email || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaUsers className="mr-2 text-teal-600" />
            Team Members (
            {team.members?.filter((m) => m.student?._id !== leader?._id)
              .length || 0}
            )
          </h4>
          {team.members?.filter((m) => m.student?._id !== leader?._id).length >
          0 ? (
            <div className="space-y-3">
              {team.members
                .filter((m) => m.student?._id !== leader?._id)
                .map((member, index) => (
                  <div
                    key={member.student?._id || index}
                    className="bg-gray-50 p-4 rounded-lg border"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">
                          {member.student?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Roll Number</p>
                        <p className="font-medium">
                          {member.student?.studentData?.rollNumber ||
                            member.student?.username ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">
                          {member.student?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
              No other members in this team
            </div>
          )}
        </div>

        {/* Project Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaProjectDiagram className="mr-2 text-teal-600" />
            Project Information
          </h4>
          {team.finalProject ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-2">
                Final Allocated Project
              </h5>
              <div className="space-y-2">
                <p>
                  <strong>Title:</strong> {team.finalProject.title}
                </p>
                <p>
                  <strong>Category:</strong> {team.finalProject.category}
                </p>
                <p>
                  <strong>Description:</strong> {team.finalProject.description}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Project Choices
              </h5>
              {team.projectChoices?.length > 0 ? (
                <div className="space-y-3">
                  {team.projectChoices.map((project, index) => (
                    <div
                      key={project._id || index}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-teal-700">
                            Choice {index + 1}: {project.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Category:</strong> {project.category}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
                            {project.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
                  No project choices specified
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mentor Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaChalkboardTeacher className="mr-2 text-teal-600" />
            Mentor Information
          </h4>
          {team.mentor?.assigned ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-2">
                Assigned Mentor
              </h5>
              <p className="font-medium">
                {team.mentor.assigned.name || team.mentor.assigned.username}
              </p>
            </div>
          ) : team.mentor?.currentPreference === -1 ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 className="font-semibold text-red-800 mb-2">Mentor Status</h5>
              <p className="text-red-700">
                Needs manual allocation by administrator
              </p>
            </div>
          ) : (
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Mentor Preferences
              </h5>
              {team.mentor?.preferences?.length > 0 ? (
                <div className="space-y-2">
                  {team.mentor.preferences.map((mentor, index) => (
                    <div
                      key={mentor._id || index}
                      className="bg-gray-50 p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Preference {index + 1}:{" "}
                          {mentor.name || mentor.username || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
                  No mentor preferences specified
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weekly Status Evaluation */}
        {team.evaluation && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FaCheckCircle className="mr-2 text-teal-600" />
              Weekly Status & Evaluation
            </h4>

            {team.evaluation.weeklyStatus &&
            team.evaluation.weeklyStatus.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Total Submissions
                        </p>
                        <p className="font-bold text-blue-700 text-lg">
                          {team.evaluation.weeklyStatus.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Avg Score</p>
                        <p className="font-bold text-green-700 text-lg">
                          {team.evaluation.weeklyStatus.filter(
                            (s) =>
                              s.mentorScore !== null &&
                              s.mentorScore !== undefined
                          ).length > 0
                            ? (
                                team.evaluation.weeklyStatus
                                  .filter(
                                    (s) =>
                                      s.mentorScore !== null &&
                                      s.mentorScore !== undefined
                                  )
                                  .reduce((sum, s) => sum + s.mentorScore, 0) /
                                team.evaluation.weeklyStatus.filter(
                                  (s) =>
                                    s.mentorScore !== null &&
                                    s.mentorScore !== undefined
                                ).length
                              ).toFixed(1)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <FaComment className="text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Reviewed</p>
                        <p className="font-bold text-purple-700 text-lg">
                          {
                            team.evaluation.weeklyStatus.filter(
                              (s) => s.status === "mentor_reviewed"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="font-bold text-orange-700 text-lg">
                          {
                            team.evaluation.weeklyStatus.filter(
                              (s) => s.status === "submitted"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Submissions List */}
                <div className="space-y-3">
                  {team.evaluation.weeklyStatus
                    .sort((a, b) => b.week - a.week)
                    .map((submission, index) => (
                      <div
                        key={submission._id || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-teal-700 text-sm">
                                W{submission.week}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-800">
                                Week {submission.week} - {submission.module}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {new Date(
                                  submission.dateRange.from
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  submission.dateRange.to
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                submission.status === "mentor_reviewed"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : submission.status === "submitted"
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                            >
                              {submission.status === "mentor_reviewed"
                                ? "Reviewed"
                                : submission.status === "submitted"
                                ? "Pending"
                                : submission.status || "Unknown"}
                            </span>

                            {/* Mentor Score */}
                            {submission.mentorScore !== null &&
                              submission.mentorScore !== undefined && (
                                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                  <FaStar className="text-blue-600 text-xs" />
                                  <span className="text-sm font-semibold text-blue-700">
                                    {submission.mentorScore}/10
                                  </span>
                                </div>
                              )}

                            {/* Download Button */}
                            {submission.projectFile && (
                              <button
                                onClick={() =>
                                  handleDownloadFile(team._id, submission.week)
                                }
                                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-medium text-gray-700 transition-colors"
                                title={`Download ${submission.projectFile.filename}`}
                              >
                                <FaDownload className="text-xs" />
                                <FaFileArchive className="text-xs" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress & Achievements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h6 className="font-medium text-gray-700 text-sm mb-1">
                              Progress:
                            </h6>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {submission.progress}
                            </p>
                          </div>

                          {submission.achievements &&
                            submission.achievements.length > 0 && (
                              <div>
                                <h6 className="font-medium text-gray-700 text-sm mb-1">
                                  Achievements:
                                </h6>
                                <div className="space-y-1">
                                  {submission.achievements
                                    .slice(0, 2)
                                    .map((achievement, i) => (
                                      <p
                                        key={i}
                                        className="text-sm text-gray-600 bg-green-50 p-2 rounded"
                                      >
                                        • {achievement}
                                      </p>
                                    ))}
                                  {submission.achievements.length > 2 && (
                                    <p className="text-xs text-gray-500 italic">
                                      +{submission.achievements.length - 2} more
                                      achievements
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Challenges */}
                        {submission.challenges &&
                          submission.challenges.length > 0 && (
                            <div className="mb-3">
                              <h6 className="font-medium text-gray-700 text-sm mb-1">
                                Challenges:
                              </h6>
                              <div className="space-y-1">
                                {submission.challenges
                                  .slice(0, 2)
                                  .map((challenge, i) => (
                                    <p
                                      key={i}
                                      className="text-sm text-gray-600 bg-red-50 p-2 rounded"
                                    >
                                      • {challenge}
                                    </p>
                                  ))}
                                {submission.challenges.length > 2 && (
                                  <p className="text-xs text-gray-500 italic">
                                    +{submission.challenges.length - 2} more
                                    challenges
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        {/* File Info */}
                        {submission.projectFile && (
                          <div className="mb-3">
                            <h6 className="font-medium text-gray-700 text-sm mb-1">
                              Project File:
                            </h6>
                            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                              <FaFileArchive className="text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                {submission.projectFile.filename}
                              </span>
                              <span className="text-xs text-gray-500">
                                (
                                {(
                                  submission.projectFile.size /
                                  (1024 * 1024)
                                ).toFixed(2)}{" "}
                                MB)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Mentor Comments */}
                        {submission.mentorComments && (
                          <div className="mb-3">
                            <h6 className="font-medium text-gray-700 text-sm mb-1">
                              Mentor Comments:
                            </h6>
                            <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                              {submission.mentorComments}
                            </p>
                          </div>
                        )}

                        {/* Student Remarks */}
                        {submission.studentRemarks && (
                          <div className="mb-3">
                            <h6 className="font-medium text-gray-700 text-sm mb-1">
                              Student Remarks:
                            </h6>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {submission.studentRemarks}
                            </p>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                          <span>
                            Submitted:{" "}
                            {new Date(submission.submittedAt).toLocaleString()}
                            {submission.submittedBy?.name &&
                              ` by ${submission.submittedBy.name}`}
                          </span>
                          {submission.scoredAt && (
                            <span>
                              Scored:{" "}
                              {new Date(submission.scoredAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                <FaCalendarAlt className="mx-auto text-gray-400 text-2xl mb-2" />
                <p className="text-gray-500 font-medium">
                  No weekly submissions yet
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Weekly status submissions will appear here once students start
                  submitting
                </p>
              </div>
            )}
          </div>
        )}

        {/* Project Abstract */}
        {team.projectAbstract && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FaProjectDiagram className="mr-2 text-purple-600" />
              Project Abstract
              {team.projectAbstract.status && (
                <span
                  className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${
                    team.projectAbstract.status === "submitted" ||
                    team.projectAbstract.status === "admin_approved" ||
                    team.projectAbstract.status === "mentor_approved"
                      ? "bg-green-100 text-green-800"
                      : team.projectAbstract.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {team.projectAbstract.status.replace("_", " ").toUpperCase()}
                </span>
              )}
            </h4>
            <div className="space-y-4">
              {/* Project Track */}
              {team.projectAbstract.projectTrack && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h5 className="font-semibold text-purple-800 mb-2">
                    Project Track
                  </h5>
                  <span className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
                    {team.projectAbstract.projectTrack}
                  </span>
                </div>
              )}

              {/* Tools and Technologies */}
              {team.projectAbstract.tools &&
                team.projectAbstract.tools.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-3">
                      Tools & Technologies
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.projectAbstract.tools.map((tool, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border border-blue-100"
                        >
                          <div className="font-medium text-gray-800">
                            {tool.name}
                          </div>
                          {tool.version && (
                            <div className="text-sm text-gray-600">
                              Version: {tool.version}
                            </div>
                          )}
                          {tool.type && (
                            <div className="text-sm text-gray-600">
                              Type: {tool.type}
                            </div>
                          )}
                          {tool.purpose && (
                            <div className="text-sm text-gray-500 mt-1">
                              {tool.purpose}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Modules */}
              {team.projectAbstract.modules &&
                team.projectAbstract.modules.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-3">
                      Project Modules
                    </h5>
                    <div className="space-y-2">
                      {team.projectAbstract.modules.map((module, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border border-green-100"
                        >
                          <div className="font-medium text-gray-800">
                            {module.name}
                          </div>
                          {module.functionality && (
                            <div className="text-sm text-gray-600 mt-1">
                              {module.functionality}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Submission Info */}
              {team.projectAbstract.submittedAt && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Submitted:{" "}
                      {new Date(
                        team.projectAbstract.submittedAt
                      ).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      {team.projectAbstract.mentorApproval && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Mentor ✓
                        </span>
                      )}
                      {team.projectAbstract.adminApproval && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Admin ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role Specification */}
        {team.roleSpecification && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FaUsers className="mr-2 text-orange-600" />
              Role Specification
              {team.roleSpecification.status && (
                <span
                  className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${
                    team.roleSpecification.status === "submitted" ||
                    team.roleSpecification.status === "admin_approved" ||
                    team.roleSpecification.status === "mentor_approved"
                      ? "bg-green-100 text-green-800"
                      : team.roleSpecification.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {team.roleSpecification.status
                    .replace("_", " ")
                    .toUpperCase()}
                </span>
              )}
            </h4>

            {team.roleSpecification.assignments &&
            team.roleSpecification.assignments.length > 0 ? (
              <div className="space-y-4">
                {team.roleSpecification.assignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="bg-orange-50 p-4 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                        <span className="font-bold text-orange-800">
                          {(
                            assignment.member?.name || `Member ${index + 1}`
                          ).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-orange-800">
                          {assignment.member?.name || `Member ${index + 1}`}
                        </h5>
                        {assignment.modules &&
                          assignment.modules.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {assignment.modules.map((module, moduleIndex) => (
                                <span
                                  key={moduleIndex}
                                  className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded text-xs"
                                >
                                  {module}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Activities */}
                    {assignment.activities &&
                      assignment.activities.length > 0 && (
                        <div className="space-y-2">
                          <h6 className="font-medium text-gray-700 text-sm">
                            Activities:
                          </h6>
                          {assignment.activities.map((activity, actIndex) => (
                            <div
                              key={actIndex}
                              className="bg-white p-3 rounded-lg border border-orange-100"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">
                                    {activity.name}
                                  </div>
                                  {activity.details && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      {activity.details}
                                    </div>
                                  )}
                                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                    {activity.softDeadline && (
                                      <span>
                                        Soft:{" "}
                                        {new Date(
                                          activity.softDeadline
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {activity.hardDeadline && (
                                      <span>
                                        Hard:{" "}
                                        {new Date(
                                          activity.hardDeadline
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}

                {/* Submission Info */}
                {team.roleSpecification.submittedAt && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Submitted:{" "}
                        {new Date(
                          team.roleSpecification.submittedAt
                        ).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        {team.roleSpecification.mentorApproval && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Mentor ✓
                          </span>
                        )}
                        {team.roleSpecification.adminApproval && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Admin ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
                No role assignments specified
              </div>
            )}
          </div>
        )}

        {/* Weekly Status Matrix */}
        {team.evaluation?.weeklyStatus &&
          team.evaluation.weeklyStatus.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FaCheckCircle className="mr-2 text-indigo-600" />
                Weekly Status Matrix
              </h4>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg border border-indigo-200">
                    <thead className="bg-indigo-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Week
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Date Range
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Module
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Progress
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-800 border-b border-indigo-200">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.evaluation.weeklyStatus.map((week, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-indigo-25"
                          }
                        >
                          <td className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                            Week {week.week}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                            {week.dateRange?.from && week.dateRange?.to && (
                              <>
                                {new Date(
                                  week.dateRange.from
                                ).toLocaleDateString()}{" "}
                                -
                                {new Date(
                                  week.dateRange.to
                                ).toLocaleDateString()}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                            {week.module}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                            <div
                              className="max-w-xs truncate"
                              title={week.progress}
                            >
                              {week.progress}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm border-b border-gray-200">
                            {week.mentorScore !== undefined ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  week.mentorScore >= 8
                                    ? "bg-green-100 text-green-800"
                                    : week.mentorScore >= 6
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {week.mentorScore}/10
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Not scored
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                            {week.submittedAt &&
                              new Date(week.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Weekly Status Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600">Total Weeks</div>
                    <div className="font-semibold text-indigo-700">
                      {team.evaluation.weeklyStatus.length}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600">Average Score</div>
                    <div className="font-semibold text-indigo-700">
                      {team.evaluation.weeklyStatus.length > 0
                        ? (
                            team.evaluation.weeklyStatus
                              .filter((w) => w.mentorScore !== undefined)
                              .reduce((acc, w) => acc + w.mentorScore, 0) /
                            team.evaluation.weeklyStatus.filter(
                              (w) => w.mentorScore !== undefined
                            ).length
                          ).toFixed(1)
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600">
                      Latest Submission
                    </div>
                    <div className="font-semibold text-indigo-700">
                      {team.evaluation.weeklyStatus.length > 0
                        ? new Date(
                            Math.max(
                              ...team.evaluation.weeklyStatus.map(
                                (w) => new Date(w.submittedAt)
                              )
                            )
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {(team.status === "pending" || team.status === "rejected") && (
            <button
              onClick={() => {
                onClose();
                onOpenActionModal(team, "approveReject");
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <FaCheckCircle className="mr-2" /> Approve/Reject
            </button>
          )}
          {team.status === "approved" &&
            !team.mentor?.assigned &&
            team.mentor?.currentPreference === -1 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenActionModal(team, "allocateMentor");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPlusCircle className="mr-2" /> Allocate Mentor
              </button>
            )}
        </div>
      </div>
    </Modal>
  );
};

// Team Card Component - Simplified without expand/collapse
const TeamCard = ({ team, onOpenDetailsModal, onOpenActionModal }) => {
  const getStatusClass = (status) => {
    if (status === "approved")
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const leader = team.leader;
  const teamSize = (team.members?.length || 0) + 1; // +1 for leader

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 border border-gray-100 group">
      {/* Header with Team Code and Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Left: Team Code and Leader Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-700 transition-colors truncate">
            {team.code}
          </h2>
          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 font-medium truncate">
              <span className="text-teal-600 font-semibold">Leader:</span>{" "}
              {leader?.name || "N/A"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              Roll:{" "}
              {leader?.studentData?.rollNumber || leader?.username || "N/A"}
            </p>
          </div>
        </div>

        {/* Right: Status Badge */}
        <div className="shrink-0">
          <span
            className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusClass(
              team.status
            )} whitespace-nowrap`}
          >
            {team.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Team Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <strong className="text-gray-600">
                <pre>Dept: </pre>
              </strong>
              <span
                className="font-semibold text-gray-800 text-right truncate max-w-[140px]"
                title={
                  team.department || leader?.studentData?.department || "N/A"
                }
              >
                {team.department || leader?.studentData?.department || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <strong className="text-gray-600">Batch:</strong>
              <span
                className="font-semibold text-gray-800 text-right truncate max-w-[140px]"
                title={team.batch || leader?.studentData?.batch || "N/A"}
              >
                {team.batch || leader?.studentData?.batch || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUsers className="mr-2 text-teal-600" />
                <strong className="text-gray-600">Team Size:</strong>
              </div>
              <span className="font-bold text-teal-700">{teamSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaProjectDiagram className="mr-2 text-teal-600" />
                <strong className="text-gray-600">Project:</strong>
              </div>
              <span
                className="font-semibold text-gray-800 text-xs text-right max-w-[140px] truncate"
                title={
                  team.finalProject?.title ||
                  (team.projectChoices?.length > 0
                    ? `${team.projectChoices.length} choices`
                    : "Not chosen")
                }
              >
                {team.finalProject?.title ||
                  (team.projectChoices?.length > 0
                    ? `${team.projectChoices.length} choices`
                    : "Not chosen")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Status */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaChalkboardTeacher className="mr-3 text-blue-600" />
              <strong className="text-gray-700">Mentor Status:</strong>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-800 block">
                {team.mentor?.assigned?.name ||
                  (team.mentor?.preferences?.length > 0
                    ? `${team.mentor.preferences.length} preferences`
                    : "None")}
              </span>
              {team.mentor?.assigned ? (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Assigned
                </span>
              ) : team.mentor?.currentPreference === -1 ? (
                <span className="text-xs text-red-600 font-medium">
                  ⚠ Needs Allocation
                </span>
              ) : (
                <span className="text-xs text-blue-600 font-medium">
                  ⏳ In Progress
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onOpenDetailsModal(team)}
          className="flex-1 min-w-fit bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <FaInfoCircle className="mr-2" />
          View Details
        </button>
        {(team.status === "pending" || team.status === "rejected") && (
          <button
            onClick={() => onOpenActionModal(team, "approveReject")}
            className="flex-1 min-w-fit bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" /> Approve/Reject
          </button>
        )}
        {team.status === "approved" &&
          !team.mentor?.assigned &&
          team.mentor?.currentPreference === -1 && (
            <button
              onClick={() => onOpenActionModal(team, "allocateMentor")}
              className="flex-1 min-w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <FaPlusCircle className="mr-2" /> Allocate Mentor
            </button>
          )}
      </div>
    </div>
  );
};

// Action Modal for Team Actions
const ActionModal = ({
  isOpen,
  onClose,
  team,
  action,
  mentors,
  onRefresh,
  setShowActionModal,
}) => {
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset local state when modal opens for a different team/action
  useEffect(() => {
    setStatus("");
    setFeedback("");
    setSelectedMentor("");
    // Preselect existing final project if present
    setSelectedProject(team?.finalProject?._id || "");
  }, [team, action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === "approveReject") {
        if (status === "approved") {
          await axios.post(`/admin/approve/${team._id}`, {
            feedback,
          });
        } else if (status === "rejected") {
          await axios.post(`/admin/reject/${team._id}`, {
            feedback,
          });
        }
      } else if (action === "allocateMentor") {
        // Validate selections
        if (!selectedMentor) {
          throw new Error("Please select a mentor to allocate.");
        }

        // If team doesn't already have a final project, require one
        const finalProjectId = team?.finalProject?._id || selectedProject;
        // Require final project selection only if choices exist and none is already allocated/selected
        if (!finalProjectId && team?.projectChoices?.length > 0) {
          throw new Error(
            "Please select a final project from the team's choices."
          );
        }

        await axios.post(`/admin/allocate/${team._id}/${selectedMentor}`, {
          // Send only if present; backend treats it as optional
          ...(finalProjectId ? { finalProject: finalProjectId } : {}),
        });
      }

      alert(
        `Team ${
          action === "approveReject" ? status : "mentor allocation"
        } successful!`
      );
      onRefresh();
      setShowActionModal(null);
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(
        `Error ${action}: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        action === "approveReject"
          ? `Approve/Reject Team ${team?.code || ""}`
          : `Allocate Mentor to Team ${team?.code || ""}`
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {action === "approveReject" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select action</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
                placeholder="Provide feedback for the team..."
                required
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mentor
              </label>
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select a mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor._id} value={mentor._id}>
                    {mentor.name || mentor.username} - {mentor.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Final Project selection if not already allocated */}
            {!team?.finalProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Final Project (from team choices)
                </label>
                {team?.projectChoices?.length > 0 ? (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">Choose project</option>
                    {team.projectChoices.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.title} {proj.category ? `- ${proj.category}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                    This team has no project choices. Add choices before
                    allocating a final project.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [mentors, setMentors] = useState([]);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showActionModal, setShowActionModal] = useState(null);

  useEffect(() => {
    fetchTeams();
    fetchMentors();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/teams");
      setTeams(response.data.teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      alert(
        "Error fetching teams: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await axios.get("/admin/remaining-mentors");
      setMentors(response.data.mentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    }
  };

  // Get mentors filtered for a specific team (exclude mentors already in team preferences)
  const getFilteredMentorsForTeam = (team) => {
    if (!team) return mentors;
    const prefs = team.mentor?.preferences || [];
    // preferences could be populated Users or plain ids
    const prefIdSet = new Set(
      prefs.map((p) => {
        if (!p) return "";
        return typeof p === "string" ? p : p._id || "";
      })
    );
    return mentors.filter((m) => !prefIdSet.has(m._id));
  };

  const filteredTeams = teams.filter((team) => {
    const leader = team.leader;
    const matchesSearch =
      team.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader?.studentData?.rollNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      team.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.batch?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || team.status === statusFilter;

    const matchesMentor =
      mentorFilter === "all" ||
      (mentorFilter === "assigned" && team.mentor?.assigned) ||
      (mentorFilter === "unassigned" && !team.mentor?.assigned) ||
      (mentorFilter === "needsAllocation" &&
        team.mentor?.currentPreference === -1);

    const matchesProject =
      projectFilter === "all" ||
      (projectFilter === "allocated" && team.finalProject) ||
      (projectFilter === "unallocated" && !team.finalProject);

    return matchesSearch && matchesStatus && matchesMentor && matchesProject;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="bg-teal-600 p-3 rounded-lg mr-4">
                <FaUsers className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-1">
                  Manage Teams
                </h1>
                <p className="text-gray-600">
                  Oversee team formations, approvals, and mentor allocations
                </p>
              </div>
            </div>
            <div className="bg-teal-50 px-6 py-3 rounded-lg border border-teal-200">
              <p className="text-sm text-gray-600 mb-1">Total Teams</p>
              <p className="text-2xl font-bold text-teal-700">{teams.length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search teams, leaders, roll numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-all"
                  />
                  <FaUsers className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center ${
                  showFilters
                    ? "bg-teal-700 text-white"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                <FaFilter className="mr-2" />
                Filters {showFilters ? "▼" : "▶"}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Mentor Status
                    </label>
                    <select
                      value={mentorFilter}
                      onChange={(e) => setMentorFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-all"
                    >
                      <option value="all">All Mentors</option>
                      <option value="assigned">Assigned</option>
                      <option value="unassigned">Unassigned</option>
                      <option value="needsAllocation">Needs Allocation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Project Status
                    </label>
                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-all"
                    >
                      <option value="all">All Projects</option>
                      <option value="allocated">Allocated</option>
                      <option value="unallocated">Unallocated</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-teal-600">
                    {filteredTeams.length}
                  </span>{" "}
                  of <span className="font-semibold">{teams.length}</span> teams
                </p>
                {filteredTeams.length !== teams.length && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setMentorFilter("all");
                      setProjectFilter("all");
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FaUsers className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              No teams found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              {teams.length === 0
                ? "No teams have been created yet. Teams will appear here once students start forming teams."
                : "No teams match your current search and filter criteria. Try adjusting your filters or search terms."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                onOpenDetailsModal={(team) => setShowDetailsModal(team)}
                onOpenActionModal={(team, action) =>
                  setShowActionModal({ team, action })
                }
              />
            ))}
          </div>
        )}

        {/* Team Details Modal */}
        <TeamDetailsModal
          isOpen={!!showDetailsModal}
          onClose={() => setShowDetailsModal(null)}
          team={showDetailsModal}
          onOpenActionModal={(team, action) => {
            setShowDetailsModal(null);
            setShowActionModal({ team, action });
          }}
        />

        {/* Action Modal */}
        <ActionModal
          isOpen={!!showActionModal}
          onClose={() => setShowActionModal(null)}
          team={showActionModal?.team}
          action={showActionModal?.action}
          mentors={getFilteredMentorsForTeam(showActionModal?.team)}
          onRefresh={fetchTeams}
          setShowActionModal={setShowActionModal}
        />
      </div>
    </div>
  );
}
