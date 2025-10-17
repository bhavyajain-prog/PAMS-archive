// filepath: /home/nerfex/Projects/DeptProject/project-allocation-process-and-evaluation/frontend/src/features/admin/components/ManageStudents.jsx
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../services/axios";
import {
  FaUserGraduate,
  FaSearch,
  FaEnvelope,
  FaIdCard,
  FaBuilding,
  FaUsers,
  FaPhone,
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaUserPlus,
} from "react-icons/fa";

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

const StudentCard = ({ student, onOpenActionModal }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-xl">
      <div className="flex items-center mb-4">
        <FaUserGraduate className="text-3xl text-teal-600 mr-4" />
        <div>
          <h2 className="text-2xl font-bold text-teal-700">{student.name}</h2>
          <p className="text-sm text-gray-600 flex items-center">
            <FaEnvelope className="mr-2 text-gray-500" /> {student.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-2">
        <p className="font-semibold text-gray-800 flex items-center">
          <FaIdCard className="mr-2 text-indigo-500" /> Roll No:{" "}
          <span className="font-normal text-gray-700 ml-1">
            {student.studentData?.rollNumber || "N/A"}
          </span>
        </p>
        <p className="font-semibold text-gray-800 flex items-center">
          <FaBuilding className="mr-2 text-indigo-500" /> Dept:{" "}
          <span className="font-normal text-gray-700 ml-1">
            {student.studentData?.department || "N/A"}
          </span>
        </p>
        <p className="font-semibold text-gray-800 flex items-center">
          <FaUsers className="mr-2 text-indigo-500" /> Batch:{" "}
          <span className="font-normal text-gray-700 ml-1">
            {student.studentData?.batch || "N/A"}
          </span>
        </p>
        <p className="text-gray-700 flex items-center">
          <FaUserCircle className="mr-2 text-gray-500" /> Reg. No.:{" "}
          {student.username || "N/A"}
        </p>
        <p className="text-gray-700 flex items-center">
          <FaPhone className="mr-2 text-gray-500" /> Phone:{" "}
          {student.phone || "N/A"}
        </p>
      </div>

      {student.studentData?.currentTeam && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            <strong className="text-gray-800">Current Team:</strong>{" "}
            {student.studentData.currentTeam.name ||
              student.studentData.currentTeam.code ||
              "N/A"}{" "}
            (ID: {student.studentData.currentTeam._id})
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => onOpenActionModal(student, "edit")}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center transition-colors"
        >
          <FaEdit className="mr-2" /> Edit
        </button>
        <button
          onClick={() => onOpenActionModal(student, "remove")}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center transition-colors"
        >
          <FaTrash className="mr-2" /> Remove
        </button>
      </div>
    </div>
  );
};

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] =
    useState(null);
  const [actionType, setActionType] = useState(""); // 'add', 'edit', 'remove'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });

  const initialFormState = {
    name: "",
    email: "",
    username: "",
    phone: "",
    rollNumber: "",
    batch: "",
    department: "",
  };
  const [studentForm, setStudentForm] = useState(initialFormState);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/students");
      setStudents(response.data.students || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch students."
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(
    (student) =>
      (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.studentData?.rollNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (student.studentData?.department?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (student.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleOpenActionModal = (student, type) => {
    setActionType(type);
    setSelectedStudentForAction(student);
    setActionMessage({ text: "", type: "" });
    if (type === "edit" && student) {
      setStudentForm({
        name: student.name || "",
        email: student.email || "",
        username: student.username || "",
        phone: student.phone || "",
        rollNumber: student.studentData?.rollNumber || "",
        batch: student.studentData?.batch || "",
        department: student.studentData?.department || "",
      });
    } else if (type === "add") {
      setStudentForm(initialFormState);
    }
    setIsActionModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedStudentForAction(null);
    setActionType("");
    setStudentForm(initialFormState);
    setActionMessage({ text: "", type: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      const payload = {
        name: studentForm.name,
        email: studentForm.email,
        username: studentForm.username || studentForm.email.split("@")[0],
        phone: studentForm.phone,
        role: "student",
        studentData: {
          rollNumber: studentForm.rollNumber,
          batch: studentForm.batch,
          department: studentForm.department,
        },
      };
      await axiosInstance.post("/admin/register", payload);
      setActionMessage({
        text: "Student added successfully. Refreshing list...",
        type: "success",
      });
      fetchStudents();
      handleCloseActionModal();
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to add student.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentForAction) return;
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      const payload = {
        name: studentForm.name,
        email: studentForm.email,
        username: studentForm.username,
        phone: studentForm.phone,
        // role: 'student', // Role is not changed here
        studentData: {
          rollNumber: studentForm.rollNumber,
          batch: studentForm.batch,
          department: studentForm.department,
        },
      };
      await axiosInstance.put(
        `/admin/user/${selectedStudentForAction._id}`,
        payload
      );
      setActionMessage({
        text: "Student updated successfully. Refreshing list...",
        type: "success",
      });
      fetchStudents();
      handleCloseActionModal();
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update student.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudentForAction) return;
    setActionLoading(true);
    setActionMessage({ text: "", type: "" });
    try {
      await axiosInstance.delete(`/admin/user/${selectedStudentForAction._id}`);
      setActionMessage({
        text: "Student removed successfully. Refreshing list...",
        type: "success",
      });
      fetchStudents();
      handleCloseActionModal();
    } catch (err) {
      setActionMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to remove student.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-50">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 animate-pulse">
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
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Students</h1>
          <button
            onClick={() => handleOpenActionModal(null, "add")}
            className="mt-4 sm:mt-0 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-md shadow-sm flex items-center transition-colors"
          >
            <FaUserPlus className="mr-2" /> Add New Student
          </button>
        </div>
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search students (name, email, roll no, dept, username)..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No students found matching your criteria, or no students available.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student._id}
              student={student}
              onOpenActionModal={handleOpenActionModal}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {(actionType === "add" || actionType === "edit") && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={handleCloseActionModal}
          title={actionType === "add" ? "Add New Student" : "Edit Student"}
        >
          <form
            onSubmit={
              actionType === "add"
                ? handleAddStudentSubmit
                : handleEditStudentSubmit
            }
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={studentForm.name}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={studentForm.email}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username (Optional, auto-generated if empty)
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={studentForm.username}
                onChange={handleFormChange}
                placeholder="e.g. first.last or b23xxxx"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={studentForm.phone}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="rollNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                id="rollNumber"
                value={studentForm.rollNumber}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="batch"
                className="block text-sm font-medium text-gray-700"
              >
                Batch
              </label>
              <input
                type="text"
                name="batch"
                id="batch"
                value={studentForm.batch}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <input
                type="text"
                name="department"
                id="department"
                value={studentForm.department}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>

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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md disabled:opacity-50"
              >
                {actionLoading
                  ? "Saving..."
                  : actionType === "add"
                    ? "Add Student"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Remove Student Modal */}
      {actionType === "remove" && selectedStudentForAction && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={handleCloseActionModal}
          title="Remove Student"
        >
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove student{" "}
            <strong className="font-semibold">
              {selectedStudentForAction.name}
            </strong>{" "}
            ({selectedStudentForAction.email})?
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveStudent}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Removing..." : "Remove Student"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
