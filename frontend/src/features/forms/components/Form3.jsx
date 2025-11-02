import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSave,
  FaUndo,
  FaChartLine,
  FaClock,
  FaLightbulb,
  FaExclamationCircle,
  FaCommentDots,
} from "react-icons/fa";
import axios from "../../../services/axios";

const WeeklyStatusMatrix = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [existingData, setExistingData] = useState(null); // Current week submission only
  const [allSubmissions, setAllSubmissions] = useState([]); // All previous submissions
  const [availableModules, setAvailableModules] = useState([]);
  const [currentWeekInfo, setCurrentWeekInfo] = useState(null);
  const [hasTimeline, setHasTimeline] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [zipFileName, setZipFileName] = useState("");

  const initialFormState = {
    week: 1,
    dateRange: {
      from: "",
      to: "",
    },
    module: "",
    progress: "",
    achievements: [""],
    challenges: [""],
    studentRemarks: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Check if form should be editable (only when no submission exists for current week)
  const isEditable = !existingData || existingData.status === "rejected";

  // Determine if current week has submission
  // const hasCurrentWeekSubmission = Boolean(existingData);

  // Load existing data and available modules
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStatus(true);

        // First, check if team has project timeline assigned
        try {
          const currentWeekResponse = await axios.get("/team/current-week");
          const weekInfo = currentWeekResponse.data;

          if (weekInfo.hasTimeline) {
            setHasTimeline(true);
            setCurrentWeekInfo(weekInfo);

            // Set form data with current week info
            setFormData({
              week: weekInfo.currentWeek,
              dateRange: {
                from: new Date(weekInfo.dateRange.from)
                  .toISOString()
                  .slice(0, 10),
                to: new Date(weekInfo.dateRange.to).toISOString().slice(0, 10),
              },
              module: "",
              progress: "",
              achievements: [""],
              challenges: [""],
              studentRemarks: "",
            });
          } else {
            setHasTimeline(false);
            setMessage({
              type: "error",
              text:
                weekInfo.message ||
                "Project timeline not assigned yet. Please contact admin.",
            });
            setLoadingStatus(false);
            return;
          }
        } catch (error) {
          if (error.response?.status === 403) {
            setHasTimeline(false);
            setMessage({
              type: "error",
              text:
                error.response.data.message ||
                "Weekly status access denied. Project timeline not assigned yet.",
            });
            setLoadingStatus(false);
            return;
          }
          throw error;
        }

        // Get team data to fetch available modules
        const teamResponse = await axios.get("/team/my-team");
        const team = teamResponse.data?.team;

        // Extract all modules from role specification
        let allModules = [];
        if (team?.roleSpecification?.assignments) {
          team.roleSpecification.assignments.forEach((assignment) => {
            if (assignment.modules) {
              allModules.push(...assignment.modules);
            }
          });
          // Remove duplicates
          allModules = [...new Set(allModules)];
        }

        // Get existing weekly status data
        try {
          const statusResponse = await axios.get("/team/weekly-status");
          if (statusResponse.data.weeklyStatus) {
            // Store all submissions for display
            setAllSubmissions(statusResponse.data.weeklyStatus);

            // Get modules that have been submitted for the CURRENT week only
            // Since backend now allows multiple submissions per week (but not same week+module combo)
            const currentWeekSubmissions =
              statusResponse.data.weeklyStatus.filter(
                (s) => s.week === currentWeekInfo.currentWeek
              );

            const currentWeekModules = currentWeekSubmissions.map(
              (s) => s.module
            );

            // Filter out modules already submitted for current week
            const availableModulesFiltered = allModules.filter(
              (module) => !currentWeekModules.includes(module)
            );

            setAvailableModules(availableModulesFiltered);

            // If there's a submission for current week, find the most recent one to display
            if (currentWeekSubmissions.length > 0) {
              // Sort by submission date and get the most recent
              const mostRecentSubmission = currentWeekSubmissions.sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
              )[0];

              setFormData({
                week: mostRecentSubmission.week,
                dateRange: {
                  from: new Date(mostRecentSubmission.dateRange.from)
                    .toISOString()
                    .slice(0, 10),
                  to: new Date(mostRecentSubmission.dateRange.to)
                    .toISOString()
                    .slice(0, 10),
                },
                module: mostRecentSubmission.module || "",
                progress: mostRecentSubmission.progress || "",
                achievements:
                  mostRecentSubmission.achievements?.length > 0
                    ? mostRecentSubmission.achievements
                    : [""],
                challenges:
                  mostRecentSubmission.challenges?.length > 0
                    ? mostRecentSubmission.challenges
                    : [""],
                studentRemarks: mostRecentSubmission.studentRemarks || "",
              });
              setExistingData(mostRecentSubmission);

              // Show approval message if mentor approved
              if (mostRecentSubmission.status === "mentor_approved") {
                showMessage(
                  "success",
                  `Week ${mostRecentSubmission.week} status has been approved by your mentor!`
                );
              }
            }
          } else {
            // No submissions yet, show all modules
            setAvailableModules(allModules);
          }
        } catch (error) {
          // No existing data, start fresh - show all modules
          if (error.response?.status !== 404) {
            console.error("Error loading weekly status:", error);
          }
          setAvailableModules(allModules);
        }
      } catch (error) {
        console.error("Error loading team data:", error);
        setMessage({
          type: "error",
          text: "Failed to load team data. Please try again.",
        });
      } finally {
        setLoadingStatus(false);
      }
    };

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (arrayName, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const addArrayItem = (arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""],
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    if (formData[arrayName].length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleZipFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setZipFile(null);
      setZipFileName("");
      return;
    }

    // Validate file type
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const isZip =
      fileExtension === "zip" ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    if (!isZip) {
      showMessage(
        "error",
        "Only ZIP files are allowed. Please upload a .zip file."
      );
      e.target.value = ""; // Clear the input
      setZipFile(null);
      setZipFileName("");
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showMessage("error", "File size must be less than 50MB");
      e.target.value = "";
      setZipFile(null);
      setZipFileName("");
      return;
    }

    setZipFile(file);
    setZipFileName(file.name);
  };

  const validateForm = () => {
    if (!formData.module.trim()) {
      showMessage("error", "Please select a module");
      return false;
    }

    if (!formData.progress.trim()) {
      showMessage("error", "Please describe your progress");
      return false;
    }

    const validAchievements = formData.achievements.filter((a) => a.trim());
    if (validAchievements.length === 0) {
      showMessage("error", "Please add at least one achievement");
      return false;
    }

    const validChallenges = formData.challenges.filter((c) => c.trim());
    if (validChallenges.length === 0) {
      showMessage("error", "Please add at least one challenge");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append("week", formData.week);
      submitData.append("dateRange", JSON.stringify(formData.dateRange));
      submitData.append("module", formData.module);
      submitData.append("progress", formData.progress.trim());
      submitData.append(
        "achievements",
        JSON.stringify(formData.achievements.filter((a) => a.trim()))
      );
      submitData.append(
        "challenges",
        JSON.stringify(formData.challenges.filter((c) => c.trim()))
      );
      submitData.append("studentRemarks", formData.studentRemarks.trim());

      // Append zip file if present
      if (zipFile) {
        submitData.append("projectFile", zipFile);
      }

      let response;
      // If there is an existing submission that was rejected, update it (allow resubmit)
      if (existingData && existingData.status === "rejected") {
        response = await axios.put(
          `/team/weekly-status/${formData.week}`,
          submitData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post("/team/weekly-status", submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      showMessage(
        "success",
        response.data.message || "Weekly status submitted successfully!"
      );

      // Reload the page data to reflect the new submission
      window.location.reload();
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit weekly status. Please try again.";
      showMessage("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ...initialFormState,
      week: currentWeekInfo?.currentWeek || 1,
      dateRange: currentWeekInfo?.dateRange
        ? {
          from: new Date(currentWeekInfo.dateRange.from)
            .toISOString()
            .slice(0, 10),
          to: new Date(currentWeekInfo.dateRange.to)
            .toISOString()
            .slice(0, 10),
        }
        : { from: "", to: "" },
    });
    setZipFile(null);
    setZipFileName("");
    setMessage({ type: "", text: "" });
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-teal-600 mb-4" />
          <p className="text-gray-600">Loading weekly status matrix...</p>
        </div>
      </div>
    );
  }

  // Check if team has timeline access
  if (!hasTimeline) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-teal-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <FaClock className="mx-auto text-6xl text-orange-500 mb-6" />
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Project Timeline Not Assigned
              </h1>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Your team&apos;s project timeline has not been assigned yet.
                Weekly status submissions will be available once the admin sets
                the project start date.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Requirements for Timeline Assignment:
                </h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>✓ Team must be approved by admin</li>
                  <li>✓ Mentor must be assigned to the team</li>
                  <li>• Admin must set the project start date</li>
                </ul>
              </div>
              {message.text && (
                <div
                  className={`p-4 rounded-lg border ${message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                    }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-teal-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-none mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg border-b border-gray-200 p-6 sm:p-8 md:p-10">
          <div className="text-center mx-auto max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Weekly Status Matrix
            </h1>
            <h2 className="text-base sm:text-lg font-medium text-gray-700">
              PROJECT EVALUATION & PROGRESS TRACKING (2024-25)
            </h2>
            <div className="mt-4 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                <FaCalendarAlt className="text-teal-600" />
                <span className="text-teal-800 font-medium">
                  Current Week: {currentWeekInfo?.currentWeek || 1} of{" "}
                  {currentWeekInfo?.projectDuration || 12}
                </span>
              </div>

              {currentWeekInfo && (
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaClock className="text-blue-500" />
                    <span>
                      Started:{" "}
                      {new Date(
                        currentWeekInfo.projectStartDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaChartLine className="text-green-500" />
                    <span>
                      Progress: {currentWeekInfo.timelineProgress || 0}%
                    </span>
                  </div>
                  {currentWeekInfo.isAutoAssigned && (
                    <div className="flex items-center gap-1">
                      <FaLightbulb className="text-yellow-500" />
                      <span>Auto-assigned</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Status Info Box */}
        {existingData && (
          <div className="mt-4 px-6 sm:px-8 md:px-10">
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Current Week Submission Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{" "}
                  <span
                    className={`font-semibold ${existingData.status === "mentor_approved"
                      ? "text-green-600"
                      : existingData.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                      }`}
                  >
                    {existingData.status === "mentor_approved"
                      ? "✓ Approved"
                      : existingData.status === "rejected"
                        ? "✗ Rejected"
                        : "⏳ Pending Review"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Submitted At:
                  </span>{" "}
                  {new Date(existingData.submittedAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Module:</span>{" "}
                  {existingData.module}
                </div>
                {/* Mentor score intentionally not shown on this page; visible only on View Score page */}
              </div>
              {!isEditable && (
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> This submission cannot be edited.
                    {existingData.status === "mentor_approved"
                      ? " It has been approved by your mentor."
                      : " It is currently under review by your mentor."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message.text && (
          <div className="mt-4 mb-4 w-full px-6 sm:px-8 md:px-10">
            <div
              className={`p-4 sm:p-5 rounded-lg border flex items-start gap-2 ${message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
                }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="mt-0.5 shrink-0" />
              ) : (
                <FaExclamationTriangle className="mt-0.5 shrink-0" />
              )}
              <span className="text-sm sm:text-base">{message.text}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-8">
          <div className="space-y-8">
            {/* Current Submission Status Banner */}
            {existingData && (
              <div
                className={`rounded-lg p-4 border-2 ${existingData.status === "mentor_approved"
                  ? "bg-green-50 border-green-300"
                  : existingData.status === "rejected"
                    ? "bg-red-50 border-red-300"
                    : "bg-yellow-50 border-yellow-300"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {existingData.status === "mentor_approved" ? (
                    <FaCheckCircle className="text-green-600 text-xl mt-0.5 shrink-0" />
                  ) : existingData.status === "rejected" ? (
                    <FaExclamationTriangle className="text-red-600 text-xl mt-0.5 shrink-0" />
                  ) : (
                    <FaClock className="text-yellow-600 text-xl mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-lg mb-1 ${existingData.status === "mentor_approved"
                        ? "text-green-800"
                        : existingData.status === "rejected"
                          ? "text-red-800"
                          : "text-yellow-800"
                        }`}
                    >
                      {existingData.status === "mentor_approved"
                        ? "✓ Week Approved"
                        : existingData.status === "rejected"
                          ? "Needs Resubmission"
                          : "Pending Mentor Review"}
                    </h3>
                    <p
                      className={`text-sm ${existingData.status === "mentor_approved"
                        ? "text-green-700"
                        : existingData.status === "rejected"
                          ? "text-red-700"
                          : "text-yellow-700"
                        }`}
                    >
                      {existingData.status === "mentor_approved"
                        ? `Your Week ${existingData.week
                        } submission has been approved by your mentor.${existingData.mentorScore
                          ? ` Score: ${existingData.mentorScore}/10`
                          : ""
                        }`
                        : existingData.status === "rejected"
                          ? `Your Week ${existingData.week} submission was rejected. Please review the feedback and resubmit.`
                          : `Your Week ${existingData.week} submission is awaiting mentor review.`}
                    </p>
                    {existingData.mentorComments && (
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          Mentor Feedback:
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {existingData.mentorComments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Week Information */}
            <div className="bg-linear-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Week Number
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <FaClock className="text-teal-600" />
                    <span className="font-semibold text-lg">
                      {formData.week}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Range (From)
                  </label>
                  <input
                    type="date"
                    value={formData.dateRange.from}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Range (To)
                  </label>
                  <input
                    type="date"
                    value={formData.dateRange.to}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Module Selection */}
            <div className="bg-gray-50 rounded-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FaChartLine className="inline mr-2" />
                Module <span className="text-red-500">*</span>
              </label>
              <select
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                disabled={!isEditable}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select module to report on</option>
                {availableModules.map((module, index) => (
                  <option key={index} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              {availableModules.length > 0 &&
                allSubmissions.some(
                  (s) => s.week === currentWeekInfo?.currentWeek
                ) && (
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Note: Modules already submitted for Week{" "}
                    {currentWeekInfo?.currentWeek} are not shown. You can submit
                    multiple modules per week.
                  </p>
                )}
              {availableModules.length === 0 && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <FaCheckCircle className="text-blue-600" />
                    All modules have been submitted for Week{" "}
                    {currentWeekInfo?.currentWeek}. Great work!
                  </p>
                </div>
              )}
            </div>

            {/* Progress Description */}
            <div className="bg-gray-50 rounded-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FaChartLine className="inline mr-2" />
                Progress Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="progress"
                value={formData.progress}
                onChange={handleInputChange}
                disabled={!isEditable}
                placeholder="Describe the progress made this week on the selected module..."
                required
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-600">
                Provide detailed information about what was accomplished,
                completed features, milestones reached, etc.
              </p>
            </div>

            {/* Achievements */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  <FaLightbulb className="inline mr-2" />
                  Achievements <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => addArrayItem("achievements")}
                  disabled={!isEditable}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FaPlus className="w-3 h-3" />
                  Add Achievement
                </button>
              </div>

              <div className="space-y-3">
                {formData.achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder={`Achievement ${index + 1}`}
                      value={achievement}
                      onChange={(e) =>
                        handleArrayChange("achievements", index, e.target.value)
                      }
                      disabled={!isEditable}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {formData.achievements.length > 1 && isEditable && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("achievements", index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                        title="Remove achievement"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  <FaExclamationCircle className="inline mr-2" />
                  Challenges <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => addArrayItem("challenges")}
                  disabled={!isEditable}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FaPlus className="w-3 h-3" />
                  Add Challenge
                </button>
              </div>

              <div className="space-y-3">
                {formData.challenges.map((challenge, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder={`Challenge ${index + 1}`}
                      value={challenge}
                      onChange={(e) =>
                        handleArrayChange("challenges", index, e.target.value)
                      }
                      disabled={!isEditable}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {formData.challenges.length > 1 && isEditable && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("challenges", index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                        title="Remove challenge"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Student Remarks */}
            <div className="bg-gray-50 rounded-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FaCommentDots className="inline mr-2" />
                Student Remarks
              </label>
              <textarea
                name="studentRemarks"
                value={formData.studentRemarks}
                onChange={handleInputChange}
                disabled={!isEditable}
                placeholder="Any additional comments, observations, or notes about this week's work..."
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-600">
                Optional: Share any additional thoughts, learnings, or plans for
                next week.
              </p>
            </div>

            {/* Project File Upload (ZIP) */}
            <div className="bg-linear-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border-2 border-teal-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FaPlus className="inline mr-2" />
                Project File Upload (Optional)
              </label>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipFileChange}
                  disabled={!isEditable}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {zipFileName && (
                  <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-100 px-3 py-2 rounded-lg">
                    <FaCheckCircle className="text-teal-600" />
                    <span className="font-medium">{zipFileName}</span>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Upload your project files as a ZIP archive (max 50MB). Only
                  .zip files are accepted.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
              {!isEditable ? (
                <div className="text-center py-2">
                  <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                    {existingData?.status === "mentor_approved" ? (
                      <>
                        <FaCheckCircle className="text-green-600" />
                        This week&apos;s submission has been approved. No
                        further action needed.
                      </>
                    ) : existingData?.status === "submitted" ? (
                      <>
                        <FaClock className="text-yellow-600" />
                        This week&apos;s submission is pending mentor review.
                        You cannot edit it now.
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !isEditable}
                    className="px-8 py-3 bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Submit Week {formData.week} Status
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
            </div>

            {/* All Weekly Submissions */}
            {allSubmissions.length > 0 && (
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  All Weekly Submissions ({allSubmissions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allSubmissions
                    .sort((a, b) => a.week - b.week)
                    .map((submission, index) => (
                      <div
                        key={submission._id || index}
                        className={`bg-white rounded-lg p-4 border-2 shadow-sm ${submission.status === "mentor_approved"
                          ? "border-green-300 bg-green-50"
                          : submission.status === "submitted"
                            ? "border-yellow-300 bg-yellow-50"
                            : "border-gray-200"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800 flex items-center gap-2">
                            Week {submission.week}
                            {submission.status === "mentor_approved" && (
                              <FaCheckCircle className="text-green-600 text-sm" />
                            )}
                            {submission.status === "submitted" && (
                              <FaClock className="text-yellow-600 text-sm" />
                            )}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(
                              submission.submittedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Module:</strong> {submission.module}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`font-semibold ${submission.status === "mentor_approved"
                                ? "text-green-600"
                                : submission.status === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                                }`}
                            >
                              {submission.status === "mentor_approved"
                                ? "Approved"
                                : submission.status === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                            </span>
                          </p>
                          {/* Score hidden on Weekly Status page — view scores on the View Score page */}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStatusMatrix;
