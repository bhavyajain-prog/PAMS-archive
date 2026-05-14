import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import Loading from "../../../components/Loading";
import {
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaEdit,
  FaEye,
  FaFileAlt,
  FaTasks,
} from "react-icons/fa";

// Status badge component
function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-alt text-body border border-edge">
        <FaClock className="w-3 h-3" />
        Not Started
      </span>
    );
  }

  const statusConfig = {
    draft: {
      icon: FaClock,
      classes: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Draft",
    },
    submitted: {
      icon: FaClock,
      classes: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Submitted",
    },
    mentor_approved: {
      icon: FaCheckCircle,
      classes: "bg-green-100 text-green-800 border-green-200",
      label: "Mentor Approved",
    },
    admin_approved: {
      icon: FaCheckCircle,
      classes: "bg-green-100 text-green-800 border-green-200",
      label: "Admin Approved",
    },
    rejected: {
      icon: FaExclamationTriangle,
      classes: "bg-red-100 text-red-800 border-red-200",
      label: "Rejected",
    },
  };

  const config = statusConfig[status] || statusConfig.draft;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <IconComponent className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Form card component
function FormCard({
  title,
  description,
  status,
  submittedAt,
  submittedBy,
  linkTo,
  icon: IconComponent,
}) {
  const canEdit = !status || status === "draft" || status === "rejected";

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-edge p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-subtle rounded-lg">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-heading">{title}</h3>
            <p className="text-sm text-body">{description}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {submittedAt && (
        <div className="mb-4 p-3 bg-surface-alt rounded-lg">
          <p className="text-xs text-body">
            <strong>Last updated:</strong>{" "}
            {new Date(submittedAt).toLocaleDateString()} at{" "}
            {new Date(submittedAt).toLocaleTimeString()}
          </p>
          {submittedBy && (
            <p className="text-xs text-body mt-1">
              <strong>Updated by:</strong>{" "}
              {submittedBy.name || submittedBy.email}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {canEdit ? (
          <Link
            to={linkTo}
            className="flex items-center gap-2 px-4 py-2 bg-primary-subtle0 hover:bg-primary text-white rounded-lg font-medium transition-colors"
          >
            <FaEdit className="w-4 h-4" />
            {status ? "Edit" : "Create"}
          </Link>
        ) : (
          <Link
            to={linkTo}
            className="flex items-center gap-2 px-4 py-2 bg-surface-alt0 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <FaEye className="w-4 h-4" />
            View
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TeamDetails() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [team, setTeam] = useState(null);
  const [projectAbstract, setProjectAbstract] = useState(null);
  const [roleSpecification, setRoleSpecification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch team data and form statuses in parallel
        const [teamRes, paRes, rsRes] = await Promise.all([
          axios.get("/team/my-team"),
          axios.get("/team/project-abstract/status"),
          axios.get("/team/role-specification/status"),
        ]);

        setTeam(teamRes.data.team);
        setProjectAbstract(paRes.data.projectAbstract);
        setRoleSpecification(rsRes.data.roleSpecification);
      } catch (err) {
        console.error("Error fetching team details:", err);
        setError(err.response?.data?.message || "Failed to load team details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">
                Error loading team details
              </p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-base p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">No team found</p>
            </div>
            <p className="text-yellow-700 mt-1">
              You need to be part of a team to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">

          <div className="bg-surface rounded-xl shadow-sm border border-edge p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-heading mb-2">
                  Team Management
                </h1>
                <p className="text-body">
                  Manage your team&apos;s project documentation and role
                  assignments
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-subtle rounded-lg border border-primary/20">
                  <FaUsers className="w-4 h-4 text-primary" />
                  <span className="font-medium text-heading">Team Code:</span>
                  <span className="font-mono font-bold text-primary">
                    {team.code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-8">
          <div className="bg-surface rounded-xl shadow-sm border border-edge p-6">
            <h2 className="text-xl font-semibold text-heading mb-4">
              Documentation Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
                <div className="flex items-center gap-3">
                  <FaFileAlt className="w-5 h-5 text-primary" />
                  <span className="font-medium text-body">
                    Project Abstract
                  </span>
                </div>
                <StatusBadge status={projectAbstract?.status} />
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
                <div className="flex items-center gap-3">
                  <FaTasks className="w-5 h-5 text-primary" />
                  <span className="font-medium text-body">
                    Role Specification
                  </span>
                </div>
                <StatusBadge status={roleSpecification?.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Form Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FormCard
            title="Project Abstract"
            description="Define your project's technical details, tools, and modules"
            status={projectAbstract?.status}
            submittedAt={projectAbstract?.submittedAt}
            submittedBy={projectAbstract?.submittedBy}
            linkTo="/project-abstract"
            icon={FaFileAlt}
          />

          <FormCard
            title="Role Specification"
            description="Assign roles, modules, and activities to team members"
            status={roleSpecification?.status}
            submittedAt={roleSpecification?.submittedAt}
            submittedBy={roleSpecification?.submittedBy}
            linkTo="/role-specification"
            icon={FaTasks}
          />
        </div>

        {/* Team Information */}
        <div className="mt-8">
          <div className="bg-surface rounded-xl shadow-sm border border-edge p-6">
            <h2 className="text-xl font-semibold text-heading mb-4">
              Team Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-body mb-2">Team Leader</h3>
                <div className="p-3 bg-surface-alt rounded-lg">
                  <p className="font-medium text-heading">
                    {team.leader?.name}
                  </p>
                  <p className="text-sm text-body">{team.leader?.email}</p>
                  <p className="text-xs text-muted">
                    {team.leader?.studentData?.rollNumber} •{" "}
                    {team.leader?.studentData?.department}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-body mb-2">Team Members</h3>
                <div className="space-y-2">
                  {team.members?.map((member, index) => (
                    <div key={index} className="p-3 bg-surface-alt rounded-lg">
                      <p className="font-medium text-heading">
                        {member.student?.name}
                      </p>
                      <p className="text-sm text-body">
                        {member.student?.email}
                      </p>
                      <p className="text-xs text-muted">
                        {member.student?.studentData?.rollNumber} •{" "}
                        {member.student?.studentData?.department}
                      </p>
                    </div>
                  ))}
                  {(!team.members || team.members.length === 0) && (
                    <p className="text-muted italic">
                      No additional members
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
