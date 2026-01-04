import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWeb3 } from '../hooks/web3';
import { useProfiles, getAvatarUrl, getDisplayName } from '../hooks/useProfile';
import io, { Socket } from 'socket.io-client';
import { ethers } from 'ethers';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from '../component/Sidebar';
import { 
  Send, 
  Users, 
  Lock, 
  CheckCircle, 
  XCircle,
  LogOut,
  Trash2,
  Plus,
  MoreVertical,
  ThumbsUp,
  Search,
  RefreshCw,
  MessageSquare,
  Bell,
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Mail,
  UserPlus,
  Copy,
  Globe,
  Crown,
  X,
  Smile,
  Maximize2,
  Minimize2,
  Sparkles,
  Rocket,
  ExternalLink,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Download,
  Eye,
  EyeOff,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings,
  Hash,
  AtSign,
  Video,
  Mic,
  Paperclip,
  MoreHorizontal,
  Bot,
  Shield,
  Star
} from 'lucide-react';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Emoji data
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌'],
  hands: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👆', '👇', '👈', '👉', '🖐️', '✋', '👋', '🤚', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄'],
};

// Types
interface Room {
  id: string;
  name: string;
  description: string;
  room_type: 'public' | 'private' | 'p2p';
  admin_id: string;
  is_active: boolean;
  created_at: string;
  is_admin: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'left';
  member_count?: number;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_wallet: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  like_count: number;
  liked_by?: string[];
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  thumbnail_url?: string;
  created_at: string;
}

interface RoomMember {
  user_id: string;
  wallet_address: string;
  status: string;
  is_admin: boolean;
  joined_at: string;
}

interface RoomRequest {
  id: string;
  user_id: string;
  wallet_address: string;
  status: string;
  created_at: string;
}

interface Invitation {
  id: string;
  room_id: string;
  room_name: string;
  inviter_id: string;
  inviter_wallet: string;
  invitee_wallet_address: string;
  status: string;
  created_at: string;
  expires_at: string;
}

// Link detection regex patterns
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MENTION_REGEX = /(@[a-zA-Z0-9_]+)/g;
const HASHTAG_REGEX = /(#[a-zA-Z0-9_]+)/g;
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const IPFS_REGEX = /(ipfs:\/\/[a-zA-Z0-9]+)/g;
const ETH_ADDRESS_REGEX = /(0x[a-fA-F0-9]{40})/g;

// Helper function to detect content type
const detectContentType = (content: string) => {
  if (URL_REGEX.test(content)) return 'link';
  if (content.includes('```')) return 'code';
  if (MENTION_REGEX.test(content)) return 'mention';
  if (content.length > 500) return 'long';
  return 'text';
};

// Helper function to extract links
const extractLinks = (text: string): Array<{url: string, display: string}> => {
  const links: Array<{url: string, display: string}> = [];
  
  const urlMatches = text.match(URL_REGEX) || [];
  urlMatches.forEach(url => {
    links.push({
      url,
      display: url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    });
  });
  
  const ipfsMatches = text.match(IPFS_REGEX) || [];
  ipfsMatches.forEach(ipfsUrl => {
    links.push({
      url: `https://ipfs.io/ipfs/${ipfsUrl.replace('ipfs://', '')}`,
      display: `ipfs://${ipfsUrl.replace('ipfs://', '').substring(0, 12)}...`
    });
  });
  
  return links;
};

// Helper function to parse and format message content
const parseMessageContent = (content: string): JSX.Element[] => {
  const parts: JSX.Element[] = [];
  let remaining = content;
  let key = 0;

  const codeBlockRegex = /```([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    segments.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.substring(lastIndex) });
  }

  segments.forEach(segment => {
    if (segment.type === 'code') {
      parts.push(
        <pre key={key++} className="bg-[#0a0a0a] text-gray-100 p-4 rounded-lg overflow-x-auto my-2 border border-gray-900">
          <code className="font-mono text-sm">{segment.content}</code>
        </pre>
      );
    } else {
      const text = segment.content;
      const elements: (string | JSX.Element)[] = [];
      let tempText = text;

      URL_REGEX.lastIndex = 0;
      const urlMatches = Array.from(text.matchAll(URL_REGEX));
      
      if (urlMatches.length > 0) {
        let lastIndex = 0;
        urlMatches.forEach((match, idx) => {
          const url = match[0];
          const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
          
          if (match.index! > lastIndex) {
            elements.push(text.substring(lastIndex, match.index!));
          }
          
          elements.push(
            <a
              key={`url-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              {displayUrl.length > 40 ? `${displayUrl.substring(0, 40)}...` : displayUrl}
            </a>
          );
          
          lastIndex = match.index! + url.length;
        });
        
        if (lastIndex < text.length) {
          elements.push(text.substring(lastIndex));
        }
        
        parts.push(
          <span key={key++} className="whitespace-pre-wrap break-words">
            {elements}
          </span>
        );
      } else {
        parts.push(
          <span key={key++} className="whitespace-pre-wrap break-words">
            {text}
          </span>
        );
      }
    }
  });

  return parts;
};

