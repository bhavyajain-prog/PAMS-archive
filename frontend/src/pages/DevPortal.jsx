import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSpinner,
  FaRoute,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
};

// Reusable Action Card with description
function DevActionCard({
  to,
  title,
  description,
  icon,
  disabled = false,
  external = false,
}) {
  const content = (
    <>
      <div className="text-5xl text-blue-500 mb-5 group-hover:text-blue-600 transition-colors duration-300">
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

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center justify-start text-center p-6 bg-surface rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full"
      >
        {content}
      </a>
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

export default function DevPortal() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <p className="ml-3 text-lg text-body">Loading dev portal...</p>
      </div>
    );
  }

  // Available routes organized by role
  const routes = {
    auth: [
      { path: "/login", name: "Login" },
      { path: "/register", name: "Register" },
      { path: "/forgot-password", name: "Forgot Password" },
      { path: "/reset-password", name: "Reset Password" },
    ],
    admin: [
      { path: "/admin/home", name: "Admin Portal" },
      { path: "/admin/upload", name: "Upload Data" },
      { path: "/admin/manage/teams", name: "Manage Teams" },
      { path: "/admin/manage/mentors", name: "Manage Mentors" },
      { path: "/admin/manage/students", name: "Manage Students" },
      { path: "/admin/manage/projects", name: "Manage Projects" },
    ],
    student: [
      { path: "/home", name: "Student Portal" },
      { path: "/create-team", name: "Create Team" },
      { path: "/join-team", name: "Join Team" },
      { path: "/my-team", name: "My Team" },
      { path: "/project-bank", name: "Project Bank" },
      { path: "/view-scores", name: "View Scores" },
      { path: "/team-details", name: "Team Details" },
      { path: "/team/documents", name: "Document Upload" },
    ],
    mentor: [
      { path: "/mentor/home", name: "Mentor Portal" },
      { path: "/mentor/team-selection", name: "Team Selection" },
    ],
    forms: [
      { path: "/project-abstract", name: "Project Abstract (Form 1)" },
      { path: "/role-specification", name: "Role Specification (Form 2)" },
      { path: "/weekly-status", name: "Weekly Status (Form 3)" },
    ],
    utility: [{ path: "/notfound", name: "Not Found Page" }],
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-heading tracking-tight">
            Developer Portal
          </h1>
          <p className="mt-4 text-xl text-body max-w-3xl mx-auto">
            Welcome,{" "}
            <span className="font-semibold text-blue-600">
              {toTitleCase(user?.name) || "Developer"}
            </span>
            ! Access all system components and monitor the entire application
            ecosystem.
          </p>
        </header>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <DevActionCard
            to="/admin/home"
            title="Admin Access"
            description="Access the admin portal to manage all system components and data."
            icon={<FaShieldAlt />}
          />
          <DevActionCard
            to="/home"
            title="Student View"
            description="Experience the application from a student's perspective."
            icon={<FaUserGraduate />}
          />
          <DevActionCard
            to="/mentor/home"
            title="Mentor Dashboard"
            description="View the mentor interface and team management tools."
            icon={<FaChalkboardTeacher />}
          />
        </div>

        {/* Routes Directory */}
        <div className="bg-surface/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
          <h3 className="text-2xl font-bold text-heading mb-6 flex items-center">
            <FaRoute className="mr-3 text-blue-600" />
            Application Routes
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(routes).map(([category, routeList]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-lg font-semibold text-body capitalize border-b pb-2">
                  {category} Routes
                </h4>
                <div className="space-y-2">
                  {routeList.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className="flex items-center justify-between p-3 bg-surface-alt hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
                    >
                      <span className="font-medium text-body group-hover:text-blue-700">
                        {route.name}
                      </span>
                      <code className="text-xs text-muted bg-surface px-2 py-1 rounded font-mono">
                        {route.path}
                      </code>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 p-6 rounded-xl">
            <p className="text-body">
              <strong>Developer Mode Active:</strong> You have access to all
              routes and can impersonate any user role. Use this access
              responsibly for testing and development purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
