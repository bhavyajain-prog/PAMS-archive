import { useState, useEffect } from "react";
import axios from "../../../services/axios";
import {
    FaStar,
    FaCalendarAlt,
    FaTrophy,
    FaChartLine,
    FaSpinner,
    FaCheckCircle,
    FaClock,
    FaComments,
    FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ViewScore() {
    const [weeklyScores, setWeeklyScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({
        totalWeeks: 0,
        scoredWeeks: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchWeeklyScores();
    }, []);

    const fetchWeeklyScores = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/team/weekly-status");

            const scores = response.data.weeklyStatus || [];

            // Calculate statistics
            const scoredSubmissions = scores.filter(
                (s) => s.mentorScore !== null && s.mentorScore !== undefined
            );

            const totalScore = scoredSubmissions.reduce(
                (sum, s) => sum + s.mentorScore,
                0
            );

            const stats = {
                totalWeeks: scores.length,
                scoredWeeks: scoredSubmissions.length,
                totalScore: totalScore,
                averageScore:
                    scoredSubmissions.length > 0
                        ? (totalScore / scoredSubmissions.length).toFixed(2)
                        : 0,
                highestScore:
                    scoredSubmissions.length > 0
                        ? Math.max(...scoredSubmissions.map((s) => s.mentorScore))
                        : 0,
                lowestScore:
                    scoredSubmissions.length > 0
                        ? Math.min(...scoredSubmissions.map((s) => s.mentorScore))
                        : 0,
            };

            setStatistics(stats);
            setWeeklyScores(scores);
            setError(null);
        } catch (err) {
            console.error("Error fetching weekly scores:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load weekly scores. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 9) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 7) return "text-blue-600 bg-blue-50 border-blue-200";
        if (score >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const getScoreGrade = (score) => {
        if (score >= 9) return "Excellent";
        if (score >= 7) return "Good";
        if (score >= 5) return "Average";
        return "Needs Improvement";
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            mentor_approved: {
                color: "bg-green-100 text-green-700 border-green-300",
                icon: FaCheckCircle,
                text: "Scored",
            },
            submitted: {
                color: "bg-yellow-100 text-yellow-700 border-yellow-300",
                icon: FaClock,
                text: "Pending Review",
            },
            draft: {
                color: "bg-gray-100 text-gray-700 border-gray-300",
                icon: FaClock,
                text: "Draft",
            },
        };

        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
                <Icon className="mr-1.5" />
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-sky-100">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-teal-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-700">Loading your scores...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchWeeklyScores}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/home")}
                        className="mb-4 inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back to Home
                    </button>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Weekly Scores
                    </h1>
                    <p className="text-gray-600">
                        Track your weekly performance and mentor feedback
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Submissions */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    Total Weeks
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {statistics.totalWeeks}
                                </p>
                            </div>
                            <div className="bg-teal-100 p-3 rounded-full">
                                <FaCalendarAlt className="text-2xl text-teal-600" />
                            </div>
                        </div>
                    </div>

                    {/* Scored Weeks */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    Scored Weeks
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {statistics.scoredWeeks}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <FaCheckCircle className="text-2xl text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    Average Score
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {statistics.averageScore}
                                    <span className="text-lg text-gray-500">/10</span>
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FaChartLine className="text-2xl text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Score */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    Total Score
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {statistics.totalScore}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <FaTrophy className="text-2xl text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Range */}
                {statistics.scoredWeeks > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <FaStar className="text-yellow-500 mr-2" />
                            Score Range
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">
                                    Highest Score
                                </p>
                                <p className="text-4xl font-bold text-green-600">
                                    {statistics.highestScore}
                                    <span className="text-lg text-gray-500">/10</span>
                                </p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">
                                    Lowest Score
                                </p>
                                <p className="text-4xl font-bold text-orange-600">
                                    {statistics.lowestScore}
                                    <span className="text-lg text-gray-500">/10</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weekly Scores List */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <FaCalendarAlt className="text-teal-600 mr-3" />
                        Weekly Performance
                    </h2>

                    {weeklyScores.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No weekly submissions yet</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Your weekly scores will appear here once you start submitting
                                weekly status reports
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {weeklyScores
                                .sort((a, b) => b.week - a.week)
                                .map((score, index) => (
                                    <div
                                        key={score._id || index}
                                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Week Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        Week {score.week}
                                                    </h3>
                                                    {getStatusBadge(score.status)}
                                                </div>

                                                {score.dateRange && (
                                                    <p className="text-sm text-gray-600 flex items-center mb-2">
                                                        <FaCalendarAlt className="mr-2 text-gray-400" />
                                                        {new Date(score.dateRange.from).toLocaleDateString()}{" "}
                                                        - {new Date(score.dateRange.to).toLocaleDateString()}
                                                    </p>
                                                )}

                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Module:</span>{" "}
                                                    {score.module}
                                                </p>

                                                {score.submittedAt && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Submitted:{" "}
                                                        {new Date(score.submittedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Score Display */}
                                            <div className="flex items-center gap-6">
                                                {score.mentorScore !== null &&
                                                    score.mentorScore !== undefined ? (
                                                    <>
                                                        <div className="text-center">
                                                            <div
                                                                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getScoreColor(
                                                                    score.mentorScore
                                                                )}`}
                                                            >
                                                                <div>
                                                                    <div className="text-3xl font-bold">
                                                                        {score.mentorScore}
                                                                    </div>
                                                                    <div className="text-xs font-medium">
                                                                        / 10
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p
                                                                className={`text-xs font-semibold mt-2 ${getScoreColor(
                                                                    score.mentorScore
                                                                ).split(" ")[0]}`}
                                                            >
                                                                {getScoreGrade(score.mentorScore)}
                                                            </p>
                                                        </div>

                                                        {/* Star Rating Visual */}
                                                        <div className="hidden md:flex flex-col items-center">
                                                            <div className="flex gap-1">
                                                                {[...Array(10)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        className={`text-sm ${i < score.mentorScore
                                                                                ? "text-yellow-400"
                                                                                : "text-gray-300"
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {score.mentorScore}/10 stars
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <FaClock className="text-3xl text-gray-400 mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-gray-600">
                                                            Not Scored Yet
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Waiting for mentor review
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mentor Comments */}
                                        {score.mentorComments && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                    <div className="flex items-start gap-3">
                                                        <FaComments className="text-blue-600 text-xl mt-1 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                                                Mentor Feedback:
                                                            </p>
                                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                                {score.mentorComments}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Performance Tips */}
                {statistics.averageScore > 0 && statistics.averageScore < 7 && (
                    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-yellow-800 mb-3">
                            💡 Performance Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-yellow-700">
                            <li>
                                • Review mentor feedback carefully and address the suggestions
                            </li>
                            <li>
                                • Ensure weekly submissions are complete and well-documented
                            </li>
                            <li>• Communicate regularly with your mentor for guidance</li>
                            <li>
                                • Focus on quality over quantity in your project deliverables
                            </li>
                        </ul>
                    </div>
                )}

                {/* Excellent Performance */}
                {statistics.averageScore >= 9 && (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-green-800 mb-3">
                            🎉 Excellent Work!
                        </h3>
                        <p className="text-sm text-green-700">
                            You&apos;re maintaining an outstanding average score. Keep up the
                            great work and continue demonstrating this level of commitment to
                            your project!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
