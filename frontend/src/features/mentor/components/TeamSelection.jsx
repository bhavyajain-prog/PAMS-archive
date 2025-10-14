import { useState, useEffect } from "react";
import axios from "../../../services/axios";
import {
  FaUsers,
  FaProjectDiagram,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaUserGraduate,
  FaEnvelope,
  FaIdCard,
} from "react-icons/fa";

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

// Team Details Modal
const TeamDetailsModal = ({ isOpen, onClose, team, onAccept, onReject }) => {
  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Team Details: ${team.code || team._id}`}
      size="xl"
    >
      <div className="space-y-8">
        {/* Team Leader */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUserGraduate className="mr-2 text-teal-600" />
            Team Leader
          </h4>
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaUserGraduate className="mr-1" />
                  Name
                </p>
                <p className="font-medium">{team.leader?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaIdCard className="mr-1" />
                  ID
                </p>
                <p className="font-medium">{team.leader?._id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaEnvelope className="mr-1" />
                  Email
                </p>
                <p className="font-medium">{team.leader?.email || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUsers className="mr-2 text-teal-600" />
            Team Members ({team.members?.length || 0})
          </h4>
          {team.members && team.members.length > 0 ? (
            <div className="space-y-3">
              {team.members.map((member, index) => (
                <div
                  key={member._id || index}
                  className="bg-gray-50 p-4 rounded-lg border"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FaUserGraduate className="mr-1" />
                        Name
                      </p>
                      <p className="font-medium">{member.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FaIdCard className="mr-1" />
                        ID
                      </p>
                      <p className="font-medium">{member._id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FaEnvelope className="mr-1" />
                        Email
                      </p>
                      <p className="font-medium">{member.email || "N/A"}</p>
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

        {/* Project Choices */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaProjectDiagram className="mr-2 text-teal-600" />
            Project Choices ({team.projectChoices?.length || 0})
          </h4>
          {team.projectChoices && team.projectChoices.length > 0 ? (
            <div className="space-y-4">
              {team.projectChoices.map((project, index) => (
                <div
                  key={project._id || index}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800">
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <button
            onClick={() => onAccept(team)}
            className="flex-1 min-w-fit bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            Accept Team
          </button>
          <button
            onClick={() => onReject(team)}
            className="flex-1 min-w-fit bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            <FaTimesCircle className="mr-2" />
            Reject Team
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Accept Team Modal
const AcceptTeamModal = ({ isOpen, onClose, team, onSubmit }) => {
  const [selectedProject, setSelectedProject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  if (!team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(team._id, selectedProject, feedback);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Accept Team: ${team.code || team._id}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Final Project *
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          >
            <option value="">Choose a project from their choices</option>
            {team.projectChoices?.map((project, index) => (
              <option key={project._id} value={project._id}>
                Choice {index + 1}: {project.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows="4"
            placeholder="Provide feedback for the team..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Accept Team"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Reject Team Modal
const RejectTeamModal = ({ isOpen, onClose, team, onSubmit }) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  if (!team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(team._id, feedback);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Team: ${team.code || team._id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows="4"
            placeholder="Provide reason for rejection..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Reject Team"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Team Card Component
const TeamCard = ({ team, onOpenDetails, onAccept, onReject }) => {
  const totalMembers = 1 + (team.members?.length || 0); // +1 for leader

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 border border-gray-100 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-700 transition-colors">
            Team Code: {team.code || team._id}
          </h3>
          <div className="bg-teal-50 px-3 py-2 rounded-lg border border-teal-200">
            <p className="text-sm text-teal-700 font-medium">
              <span className="font-semibold">Leader:</span>{" "}
              {team.leader?.name || "N/A"}
            </p>
            <p className="text-xs text-teal-600">
              {team.leader?.email || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUsers className="mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Team Size:
              </span>
            </div>
            <span className="font-bold text-gray-800">{totalMembers}</span>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaProjectDiagram className="mr-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Projects:
              </span>
            </div>
            <span className="font-bold text-blue-700">
              {team.projectChoices?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Project Choices Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Project Choices:
        </h4>
        {team.projectChoices && team.projectChoices.length > 0 ? (
          <div className="space-y-2">
            {team.projectChoices.slice(0, 2).map((project, index) => (
              <div key={project._id} className="bg-gray-50 p-2 rounded border">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {index + 1}. {project.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {project.category}
                </p>
              </div>
            ))}
            {team.projectChoices.length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{team.projectChoices.length - 2} more...
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">
            No projects selected
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onOpenDetails(team)}
          className="flex-1 min-w-fit bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <FaInfoCircle className="mr-2" />
          View Details
        </button>
        <button
          onClick={() => onAccept(team)}
          className="flex-1 min-w-fit bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <FaCheckCircle className="mr-2" />
          Accept
        </button>
        <button
          onClick={() => onReject(team)}
          className="flex-1 min-w-fit bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <FaTimesCircle className="mr-2" />
          Reject
        </button>
      </div>
    </div>
  );
};

export default function TeamSelection() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/common/teams");
      setTeams(response.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
      if (error.response?.status === 404) {
        setTeams([]);
      } else {
        alert(
          "Error fetching teams: " +
          (error.response?.data?.message || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTeam = async (teamId, finalProject, feedback) => {
    try {
      const { data } = await axios.post("/common/accept-team", {
        teamId,
        finalProject,
        feedback,
      });
      console.log(data);

      alert("Team accepted successfully!");
      setShowAcceptModal(null);
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error("Error accepting team:", error);
      alert(
        "Error accepting team: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleRejectTeam = async (teamId, feedback) => {
    try {
      await axios.post("/common/reject-team", {
        teamId,
        feedback,
      });
      alert("Team rejected successfully!");
      setShowRejectModal(null);
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting team:", error);
      alert(
        "Error rejecting team: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

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
                  Team Selection
                </h1>
                <p className="text-gray-600">
                  Choose teams that have selected you as their mentor preference
                </p>
              </div>
            </div>
            <div className="bg-teal-50 px-6 py-3 rounded-lg border border-teal-200">
              <p className="text-sm text-gray-600 mb-1">Available Teams</p>
              <p className="text-2xl font-bold text-teal-700">{teams.length}</p>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FaUsers className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              No Teams Available
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              There are currently no teams that have selected you as their
              mentor preference. Teams will appear here once they choose you in
              their mentor preferences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {teams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                onOpenDetails={(team) => setShowDetailsModal(team)}
                onAccept={(team) => setShowAcceptModal(team)}
                onReject={(team) => setShowRejectModal(team)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <TeamDetailsModal
          isOpen={!!showDetailsModal}
          onClose={() => setShowDetailsModal(null)}
          team={showDetailsModal}
          onAccept={(team) => {
            setShowDetailsModal(null);
            setShowAcceptModal(team);
          }}
          onReject={(team) => {
            setShowDetailsModal(null);
            setShowRejectModal(team);
          }}
        />

        <AcceptTeamModal
          isOpen={!!showAcceptModal}
          onClose={() => setShowAcceptModal(null)}
          team={showAcceptModal}
          onSubmit={handleAcceptTeam}
        />

        <RejectTeamModal
          isOpen={!!showRejectModal}
          onClose={() => setShowRejectModal(null)}
          team={showRejectModal}
          onSubmit={handleRejectTeam}
        />
      </div>
    </div>
  );
}
