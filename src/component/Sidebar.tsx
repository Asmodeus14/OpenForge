import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../hooks/web3";
import { 
  Home, 
  Briefcase, 
  FileText,
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
        const cid = await getProfileFlow(account);
        if (!cid) {
          setProfileData(null);
          setAvatarUrl("");
          return;
        }

        const ipfsGateway = "https://ipfs.io/ipfs/";
        const response = await fetch(`${ipfsGateway}${cid}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          
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
      
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setAvatarUrl(url);
      } else {
        const extensions = ['', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        for (const ext of extensions) {
          const testUrl = `${ipfsGateway}${cid}${ext}`;
          try {
            const testResponse = await fetch(testUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              setAvatarUrl(testUrl);
              break;
            }
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

  // All navigation items
  const allNavItems = [
    { id: "home", icon: Home, label: "Home", mobile: true, path: "/home" },
    { id: "projects", icon: Briefcase, label: "Projects", mobile: false, path: "/projects" },
    { id: "messages", icon: MessageSquare, label: "Messages", mobile: true, path: "/messages" },
    { id: "contracts", icon: FileText, label: "Contracts", mobile: true, path: "/contracts/:action?" },
    { id: "saved", icon: Bookmark, label: "Saved", mobile: false, path: "/saved" },
  ];

  // Mobile navigation items
  const mobileNavItems = allNavItems.filter(item => item.mobile);
  const desktopNavItems = allNavItems;

  return (
    <>
      {/* macOS-style Desktop Dock - Hidden on mobile */}
      <div className="hidden lg:flex lg:fixed lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-3 bg-gray-900/30 backdrop-blur-2xl rounded-full border border-gray-700/40 shadow-2xl">
          
          {/* Logo */}
          <div className="ml-1 mr-1">
            <button
              onClick={() => navigate("/")}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/20"
            >
              <img src="openforge.svg" alt="openforge.svg" className="w-6 h-6" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-700/50 to-transparent"></div>

          {/* Navigation Icons */}
          <nav className="flex items-center gap-1">
            {desktopNavItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center justify-center transition-all duration-300 ${
                    activeTab === item.id
                      ? "text-white bg-gradient-to-r from-purple-500/20 to-violet-600/20 border border-purple-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 hover:border hover:border-gray-700/30"
                  } w-12 h-12 rounded-2xl`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
                
                {/* Tooltip above on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {item.label}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
                </div>
              </div>
            ))}
          </nav>

          {/* Settings & Help */}
          <div className="flex items-center gap-1">
            <div className="relative group">
              <button onClick={() => navigate("/settings")} className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 hover:border hover:border-gray-700/30 transition-all duration-300">
                <Settings className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Settings
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
              </div>
            </div>

            <div className="relative group">
              <button onClick={() => navigate("/help")} className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 hover:border hover:border-gray-700/30 transition-all duration-300">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Help
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-700/50 to-transparent"></div>

          {/* Create Button (Optional) */}
          {showCreateButton && account && (
            <div className="relative group">
              <button
                onClick={handleCreateClick}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/30"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Create
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
              </div>
            </div>
          )}

          {/* User Avatar / Login */}
          <div className="ml-1">
            {account ? (
              <div className="relative group">
                <button
                  onClick={handleProfileClick}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden border-2 ${
                    avatarUrl 
                      ? "border-purple-500/30"
                      : `bg-gradient-to-r ${getColorFromAddress(account)} border-purple-500/20`
                  }`}
                >
                  {isLoadingAvatar ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center rounded-2xl">
                      <User className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                  ) : avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={profileData?.name || "Profile"}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                  )}
                </button>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {profileData?.name || "Profile"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button
                  onClick={() => navigate("/login")}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 hover:border hover:border-gray-700/30 transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  Login
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Top Bar - Updated for consistency */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-2xl border-b border-gray-700/40">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center border border-purple-500/20">
              <img src="openforge.svg" alt="openforge" className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              OpenForge
            </span>
          </button>

          {/* Right side - Mobile menu toggle & search */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800/30 rounded-2xl transition-colors">
              <Search className="w-5 h-5" />
            </button>
            {account && (
              <button 
                onClick={() => handleTabClick("contracts")}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800/30 rounded-2xl transition-colors"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800/30 rounded-2xl transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
            }
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="px-4 py-3 border-t border-gray-700/40 bg-gray-900/30 backdrop-blur-2xl">
            <div className="space-y-2">
              {/* Full navigation in mobile menu */}
              {allNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-purple-600/20 to-violet-700/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/30"
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
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg border border-purple-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New</span>
                </button>
              )}

              {/* Settings & Help in mobile menu */}
              <div className="pt-3 mt-3 border-t border-gray-700/40">
                <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-2xl transition-colors">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                <button onClick={() => navigate("/help")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-2xl transition-colors">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help</span>
                </button>
                {account ? (
                  <button 
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-2xl transition-colors"
                  >
                    {avatarUrl ? (
                      <div className="w-8 h-8 rounded-2xl overflow-hidden border border-purple-500/30">
                        <img 
                          src={avatarUrl} 
                          alt={profileData?.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${getColorFromAddress(account)} border border-purple-500/30`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium">{profileData?.name || "Profile"}</span>
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-2xl transition-colors">
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar - Updated for consistency */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-2xl border-t border-gray-700/40 py-3 px-6">
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
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-purple-500/20 to-violet-600/20 border border-purple-500/30"
                  : "hover:bg-gray-800/30"
              }`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {/* Add/Create button in middle */}
          {showCreateButton && account && (
            <button onClick={handleCreateClick} className="flex flex-col items-center p-2">
              <div className="w-14 h-14 -mt-8 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 flex items-center justify-center shadow-xl border border-purple-500/30">
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
              <div className={`w-12 h-12 rounded-2xl mb-1 overflow-hidden border-2 ${
                activeTab === "profile" 
                  ? "border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-violet-600/20"
                  : "border-purple-500/20"
              }`}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={profileData?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${getColorFromAddress(account)}`}>
                    <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium mt-1">Me</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 hover:bg-gray-800/30">
                <LogIn className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Login</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}