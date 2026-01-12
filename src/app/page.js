import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Background Decorative Elements (The Cosmos) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-3xl text-center">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-12 sm:p-16 transform transition-all hover:border-white/20">

          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
            Design Thinking Bot
          </h1>

          <p className="text-xl md:text-2xl mb-10 text-slate-300 font-light leading-relaxed">
            Welcome to your AI-powered companion for the <span className="text-blue-400 font-medium">Design Thinking</span> process.
            <br className="hidden md:block" />
            Collaborate, Ideate, and Innovate.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/50"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-200 border border-white/10 hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1 hover:text-white backdrop-blur-sm"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-8 text-slate-500 opacity-60">
          {/* Simple decorative icons or text could go here, keeping it clean for now */}
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
        </div>
      </div>
    </div>
  );
}
