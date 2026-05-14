import { useState, useRef } from "react"; // Added useRef
import axios from "../../../services/axios";
import { FaUpload, FaSpinner } from "react-icons/fa"; // Added FaSpinner

// Reusable FileInput component for better styling
const FileInput = ({ id, onChange, accept, fileSelected, inputRef }) => (
  <label
    htmlFor={id}
    className={`w-full max-w-sm flex flex-col items-center px-4 py-5 bg-surface text-primary rounded-lg shadow-md tracking-wide border border-primary/30 cursor-pointer hover:bg-primary-subtle0 hover:text-white transition-all duration-150 ease-linear ${fileSelected ? "bg-primary-subtle border-primary" : ""
      }`}
  >
    <FaUpload className={"w-6 h-6 mb-2 text-primary"} />
    <span
      className={
        "mt-1 text-sm leading-normal truncate w-full text-center font-medium text-primary"
      }
    >
      {fileSelected ? fileSelected.name : "Select a file"}
    </span>
    <input
      ref={inputRef}
      id={id}
      type="file"
      className="hidden"
      accept={accept}
      onChange={onChange}
    />
  </label>
);

export default function AdminUpload() {
  const [studentFile, setStudentFile] = useState(null);
  const [mentorFile, setMentorFile] = useState(null);
  const [projectFile, setProjectFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false); // New state for loading overlay
  const [uploadingType, setUploadingType] = useState(""); // To show which type is uploading

  // Refs for file inputs to allow programmatic clearing
  const studentFileRef = useRef(null);
  const mentorFileRef = useRef(null);
  const projectFileRef = useRef(null);

  const handleFileChange = (setter) => (event) => {
    const file = event.target.files[0];
    if (file) {
      setter(file);
    }
    setMessage("");
    setError("");
  };

  const handleUpload = async (file, type, successMessage, fileRef) => {
    if (!file) {
      setError(`Please select a ${type} file to upload.`);
      setMessage("");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadingType(type);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(`/admin/upload/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Create detailed success message
      let message = response.data.message || successMessage;
      if (response.data.count !== undefined) {
        message += ` (${response.data.count} processed`;
        if (response.data.total && response.data.skipped) {
          message += `, ${response.data.skipped} skipped out of ${response.data.total} total`;
        }
        message += ")";
      }

      setMessage(message);

      // Clear the file state and input
      if (type === "students") {
        setStudentFile(null);
      } else if (type === "mentors") {
        setMentorFile(null);
      } else if (type === "projects") {
        setProjectFile(null);
      }

      // Clear the actual file input
      if (fileRef && fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (err) {
      console.error(`Error uploading ${type} data:`, err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        `Failed to upload ${type} data. Please try again.`
      );
    } finally {
      setIsUploading(false);
      setUploadingType("");
    }
  };
  const UploadSection = ({
    title,
    onFileChange,
    onUpload,
    fileType,
    fileRef,
    currentFileState,
  }) => (
    <div className="bg-surface p-6 rounded-xl shadow-lg w-full max-w-md mx-auto">
      <h3 className="text-lg sm:text-xl font-semibold text-heading mb-4 text-center">
        {title}
      </h3>
      <div className="flex flex-col items-center gap-3">
        {" "}
        <FileInput
          id={`${fileType}-file-input`}
          onChange={onFileChange}
          accept=".xlsx, .csv"
          fileSelected={currentFileState}
          inputRef={fileRef}
        />
        <button
          onClick={onUpload}
          disabled={!currentFileState || isUploading} // Disable if no file or already uploading
          className="w-full px-4 py-2.5 bg-primary-subtle0 text-white text-sm font-medium rounded-md hover:bg-primary transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isUploading && uploadingType === fileType ? (
            <>
              <FaSpinner className="animate-spin mr-2 w-4 h-4" /> Uploading...
            </>
          ) : (
            <>
              <FaUpload className="mr-2 w-4 h-4" /> Upload{" "}
              {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-base min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Loading Overlay - covers the whole page content area */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <FaSpinner className="animate-spin text-white text-6xl mb-4" />
          <p className="text-white text-2xl">
            Uploading {uploadingType} data...
          </p>
        </div>
      )}{" "}
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-heading">
            Admin Data Upload
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-body max-w-2xl mx-auto px-4">
            Upload student, mentor, and project bank data using .xlsx or .csv
            files.
          </p>
        </header>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 border border-green-300 rounded-lg shadow-sm text-center mx-4">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg shadow-sm text-center mx-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
          <UploadSection
            title="Upload Student Data"
            fileType="students"
            currentFileState={studentFile}
            onFileChange={handleFileChange(setStudentFile, "students")}
            onUpload={() =>
              handleUpload(
                studentFile,
                "students",
                "Student data uploaded successfully!",
                studentFileRef
              )
            }
            fileRef={studentFileRef}
          />
          <UploadSection
            title="Upload Mentor Data"
            fileType="mentors"
            currentFileState={mentorFile}
            onFileChange={handleFileChange(setMentorFile, "mentors")}
            onUpload={() =>
              handleUpload(
                mentorFile,
                "mentors",
                "Mentor data uploaded successfully!",
                mentorFileRef
              )
            }
            fileRef={mentorFileRef}
          />
          <UploadSection
            title="Upload Project Bank Data"
            fileType="projects"
            currentFileState={projectFile}
            onFileChange={handleFileChange(setProjectFile, "projects")}
            onUpload={() =>
              handleUpload(
                projectFile,
                "projects",
                "Project bank uploaded successfully!",
                projectFileRef
              )
            }
            fileRef={projectFileRef}
          />
        </div>
      </div>
    </div>
  );
}
