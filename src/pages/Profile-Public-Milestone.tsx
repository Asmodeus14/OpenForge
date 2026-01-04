export default function ProfilePublicMilestone() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-purple-600/10 to-purple-500/15 blur-3xl rounded-full"></div>
                    <div className="relative bg-black/95 border border-purple-500/25 rounded-2xl p-10 backdrop-blur-xl shadow-2xl shadow-purple-900/20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-900/40 via-black to-purple-900/40 border border-purple-500/30 mb-6">
                            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent mb-4">
                            Feature in Development
                        </h3>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                            We're building an amazing milestone system for your public profile
                        </p>
                        <div className="inline-block px-8 py-4 bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-500/30 rounded-xl backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:border-purple-400/40">
                            <span className="text-2xl font-bold text-white tracking-wider animate-pulse">
                                Coming soon...
                            </span>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-800">
                            <div className="flex items-center justify-center space-x-3 text-sm text-gray-400">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>Milestone tracking and achievements will be available soon</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}