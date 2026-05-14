import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useAuth } from "../../../contexts/AuthContext";

export default function ResetPassword() {
  const [newPass, setNewPass] = useState("");
  const [cPass, setCPass] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const { user, setUser } = useAuth();

  const firstLogin = location.state?.firstLogin;
  const userRole = location.state?.userRole || user?.role;

  useEffect(() => {
    if (firstLogin) {
      setMessage("This is your first login. Please set your new password.");
    }
  }, [firstLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPass !== cPass) {
      setError("Passwords do not match!");
      return;
    }

    if (newPass.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      if (firstLogin) {
        const res = await axios.put("/auth/me/password", {
          newPassword: newPass,
        });
        setMessage(res.data.message || "Password updated successfully!");
        if (user) {
          setUser({ ...user, firstLogin: false });
        }
        setTimeout(() => {
          if (userRole === "admin" || userRole === "sub-admin") {
            navigate("/admin/home");
          } else if (userRole === "mentor") {
            navigate("/mentor/home");
          } else if (userRole === "student") {
            navigate("/home");
          } else {
            navigate("/");
          }
        }, 2000);
      } else if (token) {
        const res = await axios.post(`/auth/reset-password/${token}`, {
          newPassword: newPass,
        });
        setMessage(
          res.data.message ||
            "Password has been reset successfully. You can now login."
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(
          "Invalid request. No token provided and not a first login scenario."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base px-4 py-12">
      <div className="w-full max-w-md bg-surface backdrop-blur-md p-8 rounded-lg shadow-xl border border-edge">
        <h2 className="text-3xl font-bold text-center text-heading mb-6">
          {firstLogin ? "Set Your Password" : "Reset Password"}
        </h2>

        {message && (
          <p className="text-green-500 bg-green-500/10 p-3 rounded-md text-center mb-4">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 bg-red-500/10 p-3 rounded-md text-center mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-body font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-4 py-3 bg-input border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-heading"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-body font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-3 bg-input border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-heading"
              value={cPass}
              onChange={(e) => setCPass(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-md shadow-md transition duration-150 ease-in-out"
          >
            {firstLogin ? "Set Password" : "Reset Password"}
          </button>
        </form>
        {!firstLogin && token && (
          <p className="text-center text-sm text-body mt-4">
            Remember your password?{" "}
            <a href="/login" className="text-primary hover:underline">
              Login
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
