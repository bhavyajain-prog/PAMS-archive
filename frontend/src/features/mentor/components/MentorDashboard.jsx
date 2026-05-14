import { useState, useEffect } from 'react';
import axios from '../../../services/axios';
import {
    BarChart,
    CheckCircle,
    Clock,
    FileText,
    Users,
    AlertTriangle,
    Target,
} from 'lucide-react';

const TeamCard = ({ team }) => {
    // Get project abstract status from documents object
    const projectAbstract = team.documents?.projectAbstract;
    const statusLabel = projectAbstract?.status || 'not_submitted';

    // Determine status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'mentor_approved':
            case 'admin_approved':
                return 'bg-green-100 text-green-800';
            case 'submitted':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-surface-alt text-body';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'mentor_approved':
                return 'Mentor Approved';
            case 'admin_approved':
                return 'Admin Approved';
            case 'submitted':
                return 'Pending Review';
            case 'rejected':
                return 'Rejected';
            case 'not_submitted':
                return 'Not Submitted';
            default:
                return status;
        }
    };

    return (
        <div className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-heading">{team.code}</h3>
                    <p className="text-sm text-body">{team.department} - {team.batch}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusLabel)}`}>
                    {getStatusText(statusLabel)}
                </span>
            </div>

            <div className="space-y-3">
                {team.finalProject && (
                    <div className="flex items-center text-sm text-body">
                        <Target className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{team.finalProject.title}</span>
                    </div>
                )}

                <div className="flex items-center text-sm text-body">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{(team.members?.length || 0) + 1} Members</span>
                </div>

                {/* Document completion status */}
                <div className="flex items-center text-sm text-body">
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{team.completionSummary?.approvedDocuments || 0} / {team.completionSummary?.totalDocuments || 0} Docs Approved</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-edge-subtle">
                <div className="flex justify-between items-center">
                    <button
                        className="text-primary hover:text-primary text-sm font-medium"
                        onClick={() => window.location.href = `/mentor/document-approval`}
                    >
                        Review Documents
                    </button>
                    <div className="text-xs text-muted">
                        {team.leader?.name}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="bg-surface rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-body">{title}</p>
                    <p className="text-2xl font-semibold text-heading mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

export default function MentorDashboard() {
    const [teams, setTeams] = useState([]);
    const [stats, setStats] = useState({
        totalTeams: 0,
        pendingReviews: 0,
        completedReviews: 0,
        activeProjects: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                // Fetch teams assigned to this mentor using the document review endpoint
                const response = await axios.get('/common/mentor/document-review-status');
                const teamsData = response.data.teams || [];
                setTeams(teamsData);

                // Calculate stats
                const pendingReviews = teamsData.filter(t => {
                    const docs = t.documents || {};
                    return Object.values(docs).some(doc =>
                        doc.status === 'submitted'
                    );
                }).length;

                const completedReviews = teamsData.filter(t => {
                    const docs = t.documents || {};
                    return Object.values(docs).some(doc =>
                        doc.status === 'mentor_approved' || doc.status === 'admin_approved'
                    );
                }).length;

                setStats({
                    totalTeams: teamsData.length,
                    pendingReviews: pendingReviews,
                    completedReviews: completedReviews,
                    activeProjects: teamsData.filter(t => t.finalProject).length
                });

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch teams');
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-surface-alt">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-surface-alt">
                <div className="text-red-500 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-alt py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-heading">Mentor Dashboard</h1>
                    <p className="mt-2 text-sm text-body">
                        Overview of your assigned teams and their progress
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Teams"
                        value={stats.totalTeams}
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Pending Reviews"
                        value={stats.pendingReviews}
                        icon={Clock}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="Completed Reviews"
                        value={stats.completedReviews}
                        icon={CheckCircle}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Active Projects"
                        value={stats.activeProjects}
                        icon={BarChart}
                        color="bg-purple-500"
                    />
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                        <TeamCard key={team._id} team={team} />
                    ))}
                </div>

                {teams.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-muted" />
                        <h3 className="mt-2 text-sm font-medium text-heading">No Teams</h3>
                        <p className="mt-1 text-sm text-muted">
                            You have not been assigned any teams yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}