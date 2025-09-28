import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUpload,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaExclamationTriangle,
  FaTrash,
  FaSpinner,
  FaProjectDiagram,
  FaClipboardList,
} from "react-icons/fa"; // Import actual icons
import axios from "../../../services/axios"; // Import axios

// Icon components using react-icons
const IconWrapper = ({ children }) => (
  <div className="p-3 bg-teal-100 rounded-full mb-4 inline-block">
    {children}
  </div>
);

const UploadIcon = () => (
  <IconWrapper>
    <FaUpload className="text-3xl text-teal-600" />
  </IconWrapper>
);
const TeamIcon = () => (
  <IconWrapper>
    <FaUsers className="text-3xl text-teal-600" />
  </IconWrapper>
);
const MentorIcon = () => (
  <IconWrapper>
    <FaChalkboardTeacher className="text-3xl text-teal-600" />
  </IconWrapper>
);
const StudentIcon = () => (
  <IconWrapper>
    <FaUserGraduate className="text-3xl text-teal-600" />
  </IconWrapper>
);
const ProjectIcon = () => (
  <IconWrapper>
    <FaProjectDiagram className="text-3xl text-teal-600" />
  </IconWrapper>
);
const FormsIcon = () => (
  <IconWrapper>
    <FaClipboardList className="text-3xl text-teal-600" />
  </IconWrapper>
);
// const SettingsIcon = () => <IconWrapper><FaCog className="text-3xl text-teal-600" /></IconWrapper>; // Example for a potential settings card

const AdminActionCard = ({ to, title, icon, description }) => (
  <Link
    to={to}
    className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col text-center h-full" // Added h-full for consistent card height
  >
    <div className="pt-6 pb-4 px-6">
      {icon}
      <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
    <div className="mt-auto p-4 bg-gray-50 group-hover:bg-teal-50 transition-colors duration-300">
      <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
        Go to {title} &rarr;
      </span>
    </div>
  </Link>
);

export default function AdminPortal() {
  const [showConfirmFlush, setShowConfirmFlush] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState("");
  const [flushError, setFlushError] = useState("");

  const handleFlushInitiate = () => {
    setFlushError("");
    setFlushMessage("");
    setShowConfirmFlush(true);
  };

  const handleFlushConfirm = async () => {
    setIsFlushing(true);
    setFlushError("");
    setFlushMessage("");
    try {
      const response = await axios.delete("/admin/flush-all");
      setFlushMessage(
        response.data.message || "All data flushed successfully!"
      );
      // Optionally, trigger a re-fetch of any dashboard data or a page reload
      // For example: window.location.reload();
      // Or, if using a context/global state for dashboard data, trigger a refresh action.
    } catch (err) {
      setFlushError(
        err.response?.data?.message || "Failed to flush data. Please try again."
      );
    } finally {
      setIsFlushing(false);
      setShowConfirmFlush(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-100 to-sky-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      {" "}
      {/* Added relative positioning */}
      {/* Loading Overlay for Flushing - covers the whole page content area */}
      {isFlushing && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50 rounded-md">
          {" "}
          {/* Added rounded-md to match parent if needed */}
          <FaSpinner className="animate-spin text-white text-6xl mb-4" />
          <p className="text-white text-2xl">Flushing all data...</p>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800">Admin Dashboard</h1>{" "}
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your PAMS workflow with powerful admin tools at your
            fingertips.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 mb-16">
          {" "}
          {/* Added mb-16 */}
          <AdminActionCard
            to="/admin/upload"
            title="Upload Data"
            icon={<UploadIcon />}
            description="Efficiently upload and manage student, mentor, and project data using .xlsx or .csv files."
          />
          <AdminActionCard
            to="/admin/manage/teams"
            title="Manage Teams"
            icon={<TeamIcon />}
            description="Review team compositions, approve or reject team proposals, and oversee team statuses."
          />
          <AdminActionCard
            to="/admin/manage/mentors"
            title="Manage Mentors"
            icon={<MentorIcon />}
            description="Oversee mentor profiles, track their assigned teams, and manage mentor-specific settings."
          />
          <AdminActionCard
            to="/admin/manage/students"
            title="Manage Students"
            icon={<StudentIcon />}
            description="Access and manage student records, view their team affiliations, and track academic progress."
          />
          <AdminActionCard
            to="/admin/manage/projects"
            title="Manage Projects"
            icon={<ProjectIcon />}
            description="Create, update, and oversee projects. Manage project allocations and track progress."
          />
          <AdminActionCard
            to="/admin/view-forms"
            title="View Forms"
            icon={<FormsIcon />}
            description="Access and review submitted forms for students, mentors, and projects. Manage form statuses and feedback."
          />
          <AdminActionCard
            to="/admin/doc-upload-status"
            title="Document Review"
            icon={<FormsIcon />}
            description="Review and monitor team document submissions and approval status across all forms."
          />
        </div>

        {/* Danger Zone - Flush Data Section */}
        <div className="mt-16 pt-10 border-t-2 border-red-200">
          <header className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-700 flex items-center justify-center">
              <FaExclamationTriangle className="mr-3" /> Danger Zone
            </h2>
            <p className="mt-3 text-md text-gray-600 max-w-xl mx-auto">
              Proceed with extreme caution. These actions are irreversible and
              can lead to significant data loss.
            </p>
          </header>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-lg mx-auto text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Flush All Application Data
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all student records, mentor details,
              team formations, project data, and other non-essential application
              data. Admin accounts will remain. This action cannot be undone.
            </p>

            {flushMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded text-sm">
                {flushMessage}
              </div>
            )}
            {flushError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-sm">
                {flushError}
              </div>
            )}

            {!showConfirmFlush && (
              <button
                onClick={handleFlushInitiate}
                disabled={isFlushing} // Disable button while flushing
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isFlushing ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Flushing...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" /> Flush All Data
                  </>
                )}
              </button>
            )}

            {showConfirmFlush && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                <h4 className="text-md font-semibold text-red-800 mb-2">
                  Confirm Data Deletion
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  Are you absolutely sure you want to delete all application
                  data? This action is irreversible.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmFlush(false)}
                    disabled={isFlushing} // Disable button while flushing
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlushConfirm}
                    disabled={isFlushing} // Disable button while flushing
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isFlushing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />{" "}
                        Processing...
                      </>
                    ) : (
                      "Yes, Flush Data"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
