import { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaInfoCircle,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaUserShield,
  FaUserGraduate,
  FaUsers,
  FaClock,
  FaPlay,
} from "react-icons/fa";

// Timeline Management Component
const TimelineManagement = ({ onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [eligibleTeams, setEligibleTeams] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [formData, setFormData] = useState({
    globalStartDate: "",
    autoAssignEnabled: false,
    defaultProjectDuration: 12,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/team/admin/timeline-settings");
      setSettings(response.data.globalSettings);

      if (response.data.globalSettings.globalStartDate) {
        setFormData({
          globalStartDate: new Date(
            response.data.globalSettings.globalStartDate
          )
            .toISOString()
            .slice(0, 10),
          autoAssignEnabled: response.data.globalSettings.autoAssignEnabled,
          defaultProjectDuration:
            response.data.globalSettings.defaultProjectDuration || 12,
        });
      }
    } catch (error) {
      console.error("Error fetching timeline settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEligibleTeams = useCallback(async () => {
    try {
      const response = await axios.get("/team/admin/eligible-teams");
      setEligibleTeams(response.data.eligibleTeams);
    } catch (error) {
      console.error("Error fetching eligible teams:", error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchEligibleTeams();
  }, [fetchSettings, fetchEligibleTeams]);

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        "/team/admin/timeline-settings",
        formData
      );

      setMessage({
        type: "success",
        text: `Timeline settings updated successfully. ${response.data.autoAssignResults?.length || 0
          } teams auto-assigned.`,
      });

      await fetchSettings();
      await fetchEligibleTeams();
      if (onRefresh) onRefresh();

      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Failed to update timeline settings",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamTimelineAction = async (teamId, action, startDate = null) => {
    try {
      setLoading(true);

      if (action === "assign") {
        await axios.post(`/team/admin/assign-timeline/${teamId}`, {
          startDate: startDate || formData.globalStartDate,
          duration: formData.defaultProjectDuration,
        });
        setMessage({ type: "success", text: "Timeline assigned successfully" });
      } else if (action === "remove") {
        await axios.delete(`/team/admin/remove-timeline/${teamId}`);
        setMessage({ type: "success", text: "Timeline removed successfully" });
      }

      await fetchEligibleTeams();
      if (onRefresh) onRefresh();

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || `Failed to ${action} timeline`,
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaClock className="text-blue-600" />
          Project Timeline Management
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {showSettings ? <FaChevronUp /> : <FaChevronDown />}
          Settings
        </button>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg mb-4 ${message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
            }`}
        >
          {message.text}
        </div>
      )}

      {showSettings && (
        <div className="border rounded-lg p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Global Timeline Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Global Start Date
              </label>
              <input
                type="date"
                value={formData.globalStartDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    globalStartDate: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (weeks)
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={formData.defaultProjectDuration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultProjectDuration: parseInt(e.target.value) || 12,
                  }))
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoAssignEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      autoAssignEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto-assign to eligible teams
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleUpdateSettings}
              disabled={loading || !formData.globalStartDate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaPlay />}
              Update Settings
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2 text-green-700">
            Current Settings
          </h3>
          {settings ? (
            <div className="space-y-2 text-sm">
              <div>
                Global Start Date:{" "}
                {settings.globalStartDate
                  ? new Date(settings.globalStartDate).toLocaleDateString()
                  : "Not set"}
              </div>
              <div>
                Auto-assign:{" "}
                {settings.autoAssignEnabled ? "Enabled" : "Disabled"}
              </div>
              <div>
                Default Duration: {settings.defaultProjectDuration || 12} weeks
              </div>
              <div>
                Last Updated:{" "}
                {settings.enabledAt
                  ? new Date(settings.enabledAt).toLocaleDateString()
                  : "Never"}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading settings...</div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-blue-700">
            Eligible Teams ({eligibleTeams.length})
          </h3>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {eligibleTeams.length > 0 ? (
              eligibleTeams.map((team) => (
                <div
                  key={team._id}
                  className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm"
                >
                  <span>
                    {team.code} - {team.leader?.name}
                  </span>
                  <button
                    onClick={() => handleTeamTimelineAction(team._id, "assign")}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Assign
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No eligible teams</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusClass = (isApproved, rejectedAt) => {
    if (isApproved) return "bg-green-100 text-green-700";
    if (rejectedAt) return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getProposerIcon = (role) => {
    if (role === "admin")
      return (
        <FaUserShield className="inline mr-1 text-blue-600" title="Admin" />
      );
    return (
      <FaUserGraduate
        className="inline mr-1 text-purple-600"
        title="Mentor/Student"
      />
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 ease-in-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-teal-700">{project.title}</h2>
          <p className="text-sm text-gray-600">Category: {project.category}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(
            project.isApproved,
            project.rejectedAt
          )} mt-2 sm:mt-0`}
        >
          {project.isApproved
            ? "Approved"
            : project.rejectedAt
              ? "Rejected"
              : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
        <p>
          {getProposerIcon(project.proposedBy?.role)}
          Proposed by: {project.proposedBy?.name || "N/A"}
        </p>
        <p>
          <FaUsers className="inline mr-2 text-teal-600" />
          Assigned Teams: {project.assignedTeams?.length || 0} /{" "}
          {project.maxTeams}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md flex items-center transition-colors"
        >
          {isExpanded ? (
            <FaChevronUp className="mr-2" />
          ) : (
            <FaChevronDown className="mr-2" />
          )}
          Details
        </button>
        {!project.rejectedAt && (
          <button
            onClick={() => onAction("edit", project)}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
        )}
        {!project.isApproved && !project.rejectedAt && (
          <>
            <button
              onClick={() => onAction("approve", project)}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FaCheckCircle className="mr-2" /> Approve
            </button>
            <button
              onClick={() => onAction("reject", project)}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FaTimesCircle className="mr-2" /> Reject
            </button>
            <button
              onClick={() => onAction("schedule", project)}
              className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FaCalendarAlt className="mr-2" /> Schedule Discussion
            </button>
          </>
        )}
        {!project.rejectedAt &&
          project.assignedTeams?.length < project.maxTeams && (
            <button
              onClick={() => onAction("delete", project)}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FaTrash className="mr-2" /> Delete
            </button>
          )}
      </div>
      {project.rejectedAt && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <span className="text-sm text-red-700 font-semibold">
            ✗ This project has been rejected and operations are disabled
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-2">
          <h4 className="text-md font-semibold text-gray-800 mb-2">
            Full Details:
          </h4>
          <p>
            <strong>Description:</strong> {project.description}
          </p>
          <p>
            <strong>Project ID:</strong> {project._id}
          </p>
          {project.approvedBy && (
            <p>
              <strong>Approved by:</strong> {project.approvedBy.name}
            </p>
          )}
          {project.rejectedAt && (
            <p>
              <strong>Rejected on:</strong>{" "}
              {new Date(project.rejectedAt).toLocaleDateString()}
            </p>
          )}
          <div>
            <strong>Feedback History:</strong>
            {project.feedback?.length > 0 ? (
              <ul className="list-none ml-4 mt-2 space-y-2">
                {project.feedback.map((fb, index) => (
                  <li
                    key={index}
                    className="p-2 border-l-2 border-gray-200 bg-gray-50 rounded-r-md"
                  >
                    <p>&quot;{fb.message}&quot;</p>
                    <p className="text-xs text-gray-500 mt-1">
                      - {fb.byUser?.name || "System"} on{" "}
                      {new Date(fb.at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="ml-2 italic">No feedback yet.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// TTL Status Component
const TTLStatus = () => {
  const [loading, setLoading] = useState(false);
  const [ttlData, setTtlData] = useState(null);
  const [showTTLStatus, setShowTTLStatus] = useState(false);
  const [error, setError] = useState(null);

  const fetchTTLStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/admin/ttl-status");
      setTtlData(response.data);
    } catch (error) {
      console.error("Error fetching TTL status:", error);
      setError(error.response?.data?.message || "Failed to fetch TTL status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showTTLStatus && !ttlData) {
      fetchTTLStatus();
    }
  }, [showTTLStatus, ttlData, fetchTTLStatus]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaTrash className="mr-2 text-red-500" />
          Auto-Deletion Status (TTL)
        </h3>
        <button
          onClick={() => setShowTTLStatus(!showTTLStatus)}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          {showTTLStatus ? <FaChevronUp /> : <FaChevronDown />}
          <span className="ml-1">{showTTLStatus ? "Hide" : "Show"}</span>
        </button>
      </div>

      {showTTLStatus && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="animate-spin mr-2" />
              <span>Loading TTL status...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="flex items-center">
                <FaTimesCircle className="mr-2" />
                {error}
              </p>
            </div>
          )}

          {ttlData && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* TTL Index Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  TTL Index Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {ttlData.ttlIndex.exists ? (
                      <FaCheckCircle className="text-green-500 mr-2" />
                    ) : (
                      <FaTimesCircle className="text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      Index: {ttlData.ttlIndex.exists ? "Active" : "Missing"}
                    </span>
                  </div>
                  {ttlData.ttlIndex.exists && (
                    <>
                      <p className="text-sm text-gray-600">
                        Expires after: {ttlData.ttlIndex.expireAfterDays} days
                      </p>
                      <p className="text-xs text-gray-500">
                        Index name: {ttlData.ttlIndex.name}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Project Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  Project Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium">
                      {ttlData.statistics.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Approved:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {ttlData.statistics.approved}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rejected:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {ttlData.statistics.rejected}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pending:</span>
                    <span className="ml-2 font-medium text-yellow-600">
                      {ttlData.statistics.pending}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expired Projects Alert */}
              {ttlData.expiredProjects.count > 0 && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <FaTimesCircle className="mr-2" />
                    ⚠️ Expired Projects Found ({ttlData.expiredProjects.count})
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    These projects were rejected more than 2 days ago but
                    haven&apos;t been auto-deleted yet:
                  </p>
                  <div className="space-y-2">
                    {ttlData.expiredProjects.projects.map((project, index) => (
                      <div
                        key={index}
                        className="text-sm bg-white bg-opacity-50 p-2 rounded"
                      >
                        <span className="font-medium">{project.title}</span>
                        <span className="text-red-600 ml-2">
                          (rejected {project.daysAgo} days ago)
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-3">
                    Note: MongoDB TTL runs every 60 seconds, so recently expired
                    documents may take up to 1 minute to be deleted.
                  </p>
                </div>
              )}

              {/* Recent Rejections */}
              {ttlData.recentRejections.length > 0 && (
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    Recent Rejections (Last 7 Days)
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ttlData.recentRejections.map((project, index) => (
                      <div
                        key={index}
                        className="text-sm bg-white bg-opacity-50 p-2 rounded"
                      >
                        <span className="font-medium">{project.title}</span>
                        <span className="text-yellow-700 ml-2">
                          (rejected {project.daysAgo} day
                          {project.daysAgo !== 1 ? "s" : ""} ago)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {ttlData && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={fetchTTLStatus}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FaSpinner
                  className={`mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Status
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [approvalFilter, setApprovalFilter] = useState("all"); // all, approved, pending
  const [proposerFilter, setProposerFilter] = useState("all"); // all, admin, other
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add', 'edit', 'delete', 'approve', 'reject', 'schedule'
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/admin/projects");
      setProjects(response.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch projects.");
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const categories = [
    ...new Set(projects.map((p) => p.category).filter(Boolean)),
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "rejected"
        ? p.rejectedAt
        : approvalFilter === "approved"
          ? p.isApproved && !p.rejectedAt
          : !p.isApproved && !p.rejectedAt);

    const matchesProposer =
      proposerFilter === "all" || p.proposedBy?.role === proposerFilter;

    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    return (
      matchesSearch && matchesApproval && matchesProposer && matchesCategory
    );
  });

  const handleOpenModal = (type, project = null) => {
    setModalType(type);
    setSelectedProject(project);
    setActionMessage("");
    if (type === "add") {
      setFormData({
        title: "",
        description: "",
        category: "",
        maxTeams: 1,
        isAvailable: false,
      });
    } else if (type === "edit" && project) {
      setFormData({ ...project });
    } else if (type === "schedule") {
      setFormData({ discussionDate: "" });
    } else {
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setModalType("");
    setFormData({});
    setActionMessage("");
    setActionLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage("");

    const endpoint =
      modalType === "add"
        ? "/admin/projects"
        : `/admin/projects/${selectedProject._id}`;
    const method = modalType === "add" ? "post" : "put";

    try {
      await axios[method](endpoint, formData);
      setActionMessage(
        `Project ${modalType === "add" ? "added" : "updated"} successfully.`
      );
      fetchProjects();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setActionMessage(
        err.response?.data?.message || `Failed to ${modalType} project.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (type, project) => {
    // Prevent actions on rejected projects (except for viewing details)
    if (project?.rejectedAt && !["add"].includes(type)) {
      return;
    }

    if (["edit", "add"].includes(type)) {
      handleOpenModal(type, project);
      return;
    }
    handleOpenModal(type, project);
  };

  const handleConfirmAction = async () => {
    if (!selectedProject) return;
    setActionLoading(true);
    setActionMessage("");
    let endpoint = "";
    let successMessage = "";

    try {
      switch (modalType) {
        case "delete":
          endpoint = `/admin/projects/${selectedProject._id}`;
          await axios.delete(endpoint);
          successMessage = "Project deleted successfully.";
          break;
        case "approve":
          endpoint = `/admin/approve-project/${selectedProject._id}`;
          await axios.post(endpoint, { feedback: formData.feedback });
          successMessage = "Project approved successfully.";
          break;
        case "reject":
          endpoint = `/admin/reject-project/${selectedProject._id}`;
          if (!formData.feedback) {
            setActionMessage("Feedback is required for rejection.");
            setActionLoading(false);
            return;
          }
          await axios.post(endpoint, { feedback: formData.feedback });
          successMessage = "Project rejected successfully.";
          break;
        case "schedule": {
          endpoint = `/admin/schedule-project-discussion`;
          if (!formData.discussionDate) {
            setActionMessage("Discussion date is required.");
            setActionLoading(false);
            return;
          }

          // Validate that the date is in the future
          const selectedDate = new Date(formData.discussionDate);
          const now = new Date();
          if (selectedDate <= now) {
            setActionMessage("Discussion date must be in the future.");
            setActionLoading(false);
            return;
          }

          await axios.post(endpoint, {
            projectId: selectedProject._id,
            dateTime: formData.discussionDate,
          });
          successMessage = "Discussion scheduled successfully.";
          break;
        }
        default:
          throw new Error("Invalid action type");
      }
      setActionMessage(successMessage);
      fetchProjects();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setActionMessage(err.response?.data?.message || `Action failed.`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "add":
      case "edit":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="title"
              value={formData.title || ""}
              onChange={handleFormChange}
              placeholder="Title"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleFormChange}
              placeholder="Description"
              className="w-full p-2 border rounded h-24"
              required
            />
            <input
              name="category"
              value={formData.category || ""}
              onChange={handleFormChange}
              placeholder="Category"
              className="w-full p-2 border rounded"
              required
            />
            <div className="flex items-center gap-4">
              <label>Max Teams:</label>
              <input
                name="maxTeams"
                type="number"
                min="1"
                value={formData.maxTeams || 1}
                onChange={handleFormChange}
                className="p-2 border rounded w-24"
              />
            </div>
            {actionMessage && (
              <p
                className={`text-sm ${actionMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded disabled:bg-gray-400"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : modalType === "add" ? (
                  "Add Project"
                ) : (
                  "Update Project"
                )}
              </button>
            </div>
          </form>
        );
      case "delete":
        return (
          <div>
            <p>
              Are you sure you want to delete the project &quot;
              {selectedProject?.title}&quot;?
            </p>
            {actionMessage && (
              <p
                className={`text-sm mt-2 ${actionMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        );
      case "approve":
      case "reject":
        return (
          <div>
            <p>
              Are you sure you want to {modalType} the project &quot;
              {selectedProject?.title}&quot;?
            </p>
            <textarea
              name="feedback"
              onChange={handleFormChange}
              placeholder={`Feedback (${modalType === "reject" ? "required" : "optional"
                })`}
              className="w-full p-2 border rounded mt-2 h-20"
            />
            {actionMessage && (
              <p
                className={`text-sm mt-2 ${actionMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded disabled:bg-gray-400 ${modalType === "approve" ? "bg-green-600" : "bg-red-600"
                  }`}
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  modalType.charAt(0).toUpperCase() + modalType.slice(1)
                )}
              </button>
            </div>
          </div>
        );
      case "schedule":
        return (
          <div>
            <p className="mb-4">
              Schedule discussion for &quot;{selectedProject?.title}&quot;
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Date & Time
                </label>
                <input
                  name="discussionDate"
                  type="datetime-local"
                  value={formData.discussionDate || ""}
                  onChange={handleFormChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select a future date and time for the project discussion
                </p>
              </div>
            </div>
            {actionMessage && (
              <p
                className={`text-sm mt-3 ${actionMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:bg-gray-400 transition-colors"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  "Schedule Discussion"
                )}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-200 rounded animate-pulse" />
              <div>
                <div className="h-8 bg-slate-200 rounded w-56 mb-2 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-72 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Controls skeleton (search + filters) */}
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-10 bg-slate-200 rounded animate-pulse col-span-1 lg:col-span-4" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Projects grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                  <div className="h-6 w-24 bg-slate-200 rounded" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="h-8 w-24 bg-slate-200 rounded" />
                  <div className="h-8 w-24 bg-slate-200 rounded" />
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
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <FaInfoCircle className="text-4xl text-red-500 mb-4" />
        <p className="text-lg text-red-600 text-center">{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Projects</h1>
        <button
          onClick={() => handleOpenModal("add")}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Project
        </button>
      </div>

      {/* Timeline Management Section */}
      <TimelineManagement onRefresh={fetchProjects} />

      {/* TTL Status Section */}
      <TTLStatus />

      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-md lg:col-span-4"
          />
          {/* Approval Filter */}
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Approval Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          {/* Proposer Filter */}
          <select
            value={proposerFilter}
            onChange={(e) => setProposerFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Proposers</option>
            <option value="admin">Admin</option>
            <option value="other">Mentor/Student</option>
          </select>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onAction={handleAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-600">
            No projects found matching your criteria.
          </p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalType.charAt(0).toUpperCase() + modalType.slice(1) + " Project"
        }
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
