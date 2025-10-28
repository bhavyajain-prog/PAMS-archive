import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaUndo,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGithub,
  FaInfoCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import axios from "../../../services/axios";

const ProjectAbstractForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [existingData, setExistingData] = useState(null);

  const initialFormState = {
    projectTrack: "",
    githubRepo: "",
    tools: [{ name: "", version: "", type: "", purpose: "" }],
    modules: [{ name: "", functionality: "", description: "" }],
  };

  const [formData, setFormData] = useState(initialFormState);

  const projectTracks = [
    "R&D",
    "Consultancy",
    "Startup",
    "Project Pool",
    "Hardware",
  ];

  // Load existing project abstract data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoadingStatus(true);
        const response = await axios.get("/team/project-abstract/status");
        if (response.data.projectAbstract) {
          const data = response.data.projectAbstract;
          setExistingData(data);
          setFormData({
            projectTrack: data.projectTrack || "",
            githubRepo: data.githubRepo || "",
            tools:
              data.tools && data.tools.length > 0
                ? data.tools
                : [{ name: "", version: "", type: "", purpose: "" }],
            modules:
              data.modules && data.modules.length > 0
                ? data.modules.map((m) => ({
                  name: m?.name || "",
                  functionality: m?.functionality || "",
                  description: m?.description || "",
                }))
                : [{ name: "", functionality: "", description: "" }],
          });
        }
      } catch (error) {
        console.error("Error loading project abstract:", error);
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

    loadExistingData();
  }, []);

  // Check if form should be editable
  const isEditable =
    !existingData ||
    existingData.status === "draft" ||
    existingData.status === "rejected" ||
    !existingData.status;

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToolChange = (index, field, value) => {
    const newTools = [...formData.tools];
    newTools[index][field] = value;
    setFormData((prev) => ({ ...prev, tools: newTools }));
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...formData.modules];
    newModules[index][field] = value;
    setFormData((prev) => ({ ...prev, modules: newModules }));
  };

  const addTool = () => {
    setFormData((prev) => ({
      ...prev,
      tools: [...prev.tools, { name: "", version: "", type: "", purpose: "" }],
    }));
  };

  const removeTool = (index) => {
    if (formData.tools.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };

  const addModule = () => {
    setFormData((prev) => ({
      ...prev,
      modules: [...prev.modules, { name: "", functionality: "", description: "" }],
    }));
  };

  const removeModule = (index) => {
    if (formData.modules.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.projectTrack.trim()) {
      showMessage("error", "Please select a project track");
      return false;
    }

    if (!formData.githubRepo.trim()) {
      showMessage("error", "Please provide a GitHub repository link");
      return false;
    }

    // Basic GitHub URL validation
    const githubUrlPattern =
      /^https?:\/\/(www\.)?github\.com\/[\w-.]+\/[\w-.]+\/?$/;
    if (!githubUrlPattern.test(formData.githubRepo.trim())) {
      showMessage(
        "error",
        "Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository)"
      );
      return false;
    }

    const validTools = formData.tools.filter((tool) => tool.name.trim());
    if (validTools.length === 0) {
      showMessage("error", "Please add at least one tool with a name");
      return false;
    }

    const validModules = formData.modules.filter((module) =>
      module.name.trim()
    );
    if (validModules.length === 0) {
      showMessage("error", "Please add at least one module with a name");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Filter out empty tools and modules
      const submitData = {
        projectTrack: formData.projectTrack,
        githubRepo: formData.githubRepo.trim(),
        tools: formData.tools.filter((tool) => tool.name.trim()),
        modules: formData.modules.filter((module) => module.name.trim()),
      };

      // Debug: Log what we're sending
      console.log("Submitting modules:", JSON.stringify(submitData.modules, null, 2));

      const response = await axios.put("/team/project-abstract", submitData);

      showMessage(
        "success",
        response.data.message || "Project abstract submitted successfully!"
      );
      setExistingData(response.data.projectAbstract);
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit project abstract. Please try again.";
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
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-teal-600 mb-4" />
          <p className="text-gray-600">Loading project abstract form...</p>
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
              Project Abstract Submission
            </h1>
            <h2 className="text-base sm:text-lg font-medium text-gray-700">
              MAJOR / MINOR PROJECT ABSTRACT (2024-25)
            </h2>
            {existingData && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border rounded-md">
                <FaCheckCircle
                  className={`${existingData.status === "submitted"
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
                  className={`font-medium text-sm ${existingData.status === "submitted"
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
            {/* Project Track */}
            <div className="bg-gray-50 rounded-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Project Track <span className="text-red-500">*</span>
              </label>
              <select
                name="projectTrack"
                value={formData.projectTrack}
                onChange={handleInputChange}
                disabled={!isEditable}
                required
                className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none transition-all ${isEditable
                    ? "focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    : "bg-gray-100 cursor-not-allowed"
                  }`}
              >
                <option value="">Select project track</option>
                {projectTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>

            {/* GitHub Repository Section */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-full">
                  <FaGithub className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    GitHub Repository
                  </h3>
                  <p className="text-sm text-gray-600">
                    Link your project repository for code management
                  </p>
                </div>
              </div>

              {/* GitHub Setup Guide */}
              <div className="bg-white rounded-lg p-5 mb-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <FaInfoCircle className="text-blue-600 text-lg" />
                  <h4 className="font-semibold text-gray-800">
                    How to Set Up Your GitHub Repository
                  </h4>
                </div>

                <div className="space-y-4 text-sm text-gray-700">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 mb-2">
                      ⚠️ Important Notes:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Your repository URL should look like:{" "}
                        <code className="bg-gray-200 px-1 rounded">
                          https://github.com/username/repository-name
                        </code>
                      </li>
                      <li>
                        Make sure your repository is accessible (public or
                        shared with mentors)
                      </li>
                      <li>
                        Keep your repository updated throughout the project
                        development
                      </li>
                      <li>
                        Do not include sensitive information like API keys or
                        passwords
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* GitHub Repository URL Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FaGithub className="inline mr-2" />
                  GitHub Repository URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="githubRepo"
                  value={formData.githubRepo}
                  onChange={handleInputChange}
                  disabled={!isEditable}
                  placeholder="https://github.com/username/repository-name"
                  required
                  className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none transition-all ${isEditable
                      ? "focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      : "bg-gray-100 cursor-not-allowed"
                    }`}
                />
                <p className="mt-2 text-xs text-gray-600">
                  Paste the full URL of your GitHub repository (e.g.,
                  https://github.com/username/project-name)
                </p>
                {formData.githubRepo && (
                  <div className="mt-2">
                    <a
                      href={formData.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      View Repository
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Tools Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Tools / Technologies <span className="text-red-500">*</span>
                </label>
                {isEditable && (
                  <button
                    type="button"
                    onClick={addTool}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add Tool
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {formData.tools.map((tool, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., React, MongoDB"
                        value={tool.name}
                        onChange={(e) =>
                          handleToolChange(index, "name", e.target.value)
                        }
                        disabled={!isEditable}
                        required
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                            ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            : "bg-gray-100 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Version
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 18.2.0"
                        value={tool.version}
                        onChange={(e) =>
                          handleToolChange(index, "version", e.target.value)
                        }
                        disabled={!isEditable}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                            ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            : "bg-gray-100 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Framework, Database"
                        value={tool.type}
                        onChange={(e) =>
                          handleToolChange(index, "type", e.target.value)
                        }
                        disabled={!isEditable}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                            ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            : "bg-gray-100 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Purpose
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Frontend development"
                          value={tool.purpose}
                          onChange={(e) =>
                            handleToolChange(index, "purpose", e.target.value)
                          }
                          disabled={!isEditable}
                          className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                              ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              : "bg-gray-100 cursor-not-allowed"
                            }`}
                        />
                        {formData.tools.length > 1 && isEditable && (
                          <button
                            type="button"
                            onClick={() => removeTool(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Remove tool"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Modules <span className="text-red-500">*</span>
                </label>
                {isEditable && (
                  <button
                    type="button"
                    onClick={addModule}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add Module
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {formData.modules.map((module, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Module Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., User Authentication"
                        value={module.name}
                        onChange={(e) =>
                          handleModuleChange(index, "name", e.target.value)
                        }
                        disabled={!isEditable}
                        required
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                            ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            : "bg-gray-100 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Functionality
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Login, Registration, Session Management"
                          value={module.functionality}
                          onChange={(e) =>
                            handleModuleChange(
                              index,
                              "functionality",
                              e.target.value
                            )
                          }
                          disabled={!isEditable}
                          className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
                              ? "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              : "bg-gray-100 cursor-not-allowed"
                            }`}
                        />
                        {formData.modules.length > 1 && isEditable && (
                          <button
                            type="button"
                            onClick={() => removeModule(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Remove module"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Optional Description for the module */}
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                          Description <span className="text-xs text-gray-500">(optional)</span>
                        </label>
                        <textarea
                          placeholder="Optional: Describe the module in more detail (responsibilities, constraints, dependencies)"
                          value={module.description || ""}
                          onChange={(e) =>
                            handleModuleChange(index, "description", e.target.value)
                          }
                          disabled={!isEditable}
                          rows={3}
                          className={`w-full border border-gray-300 rounded-lg px-3 py-2 transition-all ${isEditable
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
              {isEditable && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
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
                      {existingData ? "Update Abstract" : "Submit Abstract"}
                    </>
                  )}
                </button>
              )}
              {isEditable && (
                <button
                  onClick={handleReset}
                  disabled={submitting}
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaUndo />
                  Reset Form
                </button>
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

export default ProjectAbstractForm;
