import { useState } from "react";
import axios from "../../../services/axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cpass, setCpass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages

    if (password !== cpass) {
      setError("Passwords do not match");
      return;
    }
    try {
      const { data } = await axios.post("/auth/register", {
        name,
        username,
        password,
        role,
        email,
        phone,
      });
      // Assuming backend returns a `success` boolean and a `message`
      if (data.success) {
        setSuccess(data.message || "Registration successful!");
        // Optionally clear form fields here
        setName("");
        setEmail("");
        setPhone("");
        setRole("");
        setUsername("");
        setPassword("");
        setCpass("");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. An unexpected error occurred.");
      }
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-input border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-heading";

  return (
    <div className="flex items-center justify-center px-4 mt-5">
      <div className="w-150 bg-surface backdrop-blur-md p-8 rounded-lg shadow-md border border-edge">
        <h2 className="text-2xl font-bold text-center text-heading mb-6">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-body mb-1">Username:</label>
            <input
              type="text"
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">Name:</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">Email:</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">Phone:</label>
            <input
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">Password:</label>
            <input
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">
              Confirm Password:
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={cpass}
              onChange={(e) => setCpass(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-body mb-1">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className={inputClasses}
            >
              <option value="">Select a role</option>
              <option value="student">Student</option>
              <option value="coordinator">Project Coordinator</option>
              <option value="mentor">Mentor</option>
              <option value="sub-admin">Lab Coordinator</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-md shadow transition duration-200"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