const LinkPreview = ({ url }: { url: string }) => {
  const [metadata, setMetadata] = useState<{
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/metadata?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-3 border border-gray-900 rounded-lg bg-[#0a0a0a] animate-pulse">
        <div className="h-4 bg-gray-900 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-900 rounded w-full"></div>
      </div>
    );
  }

  if (error || !metadata) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block border border-gray-900 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {metadata.image && (
        <div className="h-40 bg-[#0a0a0a] overflow-hidden">
          <img
            src={metadata.image}
            alt={metadata.title || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3 bg-[#0a0a0a]">
        {metadata.siteName && (
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {metadata.siteName}
          </p>
        )}
        {metadata.title && (
          <p className="font-medium text-gray-200 mb-1 line-clamp-1">
            {metadata.title}
          </p>
        )}
        {metadata.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {metadata.description}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-2 truncate">
          {url.replace(/^https?:\/\//, '')}
        </p>
      </div>
    </a>
  );
};

const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  const compareToday = new Date(today);
  compareToday.setHours(0, 0, 0, 0);
  const compareYesterday = new Date(yesterday);
  compareYesterday.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() === compareToday.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === compareYesterday.getTime()) {
    return 'Yesterday';
  } else {
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatFullDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const groupMessagesByDate = (messages: Message[]): { [date: string]: Message[] } => {
  const grouped: { [date: string]: Message[] } = {};
  
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  sortedMessages.forEach(message => {
    const date = new Date(message.created_at);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(message);
  });
  
  return grouped;
};

const useChatAuth = () => {
  const { account } = useWeb3();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);

  const getStoredToken = (walletAddress: string): string | null => {
    try {
      const authData = localStorage.getItem(`chat_auth_${walletAddress}`);
      return authData;
    } catch (error) {
      return null;
    }
  };

  const setStoredToken = (walletAddress: string, token: string) => {
    localStorage.setItem(`chat_auth_${walletAddress}`, token);
  };

  const clearStoredToken = (walletAddress?: string) => {
    if (walletAddress) {
      localStorage.removeItem(`chat_auth_${walletAddress}`);
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat_auth_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const getNonce = async (walletAddress: string): Promise<{nonce: string, message: string}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get nonce');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Get nonce error:', error);
      throw error;
    }
  };

  const authenticate = async (): Promise<string | null> => {
    if (!account) {
      setAuthError('Wallet not connected');
      return null;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const storedToken = getStoredToken(account);
      if (storedToken && currentWallet === account) {
        return storedToken;
      }

      if (currentWallet && currentWallet !== account) {
        clearStoredToken(currentWallet);
      }

      const nonceData = await getNonce(account);
      const message = nonceData.message;
      
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          signature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();
      const newToken = data.token;
      
      if (!newToken) {
        throw new Error('No token received from server');
      }

      setStoredToken(account, newToken);
      setToken(newToken);
      setCurrentWallet(account);
      
      toast.success('Authentication successful!', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      return newToken;
    } catch (error: any) {
      console.error('Authentication error:', error);
      setAuthError(error.message || 'Authentication failed');
      toast.error(`Authentication failed: ${error.message}`, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      
      clearStoredToken(account);
      setToken(null);
      setCurrentWallet(null);
      
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    if (currentWallet) {
      clearStoredToken(currentWallet);
    }
    setToken(null);
    setCurrentWallet(null);
    setAuthError(null);
  };

  useEffect(() => {
    if (account && !isAuthenticating) {
      const storedToken = getStoredToken(account);
      
      if (storedToken) {
        setToken(storedToken);
        setCurrentWallet(account);
      } else {
        authenticate();
      }
    }
  }, [account]);

  return {
    token,
    isAuthenticating,
    authError,
    authenticate,
    logout,
    currentWallet
  };
};

const DateSeparator: React.FC<{ date: string }> = ({ date }) => {
  const today = new Date();
  const separatorDate = new Date(date);
  
  const isToday = separatorDate.toDateString() === today.toDateString();
  const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === separatorDate.toDateString();
  
  let displayText = '';
  if (isToday) {
    displayText = 'Today';
  } else if (isYesterday) {
    displayText = 'Yesterday';
  } else {
    const diffTime = Math.abs(new Date().getTime() - separatorDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      displayText = separatorDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      displayText = separatorDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: separatorDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
  }
  
  return (
    <div className="flex items-center justify-center my-6">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#111] backdrop-blur-sm rounded-full border border-gray-900">
        <CalendarDays className="w-3 h-3 text-cyan-400" />
        <span className="text-xs font-medium text-gray-300">{displayText}</span>
        <span className="text-xs text-gray-600">
          {separatorDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

const TimeSeparator: React.FC<{ time: string }> = ({ time }) => {
  return (
    <div className="flex items-center justify-center my-3">
      <div className="flex items-center gap-1 px-2 py-0.5 bg-[#111] rounded-full backdrop-blur-sm">
        <Clock className="w-2.5 h-2.5 text-gray-600" />
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
};

const isSameSenderAndTime = (msg1: Message, msg2: Message, timeThresholdMinutes = 5): boolean => {
  if (msg1.sender_wallet !== msg2.sender_wallet) return false;
  
  const time1 = new Date(msg1.created_at).getTime();
  const time2 = new Date(msg2.created_at).getTime();
  const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);
  
  return diffMinutes <= timeThresholdMinutes;
};

const ChatPage: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnecting, isWalletInstalled } = useWeb3();
  const {
    token,
    isAuthenticating,
    authError,
    authenticate,
    logout: logoutChat,
    currentWallet
  } = useChatAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RoomRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'public' | 'invites'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [inviteWallet, setInviteWallet] = useState('');
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    roomType: 'public' as 'public' | 'private'
  });
  const [roomMenuOpen, setRoomMenuOpen] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [messageRows, setMessageRows] = useState(1);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showRoomSidebar, setShowRoomSidebar] = useState(false);
  const [previewLinks, setPreviewLinks] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isScrolling, setIsScrolling] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  const uniqueWalletAddresses = useMemo(() => {
    const addresses = new Set<string>();
    
    if (account) addresses.add(account);
    rooms.forEach(room => { if (room.admin_id) addresses.add(room.admin_id); });
    messages.forEach(message => { if (message.sender_wallet) addresses.add(message.sender_wallet); });
    roomMembers.forEach(member => { if (member.wallet_address) addresses.add(member.wallet_address); });
    invitations.forEach(invite => { if (invite.inviter_wallet) addresses.add(invite.inviter_wallet); });
    
    return Array.from(addresses);
  }, [account, rooms, messages, roomMembers, invitations]);

  const { profiles: fetchedProfiles, loading: profilesLoading } = useProfiles(uniqueWalletAddresses);

  useEffect(() => {
    if (fetchedProfiles) {
      setUserProfiles(fetchedProfiles);
    }
  }, [fetchedProfiles]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      setMessageRows(Math.min(Math.floor(textarea.scrollHeight / 24), 5));
    }
  };

  useEffect(() => {
    if (token && account && currentWallet === account) {
      const newSocket = io(SOCKET_URL, {
        auth: { 
          token: token,
          walletAddress: account 
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        toast.success('Connected to chat server', {
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        });
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        toast.error('Failed to connect to chat server', {
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        });
      });

      newSocket.on('new_message', (message: Message) => {
        if (selectedRoom && message.room_id === selectedRoom.id) {
          setMessages(prev => {
            const newMessages = [...prev, message];
            return newMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          scrollToBottom();
        }
      });

      newSocket.on('message_liked', (data) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { 
                ...msg, 
                like_count: data.likeCount,
                liked_by: data.likeCount > (msg.like_count || 0)
                  ? [...(msg.liked_by || []), data.walletAddress]
                  : (msg.liked_by || []).filter(addr => addr !== data.walletAddress)
              }
            : msg
        ));
      });

      newSocket.on('user_typing', (data) => {
        if (selectedRoom && data.roomId === selectedRoom.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(data.walletAddress);
            return newSet;
          });

          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.walletAddress);
              return newSet;
            });
          }, 3000);
        }
      });

      newSocket.on('error', (data) => {
        toast.error(data.message, {
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, account, currentWallet, selectedRoom]);

  useEffect(() => {
    if (token && account && currentWallet === account) {
      loadUserRooms();
      loadPublicRooms();
      loadInvitations();
    } else {
      setRooms([]);
      setPublicRooms([]);
      setInvitations([]);
      setMessages([]);
      setSelectedRoom(null);
    }
  }, [token, account, currentWallet]);

  useEffect(() => {
    if (selectedRoom && selectedRoom.id && token) {
      loadRoomMessages(selectedRoom.id);
      loadRoomMembers(selectedRoom.id);
      if (selectedRoom.room_type === 'public' && selectedRoom.is_admin) {
        loadPendingRequests(selectedRoom.id);
      }
    }
  }, [selectedRoom, token]);

  useEffect(() => {
    if (!isScrolling) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 100);
  };

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutChat();
        throw new Error('Session expired. Please reconnect.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('API request error:', error);
      throw error;
    }
  };

  const loadUserRooms = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/rooms/my');
      setRooms([...data.approvedRooms, ...data.pendingRooms]);
    } catch (error: any) {
      console.error('Load rooms error:', error);
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicRooms = async () => {
    try {
      const data = await apiRequest('/rooms/public?limit=50');
      setPublicRooms(data.rooms);
    } catch (error: any) {
      console.error('Failed to load public rooms:', error);
    }
  };

  const loadRoomMessages = async (roomId: string) => {
    if (!roomId || roomId === 'undefined') {
      console.error('Invalid roomId for loading messages:', roomId);
      setMessages([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await apiRequest(`/rooms/${roomId}/messages?limit=100`);
      
      const messagesWithDefaults = (data.messages || []).map((msg: any) => ({
        ...msg,
        liked_by: msg.liked_by || [],
        like_count: msg.like_count || 0,
        attachments: msg.attachments || []
      }));
      
      const sortedMessages = messagesWithDefaults.sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setMessages(sortedMessages);
      setCollapsedDates(new Set());
    } catch (error: any) {
      console.error('Failed to load room messages:', error);
      if (!error.message.includes('Invalid') && !error.message.includes('not found')) {
        toast.error(error.message, {
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        });
      }
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoomMembers = async (roomId: string) => {
    try {
      const data = await apiRequest(`/rooms/${roomId}`);
      setRoomMembers(data.members || []);
    } catch (error: any) {
      console.error('Failed to load room members:', error);
    }
  };

  const loadPendingRequests = async (roomId: string) => {
    if (!roomId || roomId === 'undefined') {
      console.error('Invalid roomId for loading requests:', roomId);
      setPendingRequests([]);
      return;
    }
    
    try {
      const data = await apiRequest(`/rooms/${roomId}/requests`);
      if (data.success && data.requests) {
        setPendingRequests(data.requests);
      } else {
        setPendingRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
      setPendingRequests([]);
    }
  };

  const loadInvitations = async () => {
    try {
      const data = await apiRequest('/invitations');
      if (data.success && data.invitations) {
        setInvitations(data.invitations);
      } else {
        setInvitations([]);
      }
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
      toast.error('Failed to load invitations', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      setInvitations([]);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setIsLoading(true);
      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoom.name,
          description: newRoom.description,
          roomType: newRoom.roomType
        })
      });

      toast.success('Room created successfully', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      setShowCreateRoom(false);
      setNewRoom({ name: '', description: '', roomType: 'public' });
      loadUserRooms();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await apiRequest(`/rooms/${roomId}/join`, {
        method: 'POST'
      });
      toast.success('Join request sent to admin', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      loadUserRooms();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      await apiRequest(`/rooms/${roomId}/leave`, {
        method: 'POST'
      });
      toast.success('Left room successfully', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
        setPendingRequests([]);
      }
      loadUserRooms();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await apiRequest(`/rooms/${roomId}`, {
        method: 'DELETE'
      });
      toast.success('Room deleted successfully', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
        setPendingRequests([]);
      }
      loadUserRooms();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleInviteUser = async (roomId: string, walletAddress: string) => {
    try {
      if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        toast.error('Please enter a valid wallet address', {
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        });
        return;
      }

      await apiRequest(`/rooms/${roomId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress })
      });

      toast.success(`Invitation sent to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      setShowInviteModal(false);
      setInviteWallet('');
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleApproveRequest = async (requestId: string, roomId: string) => {
    if (!requestId || requestId === 'undefined') {
      toast.error('Invalid request ID', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      return;
    }
    
    try {
      await apiRequest(`/rooms/${roomId}/requests/${requestId}/approve`, {
        method: 'POST'
      });
      toast.success('Request approved', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      loadPendingRequests(roomId);
      loadRoomMembers(roomId);
      loadUserRooms();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleRejectRequest = async (requestId: string, roomId: string) => {
    if (!requestId || requestId === 'undefined') {
      toast.error('Invalid request ID', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      return;
    }
    
    try {
      await apiRequest(`/rooms/${roomId}/requests/${requestId}/reject`, {
        method: 'POST'
      });
      toast.success('Request rejected', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      loadPendingRequests(roomId);
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const result = await apiRequest(`/invitations/${invitationId}/accept`, {
        method: 'POST'
      });
      toast.success('Invitation accepted', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      loadInvitations();
      loadUserRooms();
      
      if (result.room_id) {
        const acceptedRoom = rooms.find(room => room.id === result.room_id) || 
                           publicRooms.find(room => room.id === result.room_id);
        if (acceptedRoom) {
          setSelectedRoom(acceptedRoom);
        }
      }
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await apiRequest(`/invitations/${invitationId}/reject`, {
        method: 'POST'
      });
      toast.success('Invitation rejected', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      loadInvitations();
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !fileInput) || !selectedRoom || !socket) return;

    try {
      if (fileInput) {
        await uploadFileMessage(fileInput);
      } else {
        socket.emit('send_message', {
          roomId: selectedRoom.id,
          content: newMessage.trim()
        });
        setNewMessage('');
        adjustTextareaHeight();
      }
    } catch (error: any) {
      toast.error(error.message, {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const uploadFileMessage = async (file: File) => {
    if (!selectedRoom || !token) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', selectedRoom.id);

      const response = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      if (socket) {
        socket.emit('send_message', {
          roomId: selectedRoom.id,
          content: data.message.content,
          attachments: data.message.attachments
        });
      }

      setFileInput(null);
      toast.success('File uploaded successfully', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
      return;
    }

    setFileInput(file);
    toast.success(`Selected: ${file.name}`, {
      style: {
        background: '#000',
        color: '#fff',
        border: '1px solid #222'
      }
    });
  };

  const handleTyping = () => {
    if (!selectedRoom || !socket) return;

    socket.emit('typing', { roomId: selectedRoom.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId: selectedRoom.id });
    }, 3000);
  };

  const handleLikeMessage = async (messageId: string) => {
    if (!socket || !messageId) return;

    try {
      socket.emit('like_message', { messageId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to like message', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const handleUnlikeMessage = async (messageId: string) => {
    if (!socket || !messageId) return;

    try {
      socket.emit('unlike_message', { messageId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlike message', {
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #222'
        }
      });
    }
  };

  const formatWalletAddress = (address?: string) => {
    if (!address) return 'Unknown';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Mic className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (mimeType.includes('text/') || mimeType.includes('code/')) return <Code className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getRoomIcon = (roomType: string) => {
    switch (roomType) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'p2p': return <User className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const filterRooms = (rooms: Room[], query: string) => {
    if (!query.trim()) return rooms;
    
    const searchTerm = query.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(searchTerm) ||
      (room.description && room.description.toLowerCase().includes(searchTerm)) ||
      room.room_type.toLowerCase().includes(searchTerm)
    );
  };

  const filteredRooms = filterRooms(rooms, searchQuery);
  const filteredPublicRooms = filterRooms(publicRooms, searchQuery);

  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard', {
      style: {
        background: '#000',
        color: '#fff',
        border: '1px solid #222'
      }
    });
  };

  const renderMessageContent = (message: Message) => {
    const content = message.content;
    const isExpanded = expandedMessages.has(message.id);
    const isLongMessage = content.length > 500;
    const displayContent = isLongMessage && !isExpanded 
      ? content.substring(0, 500) + '...' 
      : content;

    const links = extractLinks(displayContent);
    const hasLinks = links.length > 0;
    const contentType = detectContentType(displayContent);

    return (
      <div className="space-y-2">
        <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-200">
          {parseMessageContent(displayContent)}
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="border border-gray-900 rounded-lg overflow-hidden bg-[#0a0a0a]">
                {attachment.mime_type.startsWith('image/') ? (
                  <div className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.file_name}
                      className="w-full h-auto max-h-64 object-contain bg-black"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#111] rounded-full shadow-lg border border-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4 text-gray-300" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#0a0a0a] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#111] flex items-center justify-center">
                      {getFileIcon(attachment.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-gray-200">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#111] rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {previewLinks && hasLinks && (
          <div className="space-y-2">
            {links.map((link, idx) => (
              <LinkPreview key={idx} url={link.url} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newSet = new Set(expandedMessages);
                if (isExpanded) {
                  newSet.delete(message.id);
                } else {
                  newSet.add(message.id);
                }
                setExpandedMessages(newSet);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Read more
                </>
              )}
            </button>

            {hasLinks && (
              <button
                onClick={() => setPreviewLinks(!previewLinks)}
                className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                {previewLinks ? 'Hide links' : 'Show links'}
              </button>
            )}

            {contentType === 'code' && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Code className="w-3 h-3" />
                Code
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasLinks && links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-cyan-400"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMessagesWithDateGroups = () => {
    if (messages.length === 0) return null;

    const grouped = groupMessagesByDate(messages);
    const dateKeys = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return dateKeys.map((dateKey) => {
      const dateMessages = grouped[dateKey];
      const isCollapsed = collapsedDates.has(dateKey);
      
      const timeBlocks: { time: string; messages: Message[] }[] = [];
      let currentBlock: Message[] = [];
      let currentBlockStart: Date | null = null;

      dateMessages.forEach((message, index) => {
        const messageTime = new Date(message.created_at);
        
        if (!currentBlockStart) {
          currentBlockStart = messageTime;
          currentBlock.push(message);
        } else {
          const diffMinutes = (messageTime.getTime() - currentBlockStart.getTime()) / (1000 * 60);
          
          if (diffMinutes > 30) {
            timeBlocks.push({
              time: formatTime(currentBlockStart.toISOString()),
              messages: [...currentBlock]
            });
            currentBlock = [message];
            currentBlockStart = messageTime;
          } else {
            currentBlock.push(message);
          }
        }

        if (index === dateMessages.length - 1 && currentBlock.length > 0) {
          timeBlocks.push({
            time: formatTime(currentBlockStart!.toISOString()),
            messages: [...currentBlock]
          });
        }
      });

      return (
        <div key={dateKey} className="mb-6">
          <DateSeparator date={dateKey} />
          
          {dateMessages.length > 10 && (
            <button
              onClick={() => {
                const newSet = new Set(collapsedDates);
                if (isCollapsed) {
                  newSet.delete(dateKey);
                } else {
                  newSet.add(dateKey);
                }
                setCollapsedDates(newSet);
              }}
              className="w-full flex items-center justify-center gap-2 mb-3 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show {dateMessages.length} messages from {formatDate(dateKey)}
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide messages from {formatDate(dateKey)}
                </>
              )}
            </button>
          )}
          
          {!isCollapsed && (
            <div className="space-y-1">
              {timeBlocks.map((block, blockIndex) => (
                <div key={`${dateKey}-${blockIndex}`}>
                  {blockIndex > 0 && <TimeSeparator time={block.time} />}
                  {block.messages.map((message, msgIndex) => {
                    const isOwnMessage = message.sender_wallet === account;
                    const isLikedByMe = message.liked_by ? message.liked_by.includes(account) : false;
                    const profile = userProfiles[message.sender_wallet];
                    const displayName = getDisplayName(message.sender_wallet, profile);
                    const avatarUrl = getAvatarUrl(profile);
                    
                    const showSenderInfo = msgIndex === 0 || 
                      !isSameSenderAndTime(message, block.messages[msgIndex - 1]);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 group max-w-full`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 ${isOwnMessage 
                          ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-900/10 border border-cyan-900/50 backdrop-blur-sm' 
                          : 'bg-[#0a0a0a] border border-gray-900 backdrop-blur-sm'
                        } hover:border-cyan-500/30 transition-all duration-200`}>
                          
                          {showSenderInfo && !isOwnMessage && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-900">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        const icon = document.createElement('div');
                                        icon.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-black';
                                        icon.innerHTML = '<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                                        parent.appendChild(icon);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-black">
                                    <User className="w-4 h-4 text-cyan-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`font-bold text-sm truncate ${isOwnMessage 
                                    ? 'text-cyan-400' 
                                    : 'text-gray-300'
                                  }`}>
                                    {isOwnMessage ? 'You' : displayName}
                                  </span>
                                  <span className={`text-xs whitespace-nowrap ${isOwnMessage ? 'text-cyan-400/70' : 'text-gray-600'}`}>
                                    {formatTime(message.created_at)}
                                  </span>
                                  {message.is_edited && (
                                    <span className="text-xs italic text-gray-600 whitespace-nowrap">(edited)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {isOwnMessage && !showSenderInfo && (
                            <div className="text-right mb-1">
                              <span className="text-xs text-cyan-400/70">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}

                          <div className={showSenderInfo && !isOwnMessage ? '' : 'mt-1'}>
                            {renderMessageContent(message)}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => 
                                  isLikedByMe 
                                    ? handleUnlikeMessage(message.id)
                                    : handleLikeMessage(message.id)
                                }
                                className={`p-1 rounded transition-colors ${isLikedByMe 
                                  ? 'text-cyan-400 hover:text-cyan-300' 
                                  : 'text-gray-600 hover:text-cyan-400'
                                }`}
                                title={isLikedByMe ? "Unlike" : "Like"}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              {message.like_count > 0 && (
                                <span className="text-xs text-gray-500">
                                  {message.like_count}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 text-gray-600 hover:text-cyan-400"
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  toast.success('Message copied!', {
                                    style: {
                                      background: '#000',
                                      color: '#fff',
                                      border: '1px solid #222'
                                    }
                                  });
                                }}
                                title="Copy message"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <button
                                  className="p-1 text-gray-600 hover:text-cyan-400"
                                  onClick={() => {
                                    const attachmentLinks = message.attachments!.map(a => a.url).join('\n');
                                    navigator.clipboard.writeText(attachmentLinks);
                                    toast.success('Attachment links copied!', {
                                    style: {
                                      background: '#000',
                                      color: '#fff',
                                      border: '1px solid #222'
                                    }
                                  });
                                  }}
                                  title="Copy attachment links"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] rounded-2xl p-8 text-center border border-gray-900">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-900/30 to-black rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-900/50">
            <Users className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            OpenForge Chat
          </h1>
          <p className="mb-8 text-gray-500">
            Connect your wallet to start chatting with the OpenForge community. 
            Collaborate, share ideas, and build amazing projects together.
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting || !isWalletInstalled}
            className="w-full bg-gradient-to-r from-cyan-900/30 to-black hover:from-cyan-800/30 hover:to-black text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-cyan-900/50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
          {!isWalletInstalled && (
            <p className="text-amber-400 mt-4 text-sm">
              Please install a Web3 wallet like MetaMask to continue.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-900/30 to-black flex items-center justify-center mx-auto mb-4 border border-cyan-900/50">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-5 blur-xl"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-200">Authenticating...</h2>
          <p className="text-gray-500">Please sign the message in your wallet</p>
        </div>
      </div>
    );
  }

  if (authError && !token) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] rounded-2xl p-8 text-center border border-gray-900">
          <div className="w-20 h-20 bg-gradient-to-br from-red-900/30 to-black rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/50">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Authentication Failed</h2>
          <p className="mb-6 text-gray-500">{authError}</p>
          <div className="flex gap-3">
            <button
              onClick={authenticate}
              className="flex-1 bg-gradient-to-r from-cyan-900/30 to-black hover:from-cyan-800/30 hover:to-black text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-cyan-900/50"
            >
              Retry
            </button>
            <button
              onClick={disconnectWallet}
              className="flex-1 bg-[#0a0a0a] hover:bg-[#111] text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-gray-900"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #222'
          }
        }}
      />
      
      {/* Main App Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-20 z-30">
        <Sidebar activeTab="messages" showCreateButton={false} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-20 min-h-screen w-full">
        <div className="flex h-full">
          {/* Chat Rooms Sidebar */}
          <div className={`
            ${showRoomSidebar ? 'block' : 'hidden'} 
            lg:block
            w-full lg:w-72 xl:w-80
            bg-[#0a0a0a]
            border-r border-gray-900
            lg:relative lg:z-10
            fixed inset-y-0 left-0 z-40
            transform transition-transform duration-300
            ${showRoomSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile close button */}
            {showRoomSidebar && (
              <div className="lg:hidden absolute top-4 right-4 z-50">
                <button
                  onClick={() => setShowRoomSidebar(false)}
                  className="p-2 bg-[#111] rounded-full shadow-lg border border-gray-900 hover:bg-[#1a1a1a]"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            )}
            
            <div className="h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-900">
                <div className="hidden lg:flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-900/30 to-black flex items-center justify-center border border-cyan-900/50">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-gray-200">OpenForge Chat</h2>
                      <p className="text-xs text-gray-600">Collaborate & Connect</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 p-3 rounded-xl bg-[#111] border border-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{rooms.length}</div>
                      <div className="text-xs text-gray-500">My Rooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{publicRooms.length}</div>
                      <div className="text-xs text-gray-500">Public</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{invitations.length}</div>
                      <div className="text-xs text-gray-500">Invites</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111] border border-gray-900 text-gray-200 placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex border-b border-gray-900 bg-black">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'bg-[#111] text-cyan-400 border-b-2 border-cyan-500' : 'hover:bg-[#111] text-gray-500'}`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">My Rooms</span>
                  <span className="sm:hidden">Rooms</span>
                </button>
                <button
                  onClick={() => setActiveTab('public')}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'public' ? 'bg-[#111] text-cyan-400 border-b-2 border-cyan-500' : 'hover:bg-[#111] text-gray-500'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Discover</span>
                  <span className="sm:hidden">Public</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('invites');
                    loadInvitations();
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 relative ${activeTab === 'invites' ? 'bg-[#111] text-cyan-400 border-b-2 border-cyan-500' : 'hover:bg-[#111] text-gray-500'}`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Invites</span>
                  {invitations.length > 0 && (
                    <span className="absolute top-1 right-2 sm:right-4 bg-gradient-to-r from-cyan-900/30 to-black text-cyan-400 text-xs rounded-full w-5 h-5 flex items-center justify-center border border-cyan-900/50">
                      {invitations.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                    <p className="text-sm text-gray-600">Loading...</p>
                  </div>
                ) : activeTab === 'rooms' && filteredRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-3 border border-gray-900">
                      <MessageSquare className="w-6 h-6 text-cyan-400/70" />
                    </div>
                    <p className="text-gray-500 mb-2">No rooms yet</p>
                    <p className="text-sm text-gray-600 mb-4">Create your first room to start chatting</p>
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Create Room
                    </button>
                  </div>
                ) : activeTab === 'rooms' ? (
                  <div className="space-y-2">
                    {filteredRooms.map(room => (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoom(room);
                          setShowRoomSidebar(false);
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group border ${
                          selectedRoom?.id === room.id 
                            ? 'bg-gradient-to-r from-cyan-900/20 to-black border-cyan-900/50' 
                            : 'bg-[#111] border-gray-900 hover:border-cyan-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            room.room_type === 'public' ? 'bg-gradient-to-br from-blue-900/30 to-black border border-blue-900/50' :
                            room.room_type === 'private' ? 'bg-gradient-to-br from-purple-900/30 to-black border border-purple-900/50' :
                            'bg-gradient-to-br from-gray-900 to-black border border-gray-900'
                          }`}>
                            {getRoomIcon(room.room_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate text-gray-200">{room.name}</p>
                              {room.status === 'pending' && (
                                <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-900/50">Pending</span>
                              )}
                              {room.is_admin && (
                                <span className="bg-gradient-to-r from-cyan-900/20 to-black text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-900/50">Admin</span>
                              )}
                            </div>
                            <p className="text-xs truncate text-gray-500">
                              {room.description || `${room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} room`}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomMenuOpen(room.id === roomMenuOpen ? null : room.id);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-300"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {roomMenuOpen === room.id && (
                          <div className="mt-2 p-2 rounded-lg bg-black border border-gray-900 shadow-2xl z-50">
                            <div className="space-y-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyRoomId(room.id);
                                  setRoomMenuOpen(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 hover:bg-[#111] text-gray-300"
                              >
                                <Copy className="w-3 h-3" />
                                Copy Room ID
                              </button>
                              {room.room_type === 'private' && room.is_admin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRoom(room);
                                    setShowInviteModal(true);
                                    setRoomMenuOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 hover:bg-[#111] text-gray-300"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Invite Users
                                </button>
                              )}
                              {room.room_type === 'public' && room.is_admin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRoom(room);
                                    setShowRequestsModal(true);
                                    loadPendingRequests(room.id);
                                    setRoomMenuOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded flex items-center justify-center gap-2 hover:bg-[#111] text-gray-300"
                                >
                                  <Users className="w-3 h-3" />
                                  View Requests ({pendingRequests.filter(r => r.id === room.id).length})
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveRoom(room.id);
                                  setRoomMenuOpen(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded flex items-center gap-2"
                              >
                                <LogOut className="w-3 h-3" />
                                Leave Room
                              </button>
                              {room.is_admin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoom(room.id);
                                    setRoomMenuOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete Room
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'public' ? (
                  <div className="space-y-2">
                    {filteredPublicRooms.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-3 border border-gray-900">
                          <Globe className="w-6 h-6 text-blue-400/70" />
                        </div>
                        <p className="text-gray-500">No public rooms available</p>
                      </div>
                    ) : (
                      filteredPublicRooms.map(room => {
                        const isMember = rooms.some(r => r.id === room.id);
                        const memberStatus = rooms.find(r => r.id === room.id)?.status;
                        
                        return (
                          <div
                            key={room.id}
                            className="p-3 rounded-xl bg-[#111] border border-gray-900 hover:border-blue-900/50 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900/30 to-black flex items-center justify-center border border-blue-900/50">
                                <Globe className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-200">{room.name}</p>
                                <p className="text-xs text-gray-500">
                                  {room.member_count || 0} members
                                </p>
                              </div>
                              <div>
                                {isMember ? (
                                  <button
                                    onClick={() => {
                                      setSelectedRoom(room);
                                      setShowRoomSidebar(false);
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                      memberStatus === 'pending'
                                        ? 'bg-amber-900/30 text-amber-400 border border-amber-900/50'
                                        : 'bg-gradient-to-r from-cyan-900/30 to-black text-cyan-400 border border-cyan-900/50'
                                    }`}
                                  >
                                    {memberStatus === 'pending' ? 'Pending' : 'Open'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoinRoom(room.id)}
                                    className="px-3 py-1 bg-gradient-to-r from-blue-900/30 to-black hover:from-blue-800/30 hover:to-black rounded-lg text-sm font-medium transition-all duration-200 text-blue-400 border border-blue-900/50"
                                  >
                                    Join
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitations.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-3 border border-gray-900">
                          <Bell className="w-6 h-6 text-purple-400/70" />
                        </div>
                        <p className="text-gray-500">No pending invitations</p>
                      </div>
                    ) : (
                      invitations.map(invite => (
                        <div key={invite.id} className="p-3 rounded-xl bg-[#111] border border-gray-900">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center border border-purple-900/50">
                              <Mail className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-200">{invite.room_name || `Room Invitation`}</p>
                              <p className="text-xs text-gray-500">
                                Invited by: {formatWalletAddress(invite.inviter_wallet)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptInvitation(invite.id)}
                              className="flex-1 bg-gradient-to-r from-emerald-900/30 to-black hover:from-emerald-800/30 hover:to-black py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 text-emerald-400 border border-emerald-900/50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectInvitation(invite.id)}
                              className="flex-1 bg-[#111] hover:bg-[#1a1a1a] py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 text-gray-300 border border-gray-900"
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-900 space-y-2 bg-black">
                <button
                  onClick={loadUserRooms}
                  disabled={isLoading}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 text-gray-300 border border-gray-900"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Rooms
                </button>
                <button
                  onClick={() => {
                    logoutChat();
                    disconnectWallet();
                  }}
                  className="w-full bg-gradient-to-r from-red-900/30 to-black hover:from-red-800/30 hover:to-black py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 text-red-400 border border-red-900/50"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className={`
            flex-1
            ${showRoomSidebar ? 'hidden lg:block' : 'block'}
            min-h-screen
            bg-black
            w-full
          `}>
            {selectedRoom ? (
              <>
                <div className="p-4 border-b border-gray-900 bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowRoomSidebar(!showRoomSidebar)}
                      className="lg:hidden p-2 bg-[#111] hover:bg-[#1a1a1a] rounded-lg transition-all duration-200 border border-gray-900"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedRoom.room_type === 'public' ? 'bg-gradient-to-br from-blue-900/30 to-black border border-blue-900/50' :
                      selectedRoom.room_type === 'private' ? 'bg-gradient-to-br from-purple-900/30 to-black border border-purple-900/50' :
                      'bg-gradient-to-br from-gray-900 to-black border border-gray-900'
                    }`}>
                      {getRoomIcon(selectedRoom.room_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-lg truncate text-gray-200">{selectedRoom.name}</h2>
                        {selectedRoom.is_admin && (
                          <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        )}
                        {selectedRoom.status === 'pending' && (
                          <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-1 rounded-full whitespace-nowrap border border-amber-900/50">Pending Approval</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {selectedRoom.description || `${selectedRoom.room_type} room`}
                        {selectedRoom.member_count && ` • ${selectedRoom.member_count} members`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMemberList(!showMemberList)}
                      className="hidden sm:flex px-3 sm:px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] rounded-xl font-medium transition-all duration-200 items-center gap-2 text-gray-300 border border-gray-900"
                      title="View Members"
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">Members</span>
                    </button>

                    {selectedRoom.room_type === 'private' && selectedRoom.is_admin && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="hidden sm:flex px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-900/30 to-black hover:from-purple-800/30 hover:to-black rounded-xl font-medium transition-all duration-200 items-center gap-2 text-purple-400 border border-purple-900/50"
                        title="Invite Users"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Invite</span>
                      </button>
                    )}
                    
                    {selectedRoom.room_type === 'public' && selectedRoom.is_admin && (
                      <button
                        onClick={() => {
                          setShowRequestsModal(true);
                          loadPendingRequests(selectedRoom.id);
                        }}
                        className="hidden sm:flex px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-900/30 to-black hover:from-amber-800/30 hover:to-black rounded-xl font-medium transition-all duration-200 items-center gap-2 text-amber-400 border border-amber-900/50 relative"
                        title="View Join Requests"
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Requests</span>
                        {pendingRequests.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-900/30 to-black text-cyan-400 text-xs rounded-full w-5 h-5 flex items-center justify-center border border-cyan-900/50">
                            {pendingRequests.length}
                          </span>
                        )}
                      </button>
                    )}
                    
                    <div className="flex sm:hidden gap-1">
                      <button
                        onClick={() => setShowMemberList(!showMemberList)}
                        className="p-2 bg-[#111] hover:bg-[#1a1a1a] rounded-lg transition-all duration-200 text-gray-300 border border-gray-900"
                        title="View Members"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      {selectedRoom.room_type === 'private' && selectedRoom.is_admin && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="p-2 bg-gradient-to-r from-purple-900/30 to-black hover:from-purple-800/30 hover:to-black rounded-lg transition-all duration-200 text-purple-400 border border-purple-900/50"
                          title="Invite Users"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      {selectedRoom.room_type === 'public' && selectedRoom.is_admin && (
                        <button
                          onClick={() => {
                            setShowRequestsModal(true);
                            loadPendingRequests(selectedRoom.id);
                          }}
                          className="p-2 bg-gradient-to-r from-amber-900/30 to-black hover:from-amber-800/30 hover:to-black rounded-lg transition-all duration-200 text-amber-400 border border-amber-900/50 relative"
                          title="View Join Requests"
                        >
                          <Users className="w-4 h-4" />
                          {pendingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-900/30 to-black text-cyan-400 text-xs rounded-full w-4 h-4 flex items-center justify-center border border-cyan-900/50">
                              {pendingRequests.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleLeaveRoom(selectedRoom.id)}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-900/30 to-black hover:from-red-800/30 hover:to-black rounded-xl font-medium transition-all duration-200 flex items-center gap-2 text-red-400 border border-red-900/50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Leave</span>
                    </button>
                  </div>
                </div>

                {showMemberList && (
                  <div className="absolute right-0 top-16 bottom-0 w-64 bg-[#0a0a0a] border-l border-gray-900 z-10 shadow-2xl">
                    <div className="p-4 border-b border-gray-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-200">Room Members</h3>
                        <button
                          onClick={() => setShowMemberList(false)}
                          className="p-1 hover:bg-[#111] rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{roomMembers.length} members</p>
                    </div>
                    <div className="overflow-y-auto h-[calc(100vh-200px)]">
                      {roomMembers.map((member) => {
                        const profile = userProfiles[member.wallet_address];
                        const displayName = getDisplayName(member.wallet_address, profile);
                        const avatarUrl = getAvatarUrl(profile);
                        
                        return (
                          <div key={member.user_id} className="p-3 hover:bg-[#111] transition-colors border-b border-gray-900/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-900">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-black">
                                    <User className="w-4 h-4 text-cyan-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-200">{displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{formatWalletAddress(member.wallet_address)}</p>
                              </div>
                              {member.is_admin && (
                                <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-auto p-4 bg-black"
                  style={{ 
                    maxWidth: '100%',
                    overflowX: 'hidden'
                  }}
                  onScroll={handleScroll}
                >
                  {messages.length === 0 && !isLoading && (
                    <div className="mb-8">
                      <div className="max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl bg-[#0a0a0a] border border-gray-900 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-900/30 to-black flex items-center justify-center mx-auto mb-4 border border-cyan-900/50">
                          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                          Welcome to {selectedRoom.name}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4">
                          Start the conversation! Share ideas, collaborate on projects, or just chat with the community.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="px-3 py-1 bg-[#111] border border-gray-900 rounded-full text-xs sm:text-sm text-gray-500">
                            📅 Messages grouped by date
                          </span>
                          <span className="px-3 py-1 bg-[#111] border border-gray-900 rounded-full text-xs sm:text-sm text-gray-500">
                            🔗 Links are clickable
                          </span>
                          <span className="px-3 py-1 bg-[#111] border border-gray-900 rounded-full text-xs sm:text-sm text-gray-500">
                            📁 Share files (10MB max)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-900/30 to-black flex items-center justify-center mx-auto mb-4 border border-cyan-900/50">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                      </div>
                      <p className="text-gray-500">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-900" />
                      <h3 className="text-xl font-bold mb-2 text-gray-300">No messages yet</h3>
                      <p className="text-gray-600">Be the first to start the conversation!</p>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto w-full">
                      {renderMessagesWithDateGroups()}
                    </div>
                  )}
                  
                  {typingUsers.size > 0 && (
                    <div className="flex items-center ml-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-cyan-500" />
                      <span className="text-sm text-gray-500">
                        {Array.from(typingUsers).map(formatWalletAddress).join(', ')} 
                        {typingUsers.size === 1 ? ' is' : ' are'} typing...
                      </span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-900 bg-[#0a0a0a] sticky bottom-0 z-10">
                  {fileInput && (
                    <div className="mb-3 p-3 rounded-xl bg-[#111] border border-gray-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          {getFileIcon(fileInput.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate text-gray-200 max-w-xs">
                            {fileInput.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileInput.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFileInput(null)}
                        className="p-1 hover:bg-[#111] rounded-lg"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}

                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef}
                      className="mb-3 p-4 rounded-2xl bg-black border border-gray-900 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-200">Emojis</h4>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="p-1 hover:bg-[#111] rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category} className="mb-4">
                            <h5 className="text-xs font-medium mb-2 text-gray-600">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h5>
                            <div className="grid grid-cols-8 gap-2">
                              {emojis.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setNewMessage(prev => prev + emoji);
                                    adjustTextareaHeight();
                                  }}
                                  className="text-2xl p-2 rounded-lg hover:scale-110 transition-transform hover:bg-[#111]"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex gap-1 self-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.js,.ts,.py,.java,.cpp,.c,.html,.css,.xml"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a] transition-all duration-200 border border-gray-900 self-end"
                        title="Attach File"
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                        ) : (
                          <Paperclip className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a] transition-all duration-200 border border-gray-900 self-end"
                        title="Emoji"
                      >
                        <Smile className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="flex-1 relative min-w-0">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          adjustTextareaHeight();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        onKeyUp={handleTyping}
                        placeholder="Type your message... (Shift + Enter for new line, ``` for code blocks)"
                        disabled={!socket || socket.disconnected || selectedRoom.status === 'pending' || uploadingFile}
                        rows={messageRows}
                        className="w-full bg-[#111] border border-gray-900 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent shadow-sm disabled:opacity-50 resize-none overflow-hidden min-h-[44px] max-h-[120px]"
                      />
                      
                      <div className={`absolute bottom-2 right-2 text-xs ${newMessage.length > 1000 ? 'text-red-400' : 'text-gray-600'}`}>
                        {newMessage.length}/1000
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !fileInput) || !socket || socket.disconnected || selectedRoom.status === 'pending' || newMessage.length > 1000 || uploadingFile}
                      className={`px-4 sm:px-6 h-[44px] ${
                        (!newMessage.trim() && !fileInput) || newMessage.length > 1000
                          ? 'bg-[#111] text-gray-600'
                          : 'bg-gradient-to-r from-cyan-900/30 to-black hover:from-cyan-800/30 hover:to-black text-cyan-400 border border-cyan-900/50'
                      } disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200 flex items-center gap-2 self-end`}
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="hidden sm:inline">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">
                      Press Enter to send • {socket?.connected ? '🟢 Connected' : '🔴 Connecting...'}
                      {fileInput && ` • Ready to upload: ${fileInput.name}`}
                    </p>
                    {selectedRoom.status === 'pending' && (
                      <p className="text-xs text-amber-400">
                        ⏳ Waiting for admin approval
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full">
                <div className="max-w-3xl text-center w-full">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-cyan-900/30 via-black to-blue-900/30 rounded-full flex items-center justify-center mx-auto border border-cyan-900/50">
                      <div className="w-36 h-36 sm:w-48 sm:h-48 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <MessageSquare className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-400" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-5 blur-3xl"></div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    OpenForge Chat
                  </h1>
                  <p className="text-lg sm:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-gray-500">
                    Connect with builders, developers, and creators in the OpenForge ecosystem. 
                    Share ideas, collaborate on projects, and grow together in decentralized chat rooms.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-cyan-900/30 to-black hover:from-cyan-800/30 hover:to-black rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-cyan-400 border border-cyan-900/50"
                    >
                      <Plus className="w-5 h-5" />
                      Create Room
                    </button>
                    <button
                      onClick={loadUserRooms}
                      className="px-6 sm:px-8 py-3 bg-[#111] hover:bg-[#1a1a1a] rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-gray-300 border border-gray-900"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Refresh Rooms
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12 max-w-2xl mx-auto">
                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-gray-900">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-900/30 to-black flex items-center justify-center mb-2 sm:mb-3 mx-auto border border-cyan-900/50">
                        <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-200 mb-1">Date Grouping</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Messages organized by date and time</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-gray-900">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-900/30 to-black flex items-center justify-center mb-2 sm:mb-3 mx-auto border border-blue-900/50">
                        <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-200 mb-1">Rich Links</h4>
                      <p className="text-xs sm:text-sm text-gray-500">URLs are automatically clickable</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-gray-900">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center mb-2 sm:mb-3 mx-auto border border-purple-900/50">
                        <Code className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-200 mb-1">Code Blocks</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Share code with syntax highlighting</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showRoomSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowRoomSidebar(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      {!showRoomSidebar && (
        <button
          onClick={() => setShowRoomSidebar(true)}
          className="lg:hidden fixed bottom-6 left-6 z-30 p-3 bg-[#111] hover:bg-[#1a1a1a] rounded-full shadow-xl border border-gray-900"
        >
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      )}

      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 max-w-md w-full bg-black border border-gray-900 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-200">Create New Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="p-1 hover:bg-[#111] rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500">Room Name</label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full bg-[#111] border border-gray-900 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent"
                  placeholder="Enter room name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500">Description (optional)</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="w-full bg-[#111] border border-gray-900 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent"
                  rows={3}
                  placeholder="What's this room about?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500">Room Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewRoom({ ...newRoom, roomType: 'public' })}
                    className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                      newRoom.roomType === 'public' 
                        ? 'bg-gradient-to-br from-blue-900/30 to-black border-blue-900/50' 
                        : 'bg-[#111] border-gray-900 hover:border-blue-900/50'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-gray-200">Public</span>
                    <span className="text-xs text-gray-500">Anyone can join</span>
                  </button>
                  <button
                    onClick={() => setNewRoom({ ...newRoom, roomType: 'private' })}
                    className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                      newRoom.roomType === 'private' 
                        ? 'bg-gradient-to-br from-purple-900/30 to-black border-purple-900/50' 
                        : 'bg-[#111] border-gray-900 hover:border-purple-900/50'
                    }`}
                  >
                    <Lock className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-gray-200">Private</span>
                    <span className="text-xs text-gray-500">Invite only</span>
                  </button>
                </div>
                <p className="text-sm mt-2 text-gray-600">
                  {newRoom.roomType === 'public' 
                    ? 'Public rooms appear in the Discover tab. Users must request to join and you approve requests.' 
                    : 'Private rooms are hidden. Only invited users can join.'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 bg-[#111] hover:bg-[#1a1a1a] py-3 rounded-xl font-medium transition-all duration-200 text-gray-300 border border-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoom.name.trim() || isLoading}
                className={`flex-1 ${
                  !newRoom.name.trim() 
                    ? 'bg-[#111] text-gray-600' 
                    : 'bg-gradient-to-r from-cyan-900/30 to-black hover:from-cyan-800/30 hover:to-black text-cyan-400 border border-cyan-900/50'
                } disabled:cursor-not-allowed py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 max-w-md w-full bg-black border border-gray-900 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-200">Invite to {selectedRoom.name}</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteWallet('');
                }}
                className="p-1 hover:bg-[#111] rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500">Wallet Address</label>
                <input
                  type="text"
                  value={inviteWallet}
                  onChange={(e) => setInviteWallet(e.target.value)}
                  className="w-full bg-[#111] border border-gray-900 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-transparent font-mono"
                  placeholder="0x..."
                />
                <p className="text-xs mt-1 text-gray-600">
                  Enter the wallet address you want to invite
                </p>
              </div>
              
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/10 to-black border border-purple-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Private Room</span>
                </div>
                <p className="text-xs text-gray-500">
                  Only invited users can join this room. The invitation will expire in 7 days.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteWallet('');
                }}
                className="flex-1 bg-[#111] hover:bg-[#1a1a1a] py-3 rounded-xl font-medium transition-all duration-200 text-gray-300 border border-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInviteUser(selectedRoom.id, inviteWallet)}
                disabled={!inviteWallet.trim() || !inviteWallet.startsWith('0x')}
                className={`flex-1 ${
                  !inviteWallet.trim() || !inviteWallet.startsWith('0x')
                    ? 'bg-[#111] text-gray-600'
                    : 'bg-gradient-to-r from-purple-900/30 to-black hover:from-purple-800/30 hover:to-black text-purple-400 border border-purple-900/50'
                } disabled:cursor-not-allowed py-3 rounded-xl font-medium transition-all duration-200`}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto bg-black border border-gray-900 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-200">Join Requests for {selectedRoom.name}</h3>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="p-1 hover:bg-[#111] rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-900" />
                  <p className="text-gray-500">No pending join requests</p>
                </div>
              ) : (
                pendingRequests.map(request => (
                  <div key={request.id} className="p-4 rounded-xl bg-gradient-to-br from-amber-900/10 to-black border border-amber-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-900/30 to-black flex items-center justify-center border border-amber-900/50">
                          <User className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-200">{formatWalletAddress(request.wallet_address)}</p>
                          <p className="text-xs text-gray-500">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id, selectedRoom.id)}
                        className="flex-1 bg-gradient-to-r from-emerald-900/30 to-black hover:from-emerald-800/30 hover:to-black py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 text-emerald-400 border border-emerald-900/50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id, selectedRoom.id)}
                        className="flex-1 bg-gradient-to-r from-red-900/30 to-black hover:from-red-800/30 hover:to-black py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 text-red-400 border border-red-900/50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="w-full bg-[#111] hover:bg-[#1a1a1a] py-3 rounded-xl font-medium transition-all duration-200 text-gray-300 border border-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;