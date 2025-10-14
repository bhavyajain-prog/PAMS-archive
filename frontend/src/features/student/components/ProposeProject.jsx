import { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axios";
import {
  FaPlus,
  FaTrash,
  FaLightbulb,
  FaBook,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit, // Import FaEdit
} from "react-icons/fa";

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
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

// Card for displaying projects from the project bank
const ProjectBankCard = ({ project }) => (
  <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-teal-500">
    <h4 className="text-xl font-bold text-teal-700">{project.title}</h4>
    <p className="text-sm text-gray-500 mb-2">Category: {project.category}</p>
    <p className="text-gray-700 text-sm mb-3">{project.description}</p>
    <div className="text-xs text-gray-500">
      <p>Proposed by: {project.proposedBy?.name || "Admin"}</p>
      <p>
        Teams Assigned: {project.assignedTeamCount || 0} / {project.maxTeams || 1}
      </p>
    </div>
  </div>
);

// Card for displaying user's own proposals
const MyProposalCard = ({ project, onWithdraw, onEdit }) => {
  const getStatusInfo = () => {
    if (project.rejectedAt) {
      return {
        icon: <FaTimesCircle className="text-red-500" />,
        text: "Rejected",
        color: "red",
      };
    }
    if (project.isApproved) {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        text: "Approved",
        color: "green",
      };
    }
    if (project.feedback && project.feedback.length > 0) {
      const rejection = project.feedback.find((f) =>
        f.message.toLowerCase().includes("reject")
      );
      if (rejection)
        return {
          icon: <FaTimesCircle className="text-red-500" />,
          text: "Rejected",
          color: "red",
        };
    }
    return {
      icon: <FaSpinner className="animate-spin text-yellow-500" />,
      text: "Pending",
      color: "yellow",
    };
  };

  const status = getStatusInfo();

  return (
    <div
      className={`bg-white p-5 rounded-lg shadow-md border-l-4 border-${status.color}-500`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xl font-bold text-gray-800">{project.title}</h4>
          <p className="text-sm text-gray-500 mb-2">
            Category: {project.category}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-semibold">
          {status.icon}
          <span>{status.text}</span>
        </div>
      </div>
      <p className="text-gray-700 text-sm mb-4">{project.description}</p>

      {project.feedback && project.feedback.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-600 mb-2">
            Feedback:
          </h5>
          {project.feedback.map((fb, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded-md text-xs mb-2">
              <p className="italic">&quot;{fb.message}&quot;</p>
              <p className="text-right text-gray-500 mt-1">
                - {fb.byUser?.name || "Admin"}
              </p>
            </div>
          ))}
        </div>
      )}

      {!project.isApproved && !project.rejectedAt && (
        <div className="text-right mt-4 flex justify-end items-center space-x-2">
          <button
            onClick={() => onEdit(project)}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-1 px-3 rounded-md flex items-center transition-colors"
          >
            <FaEdit className="mr-2" />
            Edit
          </button>
          <button
            onClick={() => onWithdraw(project._id)}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1 px-3 rounded-md flex items-center transition-colors"
          >
            <FaTrash className="mr-2" />
            Withdraw
          </button>
        </div>
      )}

      {project.isApproved && (
        <div className="text-right mt-4">
          <span className="text-sm text-green-600 font-semibold">
            ✓ This project is approved and cannot be modified
          </span>
        </div>
      )}

      {project.rejectedAt && (
        <div className="text-right mt-4">
          <span className="text-sm text-red-600 font-semibold">
            ✗ This project has been rejected and cannot be modified
          </span>
        </div>
      )}
    </div>
  );
};

