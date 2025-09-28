import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import axios from "../../../services/axios";
import {
  Search,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  FileText,
  Clock,
  Filter,
  Download,
  Eye,
  RefreshCw,
  BarChart3,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Mail,
  Hash,
  BookOpen
} from 'lucide-react';

const ReviewDocs = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // UI states
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch teams and document data
  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/admin/document-review-status');
      const { teams: teamsData, documentTypes: docTypes, statistics: stats } = response.data;
      
      setTeams(teamsData);
      setFilteredTeams(teamsData);
      setDocumentTypes(docTypes);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching document data:', err);
      setError(err.response?.data?.message || 'Failed to fetch document data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

  // Filter teams based on search and filters
  useEffect(() => {
    let filtered = teams;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(team =>
        team.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leader.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.members.some(member => 
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(team => team.status === statusFilter);
    }

    // Document completion filter
    if (documentFilter !== 'all') {
      filtered = filtered.filter(team => {
        const { submittedDocuments, approvedDocuments } = team.completionSummary;
        switch (documentFilter) {
          case 'complete':
            return approvedDocuments === 3;
          case 'partial':
            return submittedDocuments > 0 && approvedDocuments < 3;
          case 'none':
            return submittedDocuments === 0;
          default:
            return true;
        }
      });
    }

    // Batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter(team => team.batch === batchFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(team => team.department === departmentFilter);
    }

    setFilteredTeams(filtered);
  }, [teams, searchTerm, statusFilter, documentFilter, batchFilter, departmentFilter]);

  // Get unique values for filters
  const uniqueBatches = [...new Set(teams.map(team => team.batch))];
  const uniqueDepartments = [...new Set(teams.map(team => team.department))];

  // Toggle team expansion
  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Get status badge component
  const StatusBadge = ({ status, type = 'default' }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'admin_approved':
          return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Admin Approved' };
        case 'mentor_approved':
          return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, text: 'Mentor Approved' };
        case 'submitted':
          return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending Review' };
        case 'rejected':
          return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Rejected' };
        case 'draft':
          return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, text: 'Draft' };
        case 'not_submitted':
          return { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle, text: 'Not Submitted' };
        case 'approved':
          return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Approved' };
        case 'pending':
          return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending' };
        default:
          return { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle, text: status || 'Unknown' };
      }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Document card component
  const DocumentCard = ({ document, teamId, docKey }) => {
    const isWeeklyStatus = docKey === 'weeklyStatus';
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">{document.name}</h4>
          </div>
          {isWeeklyStatus ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{document.approvedReports}/{document.totalReports} approved</span>
              <StatusBadge 
                status={document.totalReports > 0 ? 'submitted' : 'not_submitted'} 
              />
            </div>
          ) : (
            <StatusBadge status={document.status} />
          )}
        </div>

        <div className="space-y-2 text-sm">
          {isWeeklyStatus ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reports:</span>
                  <span className="font-medium">{document.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Files:</span>
                  <span className="font-medium">{document.reportsWithFiles}</span>
                </div>
              </div>
              {document.latestSubmission && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest:</span>
                  <span className="font-medium">
                    {new Date(document.latestSubmission).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className={`font-medium ${document.submitted ? 'text-green-600' : 'text-gray-400'}`}>
                  {document.submitted ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Has Data:</span>
                <span className={`font-medium ${document.hasData ? 'text-blue-600' : 'text-gray-400'}`}>
                  {document.hasData ? 'Yes' : 'No'}
                </span>
              </div>
              {document.submittedAt && (
                <div className="col-span-2 flex justify-between">
                  <span className="text-gray-600">Submitted At:</span>
                  <span className="font-medium">
                    {new Date(document.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Team card component
  const TeamCard = ({ team }) => {
    const isExpanded = expandedTeams.has(team._id);
    const { submittedDocuments, approvedDocuments, totalDocuments } = team.completionSummary;
    const completionPercentage = Math.round((approvedDocuments / totalDocuments) * 100);

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Team Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <span>{team.code}</span>
                  <StatusBadge status={team.status} />
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {team.batch} • {team.department} • {team.teamSize} members
                </p>
                {team.finalProject && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {team.finalProject.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {approvedDocuments}/{totalDocuments} Approved
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => toggleTeamExpansion(team._id)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Team Members */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Leader */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-blue-900">{team.leader.name} (Leader)</p>
                    <p className="text-sm text-blue-600 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {team.leader.email}
                    </p>
                    {team.leader.rollNumber && (
                      <p className="text-sm text-blue-600 flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        {team.leader.rollNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Members */}
                {team.members.map((member) => (
                  <div key={member._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="bg-gray-100 rounded-full p-2">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </p>
                      {member.rollNumber && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {member.rollNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor Information */}
            {team.mentor && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Assigned Mentor
                </h4>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="bg-green-100 rounded-full p-2">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{team.mentor.name}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {team.mentor.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Document Status
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(team.documents).map(([docKey, document]) => (
                  <DocumentCard
                    key={docKey}
                    document={document}
                    teamId={team._id}
                    docKey={docKey}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading document review data...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDocumentData}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Review Dashboard</h1>
          <p className="text-lg text-gray-600">Review and monitor team document submissions and approvals</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalTeams}</p>
                </div>
                <div className="bg-indigo-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teams with Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.teamsWithDocuments}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fully Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.fullyApprovedTeams}</p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pendingReviewCount}</p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-3">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Type Statistics */}
        {statistics?.documentTypeStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Document Type Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statistics.documentTypeStats.map((stat) => (
                <div key={stat.key} className="space-y-3">
                  <h4 className="font-medium text-gray-800">{stat.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Submitted</span>
                      <span className="font-medium text-blue-600">{stat.submitted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mentor Approved</span>
                      <span className="font-medium text-green-600">{stat.mentorApproved}</span>
                    </div>
                    {stat.key !== 'weeklyStatus' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Admin Approved</span>
                        <span className="font-medium text-emerald-600">{stat.adminApproved}</span>
                      </div>
                    )}
                    {stat.pending > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending Review</span>
                        <span className="font-medium text-yellow-600">{stat.pending}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search teams, members, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={documentFilter}
                onChange={(e) => setDocumentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Documents</option>
                <option value="complete">Fully Approved</option>
                <option value="partial">Partially Complete</option>
                <option value="none">No Documents</option>
              </select>

              {uniqueBatches.length > 0 && (
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Batches</option>
                  {uniqueBatches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              )}

              {uniqueDepartments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}

              <button
                onClick={fetchDocumentData}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredTeams.length} of {teams.length} teams
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDocumentFilter('all');
                setBatchFilter('all');
                setDepartmentFilter('all');
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Teams List */}
        <div className="space-y-6">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredTeams.map((team) => (
              <TeamCard key={team._id} team={team} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDocs;
        projectPPT_final: { uploaded: false, mentorApproved: false, adminApproved: false, filename: null, uploadDate: null, fileUrl: null, sampleFile: 'sample_final_presentation.pdf' },
        mentorApprovalLetter: { uploaded: true, mentorApproved: true, adminApproved: true, filename: 'mentor_approval.pdf', uploadDate: '2024-09-10', fileUrl: '/files/team001/mentor_approval.pdf', sampleFile: 'sample_mentor_approval.pdf' }
      }
    },
    'TEAM002': {
      teamCode: 'TEAM002',
      teamName: 'Tech Pioneers',
      members: ['David Wilson', 'Emma Brown', 'Frank Miller'],
              documents: {
        projectPPT: { uploaded: true, mentorApproved: true, adminApproved: true, filename: 'team2_presentation.pdf', uploadDate: '2024-09-16', fileUrl: '/files/team002/team2_presentation.pdf', sampleFile: 'sample_presentation.pdf' },
        funcReq: { uploaded: true, mentorApproved: true, adminApproved: false, filename: 'team2_func_req.pdf', uploadDate: '2024-09-14', fileUrl: '/files/team002/team2_func_req.pdf', sampleFile: 'sample_functional_requirements.pdf' },
        srs: { uploaded: true, mentorApproved: false, adminApproved: false, filename: 'team2_srs.pdf', uploadDate: '2024-09-17', fileUrl: '/files/team002/team2_srs.pdf', sampleFile: 'sample_srs.pdf' },
        projectReport: { uploaded: false, mentorApproved: false, adminApproved: false, filename: null, uploadDate: null, fileUrl: null, sampleFile: 'sample_project_report.pdf' },
        projectManual: { uploaded: true, mentorApproved: true, adminApproved: true, filename: 'team2_manual.pdf', uploadDate: '2024-09-19', fileUrl: '/files/team002/team2_manual.pdf', sampleFile: 'sample_project_manual.pdf' },
        projectCode_final: { uploaded: false, mentorApproved: false, adminApproved: false, filename: null, uploadDate: null, fileUrl: null, sampleFile: 'sample_code_summary.pdf' },
        projectPPT_final: { uploaded: true, mentorApproved: false, adminApproved: false, filename: 'team2_final_ppt.pdf', uploadDate: '2024-09-22', fileUrl: '/files/team002/team2_final_ppt.pdf', sampleFile: 'sample_final_presentation.pdf' },
        mentorApprovalLetter: { uploaded: true, mentorApproved: true, adminApproved: true, filename: 'team2_mentor_approval.pdf', uploadDate: '2024-09-11', fileUrl: '/files/team002/team2_mentor_approval.pdf', sampleFile: 'sample_mentor_approval.pdf' }
      }
    }
  };

  const documentLabels = {
    projectPPT: 'Project Presentation',
    funcReq: 'Functional Requirements',
    srs: 'Software Requirements Specification',
    projectReport: 'Project Report',
    projectManual: 'Project Manual',
    projectCode_final: 'Final Project Code',
    projectPPT_final: 'Final Project Presentation',
    mentorApprovalLetter: 'Mentor Approval Letter'
  };

  const handleSearch = async () => {
    if (!teamCode.trim()) {
      setError('Please enter a team code');
      return;
    }

    setLoading(true);
    setError('');
    setTeamData(null);

    // Simulate API call delay
    setTimeout(() => {
      const foundTeam = mockTeamData[teamCode.toUpperCase()];
      
      if (foundTeam) {
        setTeamData(foundTeam);
      } else {
        setError('Enter the correct Code');
      }
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">


        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700 mb-2">
                Team Code
              </label>
              <input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter team code (e.g., TEAM001)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Search size={20} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Team Information */}
        {teamData && (
          <div className="space-y-6">
            {/* Team Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users size={24} className="text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Team Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Team Code</p>
                  <p className="text-lg font-semibold text-gray-900">{teamData.teamCode}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Team Members</p>
                  <div className="flex flex-wrap gap-2">
                    {teamData.members.map((member, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Document Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Document Details</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 text-left py-3 px-4 font-semibold text-gray-900">Document Name</th>
                      <th className="border border-gray-300 text-center py-3 px-4 font-semibold text-gray-900 w-20">Uploaded</th>
                      <th className="border border-gray-300 text-center py-3 px-4 font-semibold text-gray-900 w-24">Mentor Approved</th>
                      <th className="border border-gray-300 text-center py-3 px-4 font-semibold text-gray-900 w-24">Admin Approved</th>
                      <th className="border border-gray-300 text-left py-3 px-4 font-semibold text-gray-900">File Details</th>
                      <th className="border border-gray-300 text-center py-3 px-4 font-semibold text-gray-900 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(teamData.documents).map(([docKey, docInfo]) => (
                      <tr key={docKey} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-300 py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {documentLabels[docKey]}
                          </div>
                        </td>
                        <td className="border border-gray-300 py-4 px-4 text-center">
                          {docInfo.uploaded ? (
                            <CheckCircle size={20} className="text-green-500 mx-auto" />
                          ) : (
                            <XCircle size={20} className="text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="border border-gray-300 py-4 px-4 text-center">
                          {docInfo.uploaded ? (
                            docInfo.mentorApproved ? (
                              <CheckCircle size={20} className="text-green-500 mx-auto" />
                            ) : (
                              <XCircle size={20} className="text-yellow-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-400 text-lg">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 py-4 px-4 text-center">
                          {docInfo.uploaded ? (
                            docInfo.adminApproved ? (
                              <CheckCircle size={20} className="text-green-500 mx-auto" />
                            ) : (
                              <XCircle size={20} className="text-orange-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-400 text-lg">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 py-4 px-4">
                          {docInfo.uploaded ? (
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">{docInfo.filename}</p>
                              <p className="text-gray-500">Uploaded: {docInfo.uploadDate}</p>
                              <a 
                                href={docInfo.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-800 underline text-xs"
                              >
                                View File
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-red-600">Not submitted</span>
                          )}
                        </td>
                        <td className="border border-gray-300 py-4 px-4 text-center">
                          {docInfo.uploaded && docInfo.mentorApproved && !docInfo.adminApproved ? (
                            <button
                              onClick={() => handleApproval(teamData.teamCode, docKey)}
                              className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors"
                            >
                              Approve
                            </button>
                          ) : docInfo.adminApproved ? (
                            <button
                              onClick={() => handleUnapproval(teamData.teamCode, docKey)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              Unapprove
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentChecker;