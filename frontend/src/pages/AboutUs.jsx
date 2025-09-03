import React from "react";
import {
  Github,
  Linkedin,
  Mail,
  Code,
  Database,
  Server,
  Layers,
  Zap,
  Palette,
  Shield,
  Users,
  Target,
  Star,
  ArrowRight,
  Coffee,
  Cpu,
  MessageCircle,
} from "lucide-react";

const AboutUs = () => {
  const developers = [
    {
      name: "Akshat Lila",
      role: "UI/UX Developer",
      email: "akshatlila111@gmail.com",
      linkedin: "https://www.linkedin.com/in/akshat-lila-9206902b9/",
      github: "https://github.com/AkshatLila",
      avatar: "AL",
      skills: ["React", "UI/UX", "Frontend"],
      color: "from-purple-500 via-pink-500 to-red-500",
    },
    {
      name: "Bhavya Jain",
      role: "Backend + Security",
      email: "bhavyajain.prog@gmail.com",
      linkedin: "https://www.linkedin.com/in/bhavyajain23",
      github: "https://github.com/bhavyajain-prog",
      avatar: "BJ",
      skills: ["Node.js", "Security", "Backend"],
      color: "from-cyan-500 via-blue-500 to-indigo-500",
    },
  ];

  const technologies = [
    {
      name: "React",
      icon: Layers,
      color: "text-cyan-400",
      glow: "shadow-cyan-500/20",
    },
    {
      name: "Node.js",
      icon: Server,
      color: "text-green-400",
      glow: "shadow-green-500/20",
    },
    {
      name: "Express.js",
      icon: Zap,
      color: "text-yellow-400",
      glow: "shadow-yellow-500/20",
    },
    {
      name: "MongoDB",
      icon: Database,
      color: "text-emerald-400",
      glow: "shadow-emerald-500/20",
    },
    {
      name: "Tailwind CSS",
      icon: Palette,
      color: "text-blue-400",
      glow: "shadow-blue-500/20",
    },
    {
      name: "JWT",
      icon: Shield,
      color: "text-red-400",
      glow: "shadow-red-500/20",
    },
  ];

  const features = [
    {
      title: "Multi-role Authentication",
      desc: "Secure JWT-based auth with 5 user roles",
      icon: Shield,
      accent: "text-red-400",
    },
    {
      title: "Project Management",
      desc: "Complete project lifecycle management",
      icon: Target,
      accent: "text-blue-400",
    },
    {
      title: "Team Collaboration",
      desc: "Advanced team formation tools",
      icon: Users,
      accent: "text-green-400",
    },
    {
      title: "Real-time Updates",
      desc: "Live progress tracking & notifications",
      icon: Zap,
      accent: "text-yellow-400",
    },
  ];

  const stats = [
    { label: "Lines of Code", value: "15K+", icon: Code },
    { label: "Components", value: "50+", icon: Layers },
    { label: "API Endpoints", value: "30+", icon: Server },
    { label: "User Roles", value: "5", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-900 transition-all duration-500">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-pink-500/5 animate-gradient"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent mb-6 leading-tight">
              PAMS
            </h1>

            <p className="text-2xl md:text-3xl font-semibold text-gray-300 mb-4">
              Project Allocation & Management System
            </p>

            <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed mb-8">
              A web application for academic project management with modern
              technologies and secure authentication.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developers Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-4">
              <Coffee className="w-10 h-10 text-amber-400" />
              Development Team
              <Cpu className="w-10 h-10 text-cyan-400" />
            </h2>
            <p className="text-lg text-gray-400">The developers behind PAMS</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {developers.map((dev, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${dev.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}
                  ></div>

                  <div className="relative z-10">
                    <div className="flex items-start space-x-6 mb-6">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${dev.color} flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-2xl font-bold text-white">
                          {dev.avatar}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {dev.name}
                        </h3>
                        <p className="text-cyan-400 font-medium mb-2">
                          {dev.role}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-400" />
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {dev.skills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-3 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full border border-gray-600/50 hover:border-cyan-400/50 transition-colors duration-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <a
                        href={`mailto:${dev.email}`}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl transition-all duration-200 group/btn"
                      >
                        <Mail className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                        <span className="text-sm font-medium">Email</span>
                      </a>

                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all duration-200 group/btn border border-blue-500/30"
                      >
                        <Linkedin className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                      </a>

                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-all duration-200 group/btn border border-purple-500/30"
                      >
                        <Github className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Technologies
            </h2>
            <p className="text-lg text-gray-400">Technologies used in PAMS</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {technologies.map((tech, index) => (
              <div key={index} className="group">
                <div
                  className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${tech.glow} hover:shadow-2xl`}
                >
                  <div className="text-center">
                    <tech.icon
                      className={`w-12 h-12 ${tech.color} mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    />
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {tech.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Features
            </h2>
            <p className="text-lg text-gray-400">Main features of PAMS</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                        {feature.title}
                        <ArrowRight className="w-4 h-4 ml-2 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                      </h3>
                      <p className="text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center border-t border-gray-800 pt-12">
          <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4">
            <span>&copy; 2024 PAMS</span>
            <span>•</span>
            <span>Developed with</span>
            <span className="text-red-400 animate-pulse">♥</span>
            <span>by</span>
            <span className="text-cyan-400 font-semibold">
              {developers.map((d) => d.name).join(" & ")}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Open for Collaboration</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutUs;
