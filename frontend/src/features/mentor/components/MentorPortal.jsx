import { Link } from "react-router-dom";
import {
  FaUsers,
  FaTachometerAlt,
  FaClipboardCheck,
  FaSpinner,
  FaChartLine,
  FaComments,
} from "react-icons/fa";
import { useAuth } from "../../../contexts/AuthContext";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
};

// Reusable Action Card with description
function MentorActionCard({ to, title, description, icon, disabled = false }) {
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

export default function MentorPortal() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-3 text-lg text-body">Loading your portal...</p>
      </div>
    );
  }

  return (
    <div className="bg-base min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-heading tracking-tight">
            Mentor Portal
          </h1>
          <p className="mt-4 text-xl text-body max-w-3xl mx-auto">
            Welcome,{" "}
            <span className="font-semibold text-primary">
              {toTitleCase(user?.name) || "Mentor"}
            </span>
            ! Guide your teams to project success with these essential tools.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <MentorActionCard
            to="/mentor/dashboard"
            title="Dashboard"
            description="Get an overview of all team activities, progress reports, and key metrics."
            icon={<FaTachometerAlt />}
          />
          <MentorActionCard
            to="/mentor/team-selection"
            title="Team Selection"
            description="View and manage your assigned teams, monitor their progress, and provide guidance."
            icon={<FaUsers />}
          />
          <MentorActionCard
            to="/mentor/document-approval"
            title="Document Review"
            description="Review and approve team submissions, project documents, and deliverables."
            icon={<FaClipboardCheck />}
          />
          <MentorActionCard
            to="/mentor/document-review"
            title="PDF Documents"
            description="View and track PDF document submissions from your assigned teams."
            icon={<FaClipboardCheck />}
          />
          <MentorActionCard
            to="/mentor/progress-tracking"
            title="Progress Tracking"
            description="Monitor weekly progress reports and track team development over time."
            icon={<FaChartLine />}
          />
          <MentorActionCard
            to="/mentor/feedback"
            title="Feedback Center"
            description="Provide constructive feedback and communicate with your teams effectively."
            icon={<FaComments />}
            disabled={true}
          />
        </div>

        {/* Additional info section */}
        <div className="mt-16 text-center">
          <div className="bg-surface backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
            <h3 className="text-2xl font-bold text-heading mb-4">
              Mentorship Guidelines
            </h3>
            <p className="text-body max-w-2xl mx-auto">
              As a mentor, you play a crucial role in guiding teams through
              their project journey. Use these tools to stay connected, provide
              timely feedback, and help students achieve their goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
