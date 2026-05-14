export default function Loading() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-base relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main loading card */}
      <div className="relative z-10 bg-surface backdrop-blur-md p-12 rounded-3xl shadow-2xl border border-edge flex flex-col items-center max-w-md mx-4">
        {/* Advanced spinner */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-primary-subtle rounded-full animate-spin"></div>
          {/* Middle ring */}
          <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-purple-400 border-r-purple-400 rounded-full animate-spin" style={{animationDuration: '1.5s'}}></div>
          {/* Inner ring */}
          <div className="absolute top-4 left-4 w-12 h-12 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{animationDuration: '0.8s'}}></div>
          {/* Center dot */}
          <div className="absolute top-8 left-8 w-4 h-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-heading animate-pulse">
            Loading
          </h2>
          <p className="text-body text-lg">
            Preparing your workspace...
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>

      {/* Bottom subtle text */}
      <p className="relative z-10 text-sm text-muted mt-8 opacity-75">
        Just a moment while we set things up
      </p>
    </div>
  );
}
