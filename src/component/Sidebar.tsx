import { useState, useEffect } from "react";
import { useNavigate} from "react-router-dom";
import { useWeb3 } from "../hooks/web3";
import LogoSVG from "../component/Logo";
import { 
  Home, 
  Briefcase, 
  Users, 
  FileText, // Changed from Bell to FileText for contracts icon
  MessageSquare, 
  Bookmark, 
  LogIn,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Menu,
  X,
  User,
} from "lucide-react";

// Import IPFS-related functions
import { getProfileFlow } from "../Flows/GetProfile";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showCreateButton?: boolean;
}

interface ProfileData {
  name?: string;
  avatar?: {
    cid: string;
    type: string;
  };
}

export default function Sidebar({ 
  activeTab = "home", 
  onTabChange,
  showCreateButton = true 
}: SidebarProps) {
  const navigate = useNavigate();
 
  const { account } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Get profile data and avatar from IPFS
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!account) {
        setProfileData(null);
        setAvatarUrl("");
        return;
      }

      try {
        // Get IPFS hash from blockchain
        const cid = await getProfileFlow(account);
        if (!cid) {
          setProfileData(null);
          setAvatarUrl("");
          return;
        }

        // Fetch profile data from IPFS
        const ipfsGateway = "https://ipfs.io/ipfs/";
        const response = await fetch(`${ipfsGateway}${cid}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          
          // Load avatar if exists
          if (data.avatar && data.avatar.cid) {
            setIsLoadingAvatar(true);
            await loadAvatar(data.avatar.cid);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    };

    fetchProfileData();
  }, [account]);

  // Load avatar from IPFS
  const loadAvatar = async (cid: string): Promise<void> => {
    try {
      const ipfsGateway = "https://ipfs.io/ipfs/";
      const url = `${ipfsGateway}${cid}`;
      
      // Try to load the image
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setAvatarUrl(url);
      } else {
        // Try common extensions
        const extensions = ['', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        for (const ext of extensions) {
          const testUrl = `${ipfsGateway}${cid}${ext}`;
          try {
            const testResponse = await fetch(testUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              setAvatarUrl(testUrl);
              break;
            }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load avatar:", error);
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  // Helper functions
  const getInitials = (addr: string) => {
    return addr.slice(2, 4).toUpperCase();
  };

  const getColorFromAddress = (addr: string) => {
    const colors = [
      "from-purple-500 to-violet-600",
      "from-violet-500 to-purple-600",
      "from-fuchsia-500 to-purple-500",
      "from-purple-600 to-violet-700"
    ];
    const index = parseInt(addr.slice(2, 4), 16) % colors.length;
    return colors[index];
  };

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    
    // Navigate to the corresponding route
    const navItem = allNavItems.find(item => item.id === tabId);
    if (navItem) {
      navigate(navItem.path);
    }
    
    setIsMobileMenuOpen(false);
  };

  const handleCreateClick = () => {
    if (account) {
      navigate("/create");
    } else {
      navigate("/login");
    }
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (account) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
    setIsMobileMenuOpen(false);
  };

  // All navigation items - Updated Contracts icon and label
  const allNavItems = [
    { id: "home", icon: Home, label: "Home", mobile: true, path: "/home" },
    { id: "projects", icon: Briefcase, label: "Projects", mobile: false, path: "/projects" },
    { id: "messages", icon: MessageSquare, label: "Messages", mobile: true, path: "/messages" },
    { id: "contracts", icon: FileText, label: "Contracts", mobile: true, path: "/contracts/:action?" }, // Changed icon and label
    { id: "saved", icon: Bookmark, label: "Saved", mobile: false, path: "/saved" },
  ];

  // Mobile navigation items (only essential ones)
  const mobileNavItems = allNavItems.filter(item => item.mobile);
  const desktopNavItems = allNavItems;

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:fixed lg:flex lg:left-6 lg:top-1/2 lg:-translate-y-1/2 z-50">
        <div className="flex flex-col items-center gap-4 p-4 bg-black/95 backdrop-blur-2xl rounded-3xl border border-gray-900 shadow-2xl">
          
          {/* Logo - Top */}
          <div className="mb-1">
            <button
              onClick={() => navigate("/")}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/20"
            >
              <LogoSVG className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-3">
            {desktopNavItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-900/30 scale-105 border border-purple-500/30"
                      : "bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 hover:shadow-md"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
                
                {/* Tooltip on hover */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-2"></div>

          {/* Settings & Help */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <button onClick={() => navigate("/settings")} className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300">
                <Settings className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Settings
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>

            <div className="relative group">
              <button onClick={() => navigate("/help")} className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Help
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>
          </div>

          {/* Create Button (Optional) */}
          {showCreateButton && account && (
            <div className="relative group">
              <button
                onClick={handleCreateClick}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/30"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Create
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>
          )}

          {/* User Avatar / Login - Bottom */}
          <div className="mt-2">
            {account ? (
              <div className="relative group">
                <button
                  onClick={handleProfileClick}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden border-2 ${
                    avatarUrl 
                      ? "border-purple-500/30"
                      : `bg-gradient-to-r ${getColorFromAddress(account)} border-purple-500/20`
                  }`}
                >
                  {isLoadingAvatar ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                  ) : avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={profileData?.name || "Profile"}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                  )}
                </button>
                
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {profileData?.name || "Profile"}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button
                  onClick={() => navigate("/login")}
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  Login
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-900">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center border border-purple-500/20">
              <LogoSVG className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              OpenForge
            </span>
          </button>

          {/* Right side - Mobile menu toggle & search */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            {account && (
              <button 
                onClick={() => handleTabClick("contracts")}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="px-4 py-3 border-t border-gray-900 bg-black/95 backdrop-blur-2xl">
            <div className="space-y-2">
              {/* Full navigation in mobile menu */}
              {allNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-purple-600/20 to-violet-700/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              {/* Create Button in mobile menu */}
              {showCreateButton && account && (
                <button 
                  onClick={handleCreateClick}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg border border-purple-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New</span>
                </button>
              )}

              {/* Settings & Help in mobile menu */}
              <div className="pt-3 mt-3 border-t border-gray-900">
                <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                <button onClick={() => navigate("/help")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help</span>
                </button>
                {account ? (
                  <button 
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    {avatarUrl ? (
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-500/30">
                        <img 
                          src={avatarUrl} 
                          alt={profileData?.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getColorFromAddress(account)} border border-purple-500/30`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium">{profileData?.name || "Profile"}</span>
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar - Hidden on desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-gray-900 py-3 px-6">
        <div className="flex items-center justify-around">
          {/* Essential mobile navigation items */}
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center p-2 transition-all duration-300 ${
                activeTab === item.id
                  ? "text-purple-300"
                  : "text-gray-400 hover:text-purple-400"
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {/* Add/Create button in middle */}
          {showCreateButton && account && (
            <button onClick={handleCreateClick} className="flex flex-col items-center p-2">
              <div className="w-14 h-14 -mt-8 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 flex items-center justify-center shadow-xl border border-purple-500/30">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-300 mt-1">Create</span>
            </button>
          )}

          {/* User profile/login on mobile */}
          {account ? (
            <button
              onClick={handleProfileClick}
              className={`flex flex-col items-center p-2 transition-all duration-300 ${
                activeTab === "profile" ? "text-purple-300" : "text-gray-400 hover:text-purple-400"
              }`}
            >
              {avatarUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-sm">
                  <img 
                    src={avatarUrl} 
                    alt={profileData?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorFromAddress(account)} border-2 border-purple-500/30`}>
                  <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                </div>
              )}
              <span className="text-xs font-medium mt-1">Me</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <LogIn className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Login</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}