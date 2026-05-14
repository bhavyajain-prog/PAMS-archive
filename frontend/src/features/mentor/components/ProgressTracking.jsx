import { useState, useEffect, useRef } from "react";
import axios from "../../../services/axios";
import {
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  BarChart3,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Filter,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";

const ProgressTracking = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch teams with weekly status data
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/common/mentor/teams-progress");
      setTeams(response.data.teams || []);

      // Auto-select first team
      if (response.data.teams && response.data.teams.length > 0) {
        setSelectedTeam(response.data.teams[0]._id);
      }
    } catch (err) {
      console.error("Error fetching progress data:", err);
      setError(err.response?.data?.message || "Failed to fetch progress data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  // Handle approve weekly status
  const handleApprove = async (teamId, submissionId, score, mentorComments) => {
    setActionLoading(`approve-${submissionId}`);
    try {
      // send score and optional comments
      const resp = await axios.put(`/team/${teamId}/weekly-status/${submissionId}/approve`, {
        score,
        mentorComments,
      });

      // Refresh data
      await fetchProgressData();
      return resp;
    } catch (err) {
      // Propagate error to caller so UI can show inline validation instead of global error
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject weekly status
  const handleReject = async (teamId, submissionId) => {
    try {
      setActionLoading(`reject-${submissionId}`);
      await axios.put(`/team/${teamId}/weekly-status/${submissionId}/reject`, {
        reason: rejectReason.trim() || null,
      });

      // Refresh data and close modal
      await fetchProgressData();
      setShowRejectModal(null);
      setRejectReason("");
      setError("");
    } catch (err) {
      console.error("Error rejecting weekly status:", err);
      setError(err.response?.data?.message || "Failed to reject weekly status");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle week expansion
  const toggleWeekExpansion = (weekId) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId);
    } else {
      newExpanded.add(weekId);
    }
    setExpandedWeeks(newExpanded);
  };

  // Handle file download
  const handleDownloadFile = async (teamId, week, filename) => {
    try {
      const response = await axios.get(
        `/team/${teamId}/weekly-status/${week}/download`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
    }
  };

  // Get status badge
  const StatusBadge = ({ status }) => {
    const configs = {
      submitted: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        text: "Pending Review",
      },
      mentor_approved: {
        color: "bg-primary-subtle text-heading border-primary/20",
        icon: CheckCircle,
        text: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
        text: "Needs Revision",
      },
    };

    const config = configs[status] || configs.submitted;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Weekly Status Card
  const WeeklyStatusCard = ({ weekData, teamId, teamMembers = [], teamLeader = null }) => {
    const isExpanded = expandedWeeks.has(weekData._id);
    const hasScore =
      weekData.mentorScore !== null && weekData.mentorScore !== undefined;
    const [scoreInput, setScoreInput] = useState(
      hasScore ? String(weekData.mentorScore) : ""
    );
    const [commentInput, setCommentInput] = useState(
      weekData.mentorComments || ""
    );
    const [scoreError, setScoreError] = useState("");
    const scoreRef = useRef(null);

    return (
      <div className="bg-surface rounded-lg shadow-md border border-edge overflow-hidden">
        {/* Week Header */}
        <div className="p-4 bg-primary-subtle border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-white rounded-lg px-4 py-2">
                <div className="text-xs font-medium">Week</div>
                <div className="text-2xl font-bold">{weekData.week}</div>
              </div>
              <div>
                <h3 className="font-semibold text-heading flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(weekData.dateRange.from).toLocaleDateString()} -{" "}
                    {new Date(weekData.dateRange.to).toLocaleDateString()}
                  </span>
                </h3>
                <p className="text-sm text-body mt-1">
                  Module: <span className="font-medium">{weekData.module}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Action Buttons - Show only if status is submitted */}
              {weekData.status === "submitted" && (
                <>
                  <button
                    onClick={async () => {
                      setScoreError("");
                      // client-side validation: require a score before approving
                      if (scoreInput === "" || scoreInput === null) {
                        setScoreError("Score is required before approving");
                        // scroll to score input
                        scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                      }

                      const numeric = Number(scoreInput);
                      if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
                        setScoreError("Score must be a number between 0 and 10");
                        scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                      }

                      try {
                        await handleApprove(teamId, weekData._id, numeric, commentInput);
                        setScoreError("");
                      } catch (err) {
                        const msg = err?.response?.data?.message;
                        if (msg) {
                          // show server validation inline
                          setScoreError(msg);
                          scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        } else {
                          setError(msg || "Failed to approve weekly status");
                        }
                      }
                    }}
                    disabled={actionLoading === `approve-${weekData._id}`}
                    className="flex items-center px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {actionLoading === `approve-${weekData._id}` ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3 h-3 mr-1.5" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setShowRejectModal({
                        id: weekData._id,
                        week: weekData.week,
                        module: weekData.module,
                      })
                    }
                    disabled={actionLoading === `reject-${weekData._id}`}
                    className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1.5" />
                    Reject
                  </button>
                </>
              )}
              <StatusBadge status={weekData.status} />
              {hasScore && (
                <div className="bg-primary-subtle text-heading rounded-lg px-3 py-2 border border-primary/20">
                  <div className="text-xs font-medium">Score</div>
                  <div className="text-lg font-bold">
                    {weekData.mentorScore}/10
                  </div>
                </div>
              )}
              <button
                onClick={() => toggleWeekExpansion(weekData._id)}
                className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-body" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-body" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Progress Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-heading mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                Progress Made
              </h4>
              <p className="text-body whitespace-pre-wrap">
                {weekData.progress}
              </p>
            </div>

            {/* Achievements Section */}
            <div className="bg-primary-subtle rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-heading mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-primary" />
                Achievements ({weekData.achievements?.length || 0})
              </h4>
              <ul className="space-y-2">
                {weekData.achievements?.map((achievement, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-body"
                  >
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Challenges Section */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-heading mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                Challenges ({weekData.challenges?.length || 0})
              </h4>
              <ul className="space-y-2">
                {weekData.challenges?.map((challenge, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-body"
                  >
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Student Remarks */}
            {weekData.studentRemarks && (
              <div className="bg-surface-alt rounded-lg p-4 border border-edge">
                <h4 className="font-semibold text-heading mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Student Remarks
                </h4>
                <p className="text-body whitespace-pre-wrap">
                  {weekData.studentRemarks}
                </p>
              </div>
            )}

            {/* File Attachment */}
            {weekData.projectFile && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-heading mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-purple-600" />
                  Attached File
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 rounded p-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-heading">
                        {weekData.projectFile.originalName}
                      </p>
                      <p className="text-sm text-body">
                        {(weekData.projectFile.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDownloadFile(
                        teamId,
                        weekData.week,
                        weekData.projectFile.filename
                      )
                    }
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Mentor Feedback */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h4 className="font-semibold text-heading mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2 text-indigo-600" />
                Mentor Feedback / Scoring
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div ref={scoreRef}>
                  <label className="text-sm font-medium text-body">Score (0-10) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-edge rounded-lg"
                  />
                  {scoreError && (
                    <p className="text-sm text-red-600 mt-1">{scoreError}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-body">Comments (optional)</label>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-edge rounded-lg"
                  />
                </div>
              </div>

              {weekData.scoredAt && (
                <p className="text-xs text-muted mt-2">
                  Reviewed on {new Date(weekData.scoredAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Submission Info */}
            <div className="flex items-center justify-between text-sm text-body pt-4 border-t">
              <div className="flex items-center space-x-4">
                <span>
                  Submitted by: {" "}
                  <span className="font-medium">
                    {(() => {
                      // weekData.submittedBy may be populated (object) or just an id string
                      const sb = weekData.submittedBy;
                      if (!sb) return teamLeader?.name || "Unknown";
                      if (typeof sb === "string") {
                        const member = teamMembers.find(
                          (m) => String(m.student?._id || m.student) === sb
                        );
                        return member?.student?.name || member?.name || "Unknown";
                      }
                      // Object case (populated)
                      return sb.name || sb.studentName || teamLeader?.name || "Unknown";
                    })()}
                  </span>
                </span>
                <span>•</span>
                <span>{weekData.submittedAt ? new Date(weekData.submittedAt).toLocaleString() : "-"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Team Progress View
  const TeamProgressView = ({ team }) => {
    const weeklyStatus = team.weeklyStatus || [];
    // compute available weeks from the team's weeklyStatus
    const weeks = Array.from(new Set(weeklyStatus.map((w) => w.week))).sort((a, b) => a - b);

    let filteredWeeks = weeklyStatus;
    if (filterStatus !== "all") filteredWeeks = filteredWeeks.filter((w) => w.status === filterStatus);
    if (filterWeek !== "all") filteredWeeks = filteredWeeks.filter((w) => Number(w.week) === Number(filterWeek));

    const stats = {
      total: weeklyStatus.length,
      pending: weeklyStatus.filter((w) => w.status === "submitted").length,
      approved: weeklyStatus.filter((w) => w.status === "mentor_approved")
        .length,
      avgScore:
        weeklyStatus.filter((w) => w.mentorScore !== null).length > 0
          ? (
            weeklyStatus.reduce((sum, w) => sum + (w.mentorScore || 0), 0) /
            weeklyStatus.filter((w) => w.mentorScore !== null).length
          ).toFixed(1)
          : "N/A",
    };

    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-heading">{team.code}</h2>
              <p className="text-body mt-1">
                {team.batch} • {team.department}
              </p>
              {team.finalProject && (
                <p className="text-primary mt-1 font-medium">
                  {team.finalProject.title}
                </p>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Reports
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">
                    Pending Review
                  </p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-primary-subtle rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Approved</p>
                  <p className="text-3xl font-bold text-heading">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Avg Score
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.avgScore}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-surface rounded-lg shadow p-4 border border-edge">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-body" />
              <label className="text-sm font-medium text-body">
                Filters:
              </label>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              >
                <option value="all">All Reports ({weeklyStatus.length})</option>
                <option value="submitted">Pending Review ({stats.pending})</option>
                <option value="mentor_approved">Approved ({stats.approved})</option>
              </select>

              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              >
                <option value="all">All Weeks</option>
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Week {w} ({weeklyStatus.filter((x) => Number(x.week) === Number(w)).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Reports */}
        <div className="space-y-4">
          {filteredWeeks.length === 0 ? (
            <div className="bg-surface rounded-lg shadow p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-heading mb-2">
                No Reports Found
              </h3>
              <p className="text-body">
                {filterStatus === "all"
                  ? "This team hasn't submitted any weekly reports yet."
                  : `No reports with status: ${filterStatus}`}
              </p>
            </div>
          ) : (
            filteredWeeks.map((weekData) => (
              <WeeklyStatusCard
                key={weekData._id}
                weekData={weekData}
                teamId={team._id}
                teamCode={team.code}
                teamMembers={team.members}
                teamLeader={team.leader}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-body">Loading progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-heading mb-2">
              Error Loading Data
            </h2>
            <p className="text-body mb-4">{error}</p>
            <button
              onClick={fetchProgressData}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-heading mb-2">
              No Teams Found
            </h2>
            <p className="text-body">
              You don&apos;t have any teams assigned to you yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentTeam = teams.find((t) => t._id === selectedTeam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading mb-2">
            Progress Tracking Dashboard
          </h1>
          <p className="text-lg text-body">
            Monitor weekly progress reports and team development
          </p>
        </div>

        {/* Team Selector */}
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-edge-subtle">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <label className="text-sm font-medium text-body">
              Select Team:
            </label>
            <div className="flex gap-3 flex-1 max-w-md w-full">
              <select
                value={selectedTeam || ""}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="flex-1 px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              >
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.code} - {team.leader?.name}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchProgressData}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Team Progress View */}
        {currentTeam && <TeamProgressView team={currentTeam} />}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 rounded-lg p-2">
                <MessageSquare className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-heading">
                Reject Weekly Status
              </h3>
            </div>

            <div className="bg-surface-alt rounded-lg p-3 border border-edge">
              <p className="text-sm text-body">
                <strong>Week:</strong> {showRejectModal.week}
              </p>
              <p className="text-sm text-body mt-1">
                <strong>Module:</strong> {showRejectModal.module}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-body mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide feedback on why this submission is being rejected..."
                rows="4"
                className="w-full px-4 py-2 border border-edge rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-heading rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const team = teams.find((t) => t._id === selectedTeam);
                  handleReject(team._id, showRejectModal.id);
                }}
                disabled={actionLoading === `reject-${showRejectModal.id}`}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === `reject-${showRejectModal.id}` ? (
                  <>
                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracking;
