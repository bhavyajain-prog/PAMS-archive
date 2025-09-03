import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright Section */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-300">
              © {new Date().getFullYear()} Computer Science and Engineering
              Department, SKIT
            </p>
            <p className="text-xs text-gray-400 mt-1">
              All rights reserved. PAMS (Project Allocation and Management
              System).
            </p>
          </div>

          {/* Developer Info / About Section */}
          <div className="flex items-center space-x-4">
            <Link
              to="/about-us"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 group"
            >
              <FaGithub className="text-lg" />
              <span className="text-sm">About Developer</span>
              <FaExternalLinkAlt className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-4 pt-4">
          <p className="text-center text-xs text-gray-400">
            Built with React & Node.js | Designed for academic project
            management
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
