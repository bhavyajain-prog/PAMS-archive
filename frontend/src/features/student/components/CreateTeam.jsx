import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "../../../services/axios";
import { FaCopy, FaSpinner, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

// Custom styles for react-select
const selectStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#d1d5db",
    "&:hover": {
      borderColor: "var(--pams-primary)", // primary/30
    },
    boxShadow: "none",
    borderRadius: "0.5rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--pams-primary)" // primary
      : state.isFocused
      ? "var(--pams-primary-subtle)" // primary-subtle
      : "white",
    color: state.isSelected ? "white" : "#1f2937",
  }),
};

export default function CreateTeam() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedMentors, setSelectedMentors] = useState([null, null, null]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamCreated, setTeamCreated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, mentorRes] = await Promise.all([
        axios.get("/common/project-bank"),
        axios.get("/common/mentors"),
      ]);
      setProjects(projectRes.data || []);
      setMentors(
        mentorRes.data.map((m) => ({
          value: m._id,
          label: `${m.name} (${m.email})`,
        })) || []
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load required data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProjectSelect = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        if (prev.length < 2) {
          return [...prev, projectId];
        }
        return prev; // Max 2 projects
      }
    });
  };

  const handleMentorSelect = (selectedOption, index) => {
    const newSelectedMentors = [...selectedMentors];
    newSelectedMentors[index] = selectedOption;
    setSelectedMentors(newSelectedMentors);
  };

  const getAvailableMentors = (currentIndex) => {
    const selectedMentorIds = selectedMentors
      .map((m, i) => (m && i !== currentIndex ? m.value : null))
      .filter(Boolean);
    return mentors.filter((m) => !selectedMentorIds.includes(m.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProjects.length === 0) {
      alert("Please select at least one project.");
      return;
    }
    if (selectedMentors.some((m) => m === null)) {
      alert("Please select three mentors.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      projectChoices: selectedProjects,
      mentorChoices: selectedMentors.map((m) => m.value),
    };

    try {
      const response = await axios.post("/common/create-team", payload);
      setTeamCreated(response.data.team);
      console.log("Team created successfully:", response.data.team);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamCreated.code);
    // alert("Team code copied to clipboard!");
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center text-center p-4">
        <FaInfoCircle className="text-4xl text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-primary-subtle0 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (teamCreated) {
    return (
      <div className="bg-surface-alt py-12">
        <div className="max-w-2xl mx-auto bg-surface p-8 rounded-xl shadow-lg text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-heading mb-2">
            Team Created Successfully!
          </h2>
          <p className="text-body mb-6">
            Your team is ready. Share this code with your members to let them
            join.
          </p>
          <div className="mb-6">
            <p className="text-lg font-semibold text-body">
              Your Team Code:
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 bg-primary-subtle p-4 rounded-lg border-2 border-dashed border-primary/20">
              <span className="text-3xl font-mono font-bold text-primary tracking-widest">
                {teamCreated.code}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 text-muted hover:text-primary hover:bg-primary-subtle rounded-full transition"
              >
                <FaCopy className="text-xl" />
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              navigate("/home");
              window.location.reload();
            }}
            className="w-full bg-primary-subtle0 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary transition-transform transform hover:-translate-y-1 shadow-md"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-alt py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-heading tracking-tight">
            Create Your Project Team
          </h1>
          <p className="mt-3 text-lg text-body">
            Choose your projects and preferred mentors to get started.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-surface p-8 rounded-2xl shadow-lg space-y-10"
        >
          {/* Project Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-heading border-b pb-2">
              1. Select Projects (1 or 2)
            </h2>
            <input
              type="text"
              placeholder="Search projects by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-edge rounded-lg focus:ring-2 focus:ring-primary/40"
            />
            <div className="max-h-80 overflow-y-auto p-3 bg-surface-alt rounded-lg border space-y-3">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedProjects.includes(project._id)
                        ? "bg-primary-subtle border-2 border-primary/40 shadow-md"
                        : "bg-surface border border-edge hover:bg-primary-subtle"
                    }`}
                    onClick={() => handleProjectSelect(project._id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedProjects.includes(project._id)}
                        className="h-5 w-5 text-primary border-edge rounded focus:ring-primary/40 mr-4"
                      />
                      <div>
                        <h4 className="font-bold text-heading">
                          {project.title}
                        </h4>
                        <p className="text-sm text-body">
                          {project.description}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Category: {project.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-4">
                  No projects found.
                </p>
              )}
            </div>
          </div>

          {/* Mentor Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-heading border-b pb-2">
              2. Select Mentors (3 choices)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label className="block text-sm font-bold text-body mb-2">
                    Choice {index + 1}
                  </label>
                  <Select
                    value={selectedMentors[index]}
                    options={getAvailableMentors(index)}
                    onChange={(option) => handleMentorSelect(option, index)}
                    styles={selectStyles}
                    placeholder="Select a mentor..."
                    isClearable
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submission */}
          <div className="pt-6 border-t text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-primary-subtle0 text-white font-bold py-3 px-12 rounded-lg hover:bg-primary transition-transform transform hover:-translate-y-1 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin inline-block" />
              ) : (
                "Create Team & Get Code"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
