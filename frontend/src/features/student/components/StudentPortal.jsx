import { Link } from "react-router-dom";
import {
  FaUsers,
  FaPlus,
  FaSignInAlt,
  FaClipboardList,
  FaTachometerAlt,
  FaFileUpload,
  FaSpinner,
  FaBook,
} from "react-icons/fa";
import { useAuth } from "../../../contexts/AuthContext";
import Loading from "../../../components/Loading";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
};

// Reusable Action Card with description
function StudentActionCard({ to, title, description, icon, disabled = false }) {
  const content = (
    <>
      <div className="text-5xl text-primary mb-5 group-hover:text-primary transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-heading text-center">{title}</h3>
      <p className="text-sm text-muted mt-2 text-center px-2">
        {description}
      </p>
    </>
  );

  if (disabled) {
    return (
      <div className="group flex flex-col items-center justify-start text-center p-6 bg-surface-alt rounded-2xl shadow-inner cursor-not-allowed opacity-60 h-full">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-start text-center p-6 bg-surface rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full"
    >
      {content}
    </Link>
  );
}

export default function StudentPortal() {
  const { user, loading } = useAuth();

  if (loading || !user || (user.role === "student" && !user.studentData)) {
    return <Loading />;
  }

  // For students, also check if studentData is fully loaded
  if (user.role === "student" && !user.studentData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-3 text-lg text-body">Loading student data...</p>
      </div>
    );
  }

  const isInTeam = !!user?.studentData?.currentTeam;
  const isTeamLeader =
    String(user?._id) === String(user?.studentData?.currentTeam?.leader?._id);

  return (
    <div className="bg-base min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-heading tracking-tight">
            Student Portal
          </h1>
          <p className="mt-4 text-xl text-body max-w-3xl mx-auto">
            Welcome,{" "}
            <span className="font-semibold text-primary">
              {toTitleCase(user?.name).split(" ")[0] || "Student"}
            </span>
            ! Here&apos;s your command center for project success.
          </p>
        </header>

        {isInTeam ? (
          // VIEW FOR STUDENTS IN A TEAM
          <div>
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-subtle rounded-md border border-primary/20 shadow-sm">
                <span className="text-sm text-primary font-medium">
                  Team Code:
                </span>
                <span className="font-mono font-bold text-primary bg-surface px-1.5 py-0.5 rounded text-sm">
                  {user.studentData?.currentTeam?.code}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StudentActionCard
                to="/my-team"
                title="My Team"
                description="View your team members, project details, and progress."
                icon={<FaUsers />}
              />
              <StudentActionCard
                to="/team-details"
                title="Manage Team"
                description="Leader-only: Finalize team details and preferences."
                icon={<FaClipboardList />}
                disabled={!isTeamLeader}
              />
              <StudentActionCard
                to="/view-scores"
                title="View Score"
                description="Check your current project scores and feedback from mentors."
                icon={<FaTachometerAlt />}
              />
              <StudentActionCard
                to="/weekly-status-matrix"
                title="Weekly Status Matrix"
                description="Submit your team's weekly progress report and evaluation matrix."
                icon={<FaFileUpload />}
              />
              <StudentActionCard
                to="/team/documents"
                title="Upload Documents"
                description="Upload and manage team project documents (PDFs only). Leader can upload, all can view."
                icon={<FaFileUpload />}
              />
              <StudentActionCard
                to="/project-bank"
                title="Project Bank"
                description="Browse the project bank, see your proposals, or propose a new idea."
                icon={<FaBook />}
              />
            </div>
          </div>
        ) : (
          // VIEW FOR STUDENTS NOT IN A TEAM
          <div>
            <div className="text-center mb-12 p-6 bg-surface rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-heading">
                Let&apos;s Get You Started!
              </h2>
              <p className="mt-2 text-body">
                You&apos;re not part of a team yet. Join an existing team or
                create a new one to begin your project journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StudentActionCard
                to="/join-team"
                title="Join a Team"
                description="Use a team code to join an existing team and meet your new colleagues."
                icon={<FaSignInAlt />}
              />
              <StudentActionCard
                to="/create-team"
                title="Create a Team"
                description="Take the lead! Form a new team and invite your classmates to collaborate."
                icon={<FaPlus />}
              />
              <StudentActionCard
                to="/project-bank"
                title="Project Bank"
                description="Browse the project bank, see your proposals, or propose a new idea."
                icon={<FaBook />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
