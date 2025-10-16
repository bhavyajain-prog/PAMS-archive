import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import DevPortal from "./pages/DevPortal";
import AboutUs from "./pages/AboutUs";
import RoleBasedRoute from "./routing/RoleBasedRoute";
import "./App.css";

import Login from "./features/auth/components/Login";
import Register from "./features/auth/components/Register";
import ForgotPassword from "./features/auth/components/ForgotPassword";
import ResetPassword from "./features/auth/components/ResetPassword";

import StudentPortal from "./features/student/components/StudentPortal";
import CreateTeam from "./features/student/components/CreateTeam";
import MyTeam from "./features/student/components/MyTeam";
import JoinTeam from "./features/student/components/JoinTeam";
import ProposeProject from "./features/student/components/ProposeProject";
import TeamDetails from "./features/student/components/TeamDetails";
import DocumentUpload from "./features/student/components/DocumentUpload";
import ViewScore from "./features/student/components/ViewScore";

import MentorPortal from "./features/mentor/components/MentorPortal";
import TeamSelection from "./features/mentor/components/TeamSelection";
import MentorDocumentReview from "./features/mentor/components/MentorDocumentReview";

import AdminPortal from "./features/admin/components/AdminPortal";
import AdminUpload from "./features/admin/components/AdminUpload";
import ManageTeams from "./features/admin/components/ManageTeams";
import ManageMentors from "./features/admin/components/ManageMentors";
import ManageStudents from "./features/admin/components/ManageStudents";
import ManageProjects from "./features/admin/components/ManageProjects";
import FormApproval from "./features/admin/components/FormApproval";
import ReviewDocs from "./features/admin/components/ReviewDocs";

import ProjectAbstractForm from "./features/forms/components/Form1";
import RoleSpecificationForm from "./features/forms/components/Form2";
import WeeklyStatusMatrix from "./features/forms/components/Form3";
import MentorDashboard from "./features/mentor/components/MentorDashboard";

const AppLayout = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === "/about-us";

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {/* Admin Routes */}
          <Route
            path="/admin/home"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <AdminPortal />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <AdminUpload />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/manage/teams"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManageTeams />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/manage/mentors"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManageMentors />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/manage/students"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManageStudents />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/manage/projects"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManageProjects />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/view-forms"
            element={
              <RoleBasedRoute roles={["admin", "sub-admin"]}>
                <FormApproval />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/doc-upload-status"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ReviewDocs />
              </RoleBasedRoute>
            }
          />
          {/* Student Routes */}
          <Route
            path="/home"
            element={
              <RoleBasedRoute roles={["student"]}>
                <StudentPortal />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/create-team"
            element={
              <RoleBasedRoute roles={["student"]}>
                <CreateTeam />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/join-team"
            element={
              <RoleBasedRoute roles={["student"]}>
                <JoinTeam />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/my-team"
            element={
              <RoleBasedRoute roles={["student"]}>
                <MyTeam />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/project-bank"
            element={
              <RoleBasedRoute roles={["student"]}>
                <ProposeProject />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/team-details"
            element={
              <RoleBasedRoute roles={["student"]}>
                <TeamDetails />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/team/documents"
            element={
              <RoleBasedRoute roles={["student"]}>
                <DocumentUpload />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/view-scores"
            element={
              <RoleBasedRoute roles={["student"]}>
                <ViewScore />
              </RoleBasedRoute>
            }
          />
          {/* Mentor Routes */}
          <Route
            path="/mentor/home"
            element={
              <RoleBasedRoute roles={["mentor"]}>
                <MentorPortal />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/mentor/dashboard"
            element={
              <RoleBasedRoute roles={["mentor"]}>
                <MentorDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/mentor/team-selection"
            element={
              <RoleBasedRoute roles={["mentor"]}>
                <TeamSelection />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/mentor/document-approval"
            element={
              <RoleBasedRoute roles={["mentor", "sub-admin"]}>
                <FormApproval />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/mentor/document-review"
            element={
              <RoleBasedRoute roles={["mentor"]}>
                <MentorDocumentReview />
              </RoleBasedRoute>
            }
          />
          {/*Forms */}
          <Route
            path="/project-abstract"
            element={
              <RoleBasedRoute roles={["student"]}>
                <ProjectAbstractForm />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/role-specification"
            element={
              <RoleBasedRoute roles={["student"]}>
                <RoleSpecificationForm />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/weekly-status-matrix"
            element={
              <RoleBasedRoute roles={["student"]}>
                <WeeklyStatusMatrix />
              </RoleBasedRoute>
            }
          />
          {/* Developer Routes */}
          <Route
            path="/dev"
            element={
              <RoleBasedRoute roles={["dev"]}>
                <DevPortal />
              </RoleBasedRoute>
            }
          />
          {/* Util Routes */}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/notfound" element={<NotFound />} /> {/* Fallback */}
          <Route path="*" element={<Navigate to="/notfound" />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}
// TODO: Global variables for timing of particular stages