export default function ProposeProject() {
  const [projectBank, setProjectBank] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [view, setView] = useState("bank"); // 'bank' or 'myProposals'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProject, setEditingProject] = useState(null); // To hold project being edited

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bankPromise = axios.get("/common/project-bank").catch(() => ({ data: [] }));
      const proposalsPromise = axios.get("/common/my-proposed-projects").catch(() => ({ data: [] }));

      const [bankRes, proposalsRes] = await Promise.all([bankPromise, proposalsPromise]);

      setProjectBank(bankRes.data || []);
      setMyProposals(proposalsRes.data || []);
    } catch (err) {
      // Only set error for serious connectivity issues
      console.error("Error fetching data:", err);
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear action messages when user starts typing
    if (actionMessage.text) {
      setActionMessage({ type: "", text: "" });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage({ type: "", text: "" });

    const url = editingProject
      ? `/common/update-proposed-project/${editingProject._id}`
      : "/common/propose-project";
    const method = editingProject ? "put" : "post";
    const successMessage = editingProject
      ? "Project updated successfully!"
      : "Project proposed successfully!";
    const errorMessage = editingProject
      ? "Failed to update project."
      : "Failed to propose project.";

    try {
      await axios[method](url, formData);
      setActionMessage({
        type: "success",
        text: successMessage,
      });
      fetchData(); // Refresh data
      setTimeout(() => {
        closeModalAndReset();
      }, 1500);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (window.confirm("Are you sure you want to withdraw this proposal? This action cannot be undone.")) {
      try {
        await axios.post(`/common/withdraw-project/${id}`);
        // Show success message in a more user-friendly way
        setActionMessage({
          type: "success",
          text: "Proposal withdrawn successfully."
        });
        fetchData(); // Refresh data
        // Clear message after 3 seconds
        setTimeout(() => {
          setActionMessage({ type: "", text: "" });
        }, 3000);
      } catch (err) {
        setActionMessage({
          type: "error",
          text: err.response?.data?.message || "Failed to withdraw proposal."
        });
        // Clear error message after 5 seconds
        setTimeout(() => {
          setActionMessage({ type: "", text: "" });
        }, 5000);
      }
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
    });
    setIsModalOpen(true);
  };

  const openModalForCreate = () => {
    setEditingProject(null);
    setFormData({ title: "", description: "", category: "" });
    setActionMessage({ type: "", text: "" });
    setIsModalOpen(true);
  };

  const closeModalAndReset = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({ title: "", description: "", category: "" });
    setActionMessage({ type: "", text: "" });
  };

  const filteredProjectBank = projectBank.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <FaSpinner className="animate-spin text-4xl text-teal-600" />
        <p className="ml-3 text-lg text-gray-700">Loading Projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <FaInfoCircle className="text-4xl text-red-500 mb-4" />
        <p className="text-lg text-red-600 text-center">{error}</p>
        <button
          onClick={fetchData}
          className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Global message display */}
        {actionMessage.text && (
          <div className={`mb-6 p-4 rounded-lg ${actionMessage.type === "error"
              ? "bg-red-100 border border-red-300 text-red-700"
              : "bg-green-100 border border-green-300 text-green-700"
            }`}>
            {actionMessage.text}
          </div>
        )}

        <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 sm:mb-0">
            Project Bank
          </h1>
          <button
            onClick={openModalForCreate}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
          >
            <FaPlus className="mr-2" /> Propose New Project
          </button>
        </header>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setView("bank")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${view === "bank"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FaBook className="inline mr-2" /> Project Bank
            </button>
            <button
              onClick={() => setView("myProposals")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${view === "myProposals"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FaLightbulb className="inline mr-2" /> My Proposals
            </button>
          </nav>
        </div>

        {view === "bank" ? (
          <div>
            <input
              type="text"
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjectBank.length > 0 ? (
                filteredProjectBank.map((p) => (
                  <ProjectBankCard key={p._id} project={p} />
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                  <p className="text-gray-500 text-lg mb-4">
                    {searchTerm ? "No projects match your search." : "No approved projects are available yet."}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {!searchTerm && "Be the first to propose a project by clicking the button above!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {myProposals.length > 0 ? (
              myProposals.map((p) => (
                <MyProposalCard
                  key={p._id}
                  project={p}
                  onWithdraw={handleWithdraw}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg mb-4">
                  You haven&apos;t proposed any projects yet.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Start by proposing a project that interests you or your team!
                </p>
                <button
                  onClick={openModalForCreate}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
                >
                  <FaPlus className="mr-2" /> Propose Your First Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModalAndReset}
        title={editingProject ? "Edit Your Proposal" : "Propose a New Project"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title}
            onChange={handleFormChange}
            placeholder="Project Title"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            placeholder="Detailed Description"
            className="w-full p-2 border rounded h-32"
            required
          />
          <input
            name="category"
            value={formData.category}
            onChange={handleFormChange}
            placeholder="Category (e.g., Web Development, AI/ML)"
            className="w-full p-2 border rounded"
            required
          />

          {actionMessage.text && (
            <p
              className={`text-sm ${actionMessage.type === "error"
                  ? "text-red-600"
                  : "text-green-600"
                }`}
            >
              {actionMessage.text}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModalAndReset}
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
              ) : editingProject ? (
                "Update Proposal"
              ) : (
                "Submit Proposal"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
