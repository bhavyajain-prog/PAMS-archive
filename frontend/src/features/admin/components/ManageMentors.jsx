import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../services/axios"; // Ensure this path is correct
import {
  FaUsers,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserShield,
  FaUserGraduate,
  FaEye,
} from "react-icons/fa";
// Inline skeletons used — shared Skeleton component removed per request

// Placeholder for a more sophisticated Modal component if needed later
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-surface p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-heading">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-body text-2xl"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const MentorCard = ({ mentor, onToggleExpand }) => {
  const getRoleClass = (role) => {
    if (role === "sub-admin") return "bg-sky-100 text-sky-700";
    if (role === "mentor") return "bg-indigo-100 text-indigo-700";
    return "bg-surface-alt text-body";
  };

  return (
    <div className="bg-surface shadow-lg rounded-lg p-6 transition-all duration-300 ease-in-out flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-primary truncate">{mentor.name}</h2>
          <p className="text-sm text-body truncate">{mentor.email}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleClass(
            mentor.role
          )} mt-2 sm:mt-0 sm:ml-2 whitespace-nowrap`}
        >
          {mentor.role}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm flex-grow">
        <p className="flex items-start">
          <span className="text-body font-semibold min-w-fit">Department:</span>
          <span className="ml-1 text-heading">{mentor.mentorData?.department || "N/A"}</span>
        </p>
        <p className="flex items-start">
          <span className="text-body font-semibold min-w-fit">Designation:</span>
          <span className="ml-1 text-heading">{mentor.mentorData?.designation || "N/A"}</span>
        </p>
        <p className="flex items-center">
          <FaUsers className="inline mr-2 text-primary flex-shrink-0" />
          <span className="text-body">Max Teams:</span>
          <span className="ml-1 text-heading">
            {mentor.mentorData?.maxTeams === undefined ||
              mentor.mentorData?.maxTeams === null
              ? "N/A"
              : mentor.mentorData.maxTeams}
          </span>
        </p>
        <p className="flex items-center">
          <FaUsers className="inline mr-2 text-primary flex-shrink-0" />
          <span className="text-body">Assigned Teams:</span>
          <span className="ml-1 text-heading">{mentor.mentorData?.assignedTeams?.length || 0}</span>
        </p>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={() => onToggleExpand(mentor._id)}
          className="w-full text-sm bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-sm flex items-center justify-center"
        >
          <FaEye className="mr-2" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default function ManageMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedMentorForAction, setSelectedMentorForAction] = useState(null);
  const [actionType, setActionType] = useState(""); // 'add', 'edit', 'remove', 'promote', 'demote', 'details'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" }); // type: 'success' or 'error'

  // Form state for adding/editing mentor
  const [mentorForm, setMentorForm] = useState({
    name: "",
    email: "",
    username: "", // Auto-generate from email or manual
    phone: "",
    role: "mentor", // Default role
    empNo: "",
    department: "",
    designation: "",
    qualifications: "", // Comma-separated string
    maxTeams: 3, // Default
  });

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/mentors");
      const mentorsData = response.data.mentors || [];

      // Debug: Check for mentors without mentorData
      const mentorsWithoutData = mentorsData.filter(m => !m.mentorData);
      if (mentorsWithoutData.length > 0) {
        console.warn('Mentors missing mentorData:', mentorsWithoutData);
      }

      setMentors(mentorsData);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch mentors."
      );
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const filteredMentors = mentors.filter(
    (mentor) =>
      (mentor.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (mentor.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (mentor.mentorData?.empNo?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (mentor.mentorData?.department?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (mentor.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleToggleExpand = (mentorId) => {
    // Find mentor and show in modal
    const mentor = mentors.find(m => m._id === mentorId);
    if (mentor) {
      if (!mentor.mentorData) {
        console.warn('Mentor missing mentorData:', mentor);
      }
      setSelectedMentorForAction(mentor);
      setActionType('details');
      setIsActionModalOpen(true);
    }
  };

  const handleOpenActionModal = (mentor, type) => {
    setActionType(type);
    setSelectedMentorForAction(mentor);
    setActionMessage({ text: "", type: "" });
    if (type === "edit" && mentor) {
      setMentorForm({
        name: mentor.name || "",
        email: mentor.email || "",
        username: mentor.username || "",
        phone: mentor.phone || "",
        role: mentor.role || "mentor",
        empNo: mentor.mentorData?.empNo || "",
        department: mentor.mentorData?.department || "",
        designation: mentor.mentorData?.designation || "",
        qualifications: mentor.mentorData?.qualifications || "",
        maxTeams:
          mentor.mentorData?.maxTeams === undefined ||
            mentor.mentorData?.maxTeams === null
            ? 3
            : mentor.mentorData.maxTeams,
      });
    } else if (type === "add") {
      setMentorForm({
        // Reset form for adding
        name: "",
        email: "",
        username: "",
        phone: "",
        role: "mentor",
        empNo: "",
        department: "",
        designation: "",
        qualifications: "",
        maxTeams: 3,
      });
    }
    setIsActionModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedMentorForAction(null);
    setActionType("");
    setMentorForm({
      // Reset form
      name: "",
      email: "",
      username: "",
      phone: "",
      role: "mentor",
      empNo: "",
      department: "",
      designation: "",
      qualifications: "",
      maxTeams: 3,
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(
      `Form change - Name: ${name}, Value: ${value}, Type: ${type}, Checked: ${checked}`
    );
    setMentorForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseInt(value, 10)
            : value,
    }));
  };

  const handleAddMentorSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      const payload = {
        name: mentorForm.name,
        email: mentorForm.email,
        username: mentorForm.username || mentorForm.email.split("@")[0],
        phone: mentorForm.phone,
        role: "mentor", // New mentors are added with 'mentor' role. Promotion is a separate step.
        // Password will be auto-generated by the backend.
        mentorData: {
          empNo: mentorForm.empNo,
          department: mentorForm.department,
          designation: mentorForm.designation,
          qualifications: mentorForm.qualifications,
          maxTeams: parseInt(mentorForm.maxTeams, 10),
        },
      };
      await axiosInstance.post("/admin/register", payload);
      setActionMessage({
        text: "Mentor added successfully. Refreshing list...",
        type: "success",
      });
      fetchMentors(); // Refresh list
      handleCloseActionModal(); // Close modal
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message || err.message || "Failed to add mentor.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMentorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMentorForAction) return;
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      const payload = {
        name: mentorForm.name,
        email: mentorForm.email,
        username: mentorForm.username,
        phone: mentorForm.phone,
        role: mentorForm.role, // Role can be changed here (mentor/sub-admin)
        mentorData: {
          // Send mentorData, backend will use/update it appropriately
          empNo: mentorForm.empNo,
          department: mentorForm.department,
          designation: mentorForm.designation,
          qualifications: mentorForm.qualifications,
          maxTeams: parseInt(mentorForm.maxTeams, 10),
        },
      };
      await axiosInstance.put(
        `/admin/user/${selectedMentorForAction._id}`,
        payload
      );
      setActionMessage({
        text: "Mentor updated successfully. Refreshing list...",
        type: "success",
      });
      fetchMentors(); // Refresh list
      handleCloseActionModal(); // Close modal
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update mentor.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMentor = async () => {
    if (!selectedMentorForAction) return;
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      await axiosInstance.delete(`/admin/user/${selectedMentorForAction._id}`);
      setActionMessage({
        text: "Mentor removed successfully. Refreshing list...",
        type: "success",
      });
      fetchMentors(); // Refresh list
      handleCloseActionModal(); // Close modal
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to remove mentor.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteDemoteMentor = async (newRole) => {
    if (!selectedMentorForAction) return;
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      const payload = { role: newRole };
      // The backend PUT /admin/user/:id handles mentorData and adminData consistency.
      await axiosInstance.put(
        `/admin/user/${selectedMentorForAction._id}`,
        payload
      );
      setActionMessage({
        text: `Mentor role changed to ${newRole} successfully. Refreshing list...`,
        type: "success",
      });
      fetchMentors(); // Refresh list
      handleCloseActionModal(); // Close modal
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to change mentor role.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-base">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-surface rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-full mr-4" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>

                <div className="mt-6 flex space-x-3">
                  <div className="h-9 bg-slate-200 rounded w-24" />
                  <div className="h-9 bg-slate-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 p-4 bg-red-100 border border-red-400 rounded-md text-center">
        Error: {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-surface shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-heading">Manage Mentors</h1>
          <button
            onClick={() => handleOpenActionModal(null, "add")}
            className="mt-4 sm:mt-0 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2 rounded-md shadow-sm flex items-center transition-colors"
          >
            <FaUserPlus className="mr-2" /> Add New Mentor
          </button>
        </div>
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search mentors (name, email, emp no, dept, role)..."
            className="w-full p-3 pl-10 border border-edge rounded-md focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
        </div>
      </div>

      {filteredMentors.length === 0 ? (
        <p className="text-center text-body text-lg">
          No mentors found matching your criteria, or no mentors available.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Mentor Modal */}
      {(actionType === "add" || actionType === "edit") && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={handleCloseActionModal}
          title={actionType === "add" ? "Add New Mentor" : "Edit Mentor"}
        >
          <form
            onSubmit={
              actionType === "add"
                ? handleAddMentorSubmit
                : handleEditMentorSubmit
            }
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-body"
              >
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={mentorForm.name}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-body"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={mentorForm.email}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-body"
              >
                Username (Optional, auto-generated if empty)
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={mentorForm.username}
                onChange={handleFormChange}
                placeholder="e.g. first.last"
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-body"
              >
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={mentorForm.phone}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="empNo"
                className="block text-sm font-medium text-body"
              >
                Employee Number
              </label>
              <input
                type="text"
                name="empNo"
                id="empNo"
                value={mentorForm.empNo}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-body"
              >
                Department
              </label>
              <input
                type="text"
                name="department"
                id="department"
                value={mentorForm.department}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="designation"
                className="block text-sm font-medium text-body"
              >
                Designation
              </label>
              <input
                type="text"
                name="designation"
                id="designation"
                value={mentorForm.designation}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="qualifications"
                className="block text-sm font-medium text-body"
              >
                Qualifications (comma-separated)
              </label>
              <input
                type="text"
                name="qualifications"
                id="qualifications"
                value={mentorForm.qualifications}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="maxTeams"
                className="block text-sm font-medium text-body"
              >
                Max Teams
              </label>
              <input
                type="number"
                name="maxTeams"
                id="maxTeams"
                value={mentorForm.maxTeams}
                onChange={handleFormChange}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
              />
            </div>
            {actionType === "edit" && ( // Role change is handled by promote/demote, not direct edit here for simplicity, but can be added
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-body"
                >
                  Role
                </label>
                <select
                  name="role"
                  id="role"
                  value={mentorForm.role}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-edge rounded-md shadow-sm focus:outline-none focus:ring-primary/50 focus:border-primary sm:text-sm"
                >
                  <option value="mentor">Mentor</option>
                  <option value="sub-admin">Sub-Admin</option>
                </select>
              </div>
            )}

            {actionMessage.text && (
              <p
                className={`text-sm ${actionMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage.text}
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseActionModal}
                className="px-4 py-2 text-sm font-medium text-body bg-surface-alt hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md disabled:opacity-50"
              >
                {actionLoading
                  ? "Saving..."
                  : actionType === "add"
                    ? "Add Mentor"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Remove Mentor Modal */}
      {actionType === "remove" && selectedMentorForAction && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={handleCloseActionModal}
          title="Remove Mentor"
        >
          <p className="text-body mb-4">
            Are you sure you want to remove mentor{" "}
            <strong className="font-semibold">
              {selectedMentorForAction.name}
            </strong>{" "}
            ({selectedMentorForAction.email})?
          </p>
          <p className="text-sm text-red-600 mb-4">
            This action cannot be undone.
          </p>
          {actionMessage.text && (
            <p
              className={`text-sm mb-2 ${actionMessage.type === "success"
                ? "text-green-600"
                : "text-red-600"
                }`}
            >
              {actionMessage.text}
            </p>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseActionModal}
              className="px-4 py-2 text-sm font-medium text-body bg-surface-alt hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveMentor}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Removing..." : "Remove Mentor"}
            </button>
          </div>
        </Modal>
      )}

      {/* Promote/Demote Mentor Modal */}
      {(actionType === "promote" || actionType === "demote") &&
        selectedMentorForAction && (
          <Modal
            isOpen={isActionModalOpen}
            onClose={handleCloseActionModal}
            title={
              actionType === "promote"
                ? "Promote to Sub-Admin"
                : "Demote to Mentor"
            }
          >
            <p className="text-body mb-4">
              Are you sure you want to {actionType}{" "}
              <strong className="font-semibold">
                {selectedMentorForAction.name}
              </strong>{" "}
              ({selectedMentorForAction.email})?
            </p>
            {actionMessage.text && (
              <p
                className={`text-sm mb-2 ${actionMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {actionMessage.text}
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseActionModal}
                className="px-4 py-2 text-sm font-medium text-body bg-surface-alt hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handlePromoteDemoteMentor(
                    actionType === "promote" ? "sub-admin" : "mentor"
                  )
                }
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${actionType === "promote"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
              >
                {actionLoading
                  ? "Processing..."
                  : actionType === "promote"
                    ? "Promote"
                    : "Demote"}
              </button>
            </div>
          </Modal>
        )}

      {/* Mentor Details Modal */}
      {actionType === "details" && selectedMentorForAction && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={handleCloseActionModal}
          title="Mentor Details"
        >
          <div className="space-y-4">
            {!selectedMentorForAction.mentorData ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-semibold flex items-center">
                  <span className="text-xl mr-2">⚠️</span>
                  Incomplete Mentor Data
                </p>
                <p className="mt-2">
                  This mentor profile is missing mentor-specific data. Please edit the mentor to add required information.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-edge">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Name</p>
                    <p className="text-sm text-heading font-medium mt-1">{selectedMentorForAction.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Role</p>
                    <p className="text-sm text-heading font-medium mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedMentorForAction.role === "sub-admin"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-indigo-100 text-indigo-700"
                        }`}>
                        {selectedMentorForAction.role}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-edge">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Email</p>
                    <p className="text-sm text-heading mt-1 break-all">{selectedMentorForAction.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Username</p>
                    <p className="text-sm text-heading mt-1 break-words">{selectedMentorForAction.username || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-edge">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Employee No.</p>
                    <p className="text-sm text-heading mt-1">{selectedMentorForAction.mentorData?.empNo || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-heading mt-1">{selectedMentorForAction.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-edge">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Department</p>
                    <p className="text-sm text-heading mt-1">{selectedMentorForAction.mentorData?.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Designation</p>
                    <p className="text-sm text-heading mt-1">{selectedMentorForAction.mentorData?.designation || "N/A"}</p>
                  </div>
                </div>

                <div className="pb-3 border-b border-edge">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Qualifications</p>
                  <p className="text-sm text-heading mt-1">{selectedMentorForAction.mentorData?.qualifications || "N/A"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-edge">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Max Teams</p>
                    <p className="text-sm text-heading mt-1">
                      {selectedMentorForAction.mentorData?.maxTeams === undefined ||
                        selectedMentorForAction.mentorData?.maxTeams === null
                        ? "N/A"
                        : selectedMentorForAction.mentorData.maxTeams}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">First Login Required</p>
                    <p className="text-sm text-heading mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedMentorForAction.firstLogin
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                        }`}>
                        {selectedMentorForAction.firstLogin ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pb-3 border-b border-edge">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Assigned Teams</p>
                  {selectedMentorForAction.mentorData?.assignedTeams &&
                    Array.isArray(selectedMentorForAction.mentorData.assignedTeams) &&
                    selectedMentorForAction.mentorData.assignedTeams.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedMentorForAction.mentorData.assignedTeams.map((team, index) => (
                        <li key={team?._id || `team-${index}`} className="text-sm text-heading flex items-center">
                          <span className="w-2 h-2 bg-primary-subtle0 rounded-full mr-2"></span>
                          {team?.code || team?.name || (typeof team === 'string' ? `Team ID: ${team}` : "Unknown Team")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted italic">No teams assigned</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Created At</p>
                    <p className="text-sm text-heading mt-1">
                      {selectedMentorForAction.createdAt
                        ? new Date(selectedMentorForAction.createdAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Updated At</p>
                    <p className="text-sm text-heading mt-1">
                      {selectedMentorForAction.updatedAt
                        ? new Date(selectedMentorForAction.updatedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-edge">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    handleCloseActionModal();
                    setTimeout(() => handleOpenActionModal(selectedMentorForAction, "edit"), 100);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md flex items-center transition-colors"
                >
                  <FaEdit className="mr-2" /> Edit
                </button>
                <button
                  onClick={() => {
                    handleCloseActionModal();
                    setTimeout(() => handleOpenActionModal(selectedMentorForAction, "remove"), 100);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md flex items-center transition-colors"
                >
                  <FaTrash className="mr-2" /> Delete
                </button>
                {selectedMentorForAction.role === "mentor" && (
                  <button
                    onClick={() => {
                      handleCloseActionModal();
                      setTimeout(() => handleOpenActionModal(selectedMentorForAction, "promote"), 100);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md flex items-center transition-colors"
                  >
                    <FaUserShield className="mr-2" /> Promote
                  </button>
                )}
                {selectedMentorForAction.role === "sub-admin" && (
                  <button
                    onClick={() => {
                      handleCloseActionModal();
                      setTimeout(() => handleOpenActionModal(selectedMentorForAction, "demote"), 100);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md flex items-center transition-colors"
                  >
                    <FaUserGraduate className="mr-2" /> Demote
                  </button>
                )}
              </div>
              <button
                onClick={handleCloseActionModal}
                className="px-4 py-2 text-sm font-medium text-body bg-surface-alt hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
