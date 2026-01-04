// src/pages/ProfileAddress.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProfile, formatWalletAddress, getAvatarUrl } from '../hooks/useProfile';
import { 
  useUserProjects, 
  FundingStatsCard,
  ProjectCard as EscrowProjectCard
} from '../hooks/useUserProjects';
import UserProjectsSection from '../component/UserProjectSection';

const extractSocialLinks = (description: string) => {
  const links = [];
  
  if (!description) return links;
  
  const patterns = [
    {
      type: 'github',
      regex: /(?:github|gh|git)[:\s]*github\.com\/([\w-]+)/gi,
      labelRegex: /(?:github|gh|git)[:\s]*/gi,
      extract: (url: string) => {
        const match = url.match(/github\.com\/([\w-]+)/i);
        return match ? `https://github.com/${match[1]}` : null;
      }
    },
    {
      type: 'twitter',
      regex: /(?:twitter|x|twt)[:\s]*twitter\.com\/([\w-]+)/gi,
      labelRegex: /(?:twitter|x|twt)[:\s]*/gi,
      extract: (url: string) => {
        const match = url.match(/twitter\.com\/([\w-]+)/i);
        return match ? `https://twitter.com/${match[1]}` : null;
      }
    },
    {
      type: 'linkedin',
      regex: /(?:linkedin|ln|li)[:\s]*linkedin\.com\/(?:in|company)\/([\w-]+)/gi,
      labelRegex: /(?:linkedin|ln|li)[:\s]*/gi,
      extract: (url: string) => {
        const match = url.match(/linkedin\.com\/(?:in|company)\/([\w-]+)/i);
        return match ? `https://linkedin.com/in/${match[1]}` : null;
      }
    },
    {
      type: 'discord',
      regex: /(?:discord|dc)[:\s]*(?:discord\.gg\/([\w-]+)|discordapp\.com\/users\/(\d+))/gi,
      labelRegex: /(?:discord|dc)[:\s]*/gi,
      extract: (url: string) => {
        const ggMatch = url.match(/discord\.gg\/([\w-]+)/i);
        const userMatch = url.match(/discordapp\.com\/users\/(\d+)/i);
        if (ggMatch) return `https://discord.gg/${ggMatch[1]}`;
        if (userMatch) return `https://discord.com/users/${userMatch[1]}`;
        return null;
      }
    },
    {
      type: 'telegram',
      regex: /(?:telegram|tg|tme)[:\s]*(?:t\.me\/([\w-]+)|telegram\.me\/([\w-]+))/gi,
      labelRegex: /(?:telegram|tg|tme)[:\s]*/gi,
      extract: (url: string) => {
        const match = url.match(/(?:t\.me|telegram\.me)\/([\w-]+)/i);
        return match ? `https://t.me/${match[1]}` : null;
      }
    },
    {
      type: 'website',
      regex: /(?:website|site|portfolio|port)[:\s]*(https?:\/\/[^\s]+|www\.[^\s]+)/gi,
      labelRegex: /(?:website|site|portfolio|port)[:\s]*/gi,
      extract: (url: string) => {
        let cleanUrl = url.replace(/(?:website|site|portfolio|port)[:\s]*/gi, '');
        return cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      }
    },
    {
      type: 'email',
      regex: /(?:email|mail|contact)[:\s]*([\w-]+@[\w-]+\.[\w-]+)/gi,
      labelRegex: /(?:email|mail|contact)[:\s]*/gi,
      extract: (email: string) => {
        const match = email.match(/([\w-]+@[\w-]+\.[\w-]+)/i);
        return match ? `mailto:${match[1]}` : null;
      }
    }
  ];

  const urlPatterns = [
    {
      type: 'github',
      regex: /github\.com\/([\w-]+)/gi,
      extract: (url: string) => {
        const match = url.match(/github\.com\/([\w-]+)/i);
        return match ? `https://github.com/${match[1]}` : null;
      }
    },
    {
      type: 'twitter',
      regex: /twitter\.com\/([\w-]+)/gi,
      extract: (url: string) => {
        const match = url.match(/twitter\.com\/([\w-]+)/i);
        return match ? `https://twitter.com/${match[1]}` : null;
      }
    },
    {
      type: 'linkedin',
      regex: /linkedin\.com\/(?:in|company)\/([\w-]+)/gi,
      extract: (url: string) => {
        const match = url.match(/linkedin\.com\/(?:in|company)\/([\w-]+)/i);
        return match ? `https://linkedin.com/in/${match[1]}` : null;
      }
    },
    {
      type: 'discord',
      regex: /discord\.gg\/([\w-]+)/gi,
      extract: (url: string) => {
        const match = url.match(/discord\.gg\/([\w-]+)/i);
        return match ? `https://discord.gg/${match[1]}` : null;
      }
    },
    {
      type: 'telegram',
      regex: /t\.me\/([\w-]+)/gi,
      extract: (url: string) => {
        const match = url.match(/t\.me\/([\w-]+)/i);
        return match ? `https://t.me/${match[1]}` : null;
      }
    },
    {
      type: 'website',
      regex: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[\w-]*)*/gi,
      extract: (url: string) => {
        const socialDomains = ['github.com', 'twitter.com', 'linkedin.com', 'discord.gg', 't.me', 'telegram.me'];
        const domain = url.replace(/https?:\/\/(www\.)?/, '');
        
        if (!socialDomains.some(social => domain.includes(social))) {
          return url.startsWith('http') ? url : `https://${url}`;
        }
        return null;
      }
    },
    {
      type: 'email',
      regex: /[\w-]+@[\w-]+\.[\w-]+/gi,
      extract: (email: string) => `mailto:${email}`
    }
  ];

  let processedDescription = description;
  const foundLinks = [];

  for (const pattern of patterns) {
    const matches = [...description.matchAll(pattern.regex)];
    
    for (const match of matches) {
      const fullMatch = match[0];
      const url = pattern.extract(fullMatch);
      
      if (url && !foundLinks.some(link => link.url === url)) {
        const labelMatch = fullMatch.match(pattern.labelRegex);
        const textToRemove = labelMatch ? labelMatch[0] + match[1] || match[2] || '' : fullMatch;
        
        processedDescription = processedDescription.replace(textToRemove, '').replace(/\s+/g, ' ').trim();
        
        foundLinks.push({
          type: pattern.type,
          url: url,
          original: fullMatch,
          textToRemove: textToRemove
        });
      }
    }
  }

  for (const pattern of urlPatterns) {
    const matches = [...processedDescription.matchAll(pattern.regex)];
    
    for (const match of matches) {
      const fullMatch = match[0];
      const url = pattern.extract(fullMatch);
      
      if (url && !foundLinks.some(link => link.url === url)) {
        processedDescription = processedDescription.replace(fullMatch, '').replace(/\s+/g, ' ').trim();
        
        foundLinks.push({
          type: pattern.type,
          url: url,
          original: fullMatch,
          textToRemove: fullMatch
        });
      }
    }
  }

  processedDescription = processedDescription
    .replace(/\s+/g, ' ')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();

  return {
    links: foundLinks,
    cleanedDescription: processedDescription
  };
};

const renderDescription = (description: string) => {
  if (!description) return '';
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[\w-]+@[\w-]+\.[\w-]+)/g;
  const parts = description.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      if (part.includes('@')) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            {part}
        </a>
        );
      }
      
      let url = part;
      if (part.startsWith('www.')) {
        url = `https://${part}`;
      }
      
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const SocialIcons = {
  Website: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    </svg>
  ),
  GitHub: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  ),
  Discord: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0a12.64 12.64 0 00-.617-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057a19.9 19.9 0 005.993 3.03a.078.078 0 00.084-.028c.462-.63.872-1.295 1.226-1.994a.076.076 0 00-.041-.106a13.107 13.107 0 01-1.872-.892a.077.077 0 01-.008-.128c.125-.094.25-.188.372-.284a.076.076 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.076.076 0 01.078.01c.12.096.245.19.37.284a.077.077 0 01-.006.127a12.3 12.3 0 01-1.873.892a.077.077 0 00-.041.107c.36.698.77 1.362 1.225 1.993a.076.076 0 00.084.028a19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.41c0-1.325.956-2.41 2.157-2.41c1.21 0 2.176 1.095 2.157 2.41c0 1.325-.956 2.41-2.157 2.41zm7.975 0c-1.183 0-2.157-1.085-2.157-2.41c0-1.325.955-2.41 2.157-2.41c1.21 0 2.176 1.095 2.157 2.41c0 1.325-.946 2.41-2.157 2.41z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Telegram: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.150-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  Email: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
  Portfolio: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z" />
    </svg>
  )
};

const SocialLinkButton = ({ type, url }: { type: string, url: string }) => {
  const getIcon = () => {
    switch(type) {
      case 'website': return <SocialIcons.Website />;
      case 'github': return <SocialIcons.GitHub />;
      case 'twitter': return <SocialIcons.Twitter />;
      case 'discord': return <SocialIcons.Discord />;
      case 'linkedin': return <SocialIcons.LinkedIn />;
      case 'telegram': return <SocialIcons.Telegram />;
      case 'email': return <SocialIcons.Email />;
      default: return <SocialIcons.Website />;
    }
  };

  const getLabel = () => {
    switch(type) {
      case 'website': return 'Website';
      case 'github': return 'GitHub';
      case 'twitter': return 'Twitter';
      case 'discord': return 'Discord';
      case 'linkedin': return 'LinkedIn';
      case 'telegram': return 'Telegram';
      case 'email': return 'Email';
      default: return 'Website';
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-3 bg-black border border-gray-800 hover:border-purple-500 hover:bg-gray-900/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 group"
      title={getLabel()}
    >
      <span className="text-gray-400 group-hover:text-purple-400 transition-colors">
        {getIcon()}
      </span>
      <span className="text-sm font-medium">{getLabel()}</span>
    </a>
  );
};

const ProfileAddressPage = () => {
  const { address } = useParams<{ address: string }>();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile(address);
  const { 
    projects: escrowProjects, 
    fundingStats,
    loading: escrowLoading, 
    error: escrowError, 
    refetch: refetchEscrow,
    handleProjectClick
  } = useUserProjects(address);

  const [activeTab, setActiveTab] = useState<'escrow' | 'user-projects'>('escrow');

  const { links: socialLinksFromBio, cleanedDescription } = useMemo(() => {
    if (!profile?.bio) return { links: [], cleanedDescription: '' };
    return extractSocialLinks(profile.bio);
  }, [profile?.bio]);

  const allSocialLinks = useMemo(() => {
    const links: Array<{type: string, url: string}> = [];
    
    if (profile?.website) {
      links.push({ type: 'website', url: profile.website });
    }
    if (profile?.github) {
      links.push({ type: 'github', url: `https://github.com/${profile.github}` });
    }
    if (profile?.twitter) {
      links.push({ type: 'twitter', url: `https://twitter.com/${profile.twitter}` });
    }
    if (profile?.discord) {
      links.push({ type: 'discord', url: `https://discord.com/users/${profile.discord}` });
    }
    if (profile?.linkedin) {
      links.push({ type: 'linkedin', url: `https://linkedin.com/in/${profile.linkedin}` });
    }
    if (profile?.telegram) {
      links.push({ type: 'telegram', url: `https://t.me/${profile.telegram}` });
    }
    if (profile?.email) {
      links.push({ type: 'email', url: `mailto:${profile.email}` });
    }

    socialLinksFromBio.forEach(bioLink => {
      const exists = links.some(link => link.url === bioLink.url);
      if (!exists) {
        links.push({ type: bioLink.type, url: bioLink.url });
      }
    });

    return links;
  }, [profile, socialLinksFromBio]);

  const loading = profileLoading || escrowLoading;
  const error = profileError || escrowError;

  const handleRetry = () => {
    refetchProfile();
    refetchEscrow();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-solid border-purple-500 border-r-transparent"></div>
          <p className="text-gray-400">
            {profileLoading ? 'Loading profile...' : 'Loading projects...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 flex items-center justify-center border border-red-900/30">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Error Loading Data</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl border border-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Profile Found</h2>
          <p className="text-gray-400 mb-6">
            {address ? formatWalletAddress(address) : 'This address'} has not created a profile yet.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl border border-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profile);
  const displayDescription = cleanedDescription || profile.bio;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
            <div className="px-4 py-2 bg-black border border-gray-800 rounded-xl text-gray-400 font-mono text-sm">
              {formatWalletAddress(address)}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-black border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-900 to-black p-1 mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-800">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.avatar-placeholder')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gray-900 ${avatarUrl ? 'hidden' : ''} avatar-placeholder`}>
                      <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
                
                {profile.location && (
                  <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {displayDescription && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {renderDescription(displayDescription)}
                  </div>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-black border border-purple-500/30 text-purple-400 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {allSocialLinks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Connect</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {allSocialLinks.map((link, index) => (
                      <SocialLinkButton key={index} type={link.type} url={link.url} />
                    ))}
                  </div>
                </div>
              )}

              {profile.website && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl transition-all duration-200"
                  >
                    <SocialIcons.Portfolio />
                    <span>View Portfolio</span>
                  </a>
                </div>
              )}
            </div>

            {profile.createdAt || profile.updatedAt || profile.version ? (
              <div className="bg-black border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile Info</h3>
                <div className="space-y-3">
                  {profile.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Created</span>
                      <span className="text-gray-300">{new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {profile.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Updated</span>
                      <span className="text-gray-300">{new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Version</span>
                    <span className="text-gray-300">v{profile.version}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            {fundingStats && fundingStats.totalProjects > 0 && (
              <div className="mb-8">
                <FundingStatsCard stats={fundingStats} />
              </div>
            )}

            <div className="bg-black border border-gray-800 rounded-2xl p-6">
              <div className="flex border-b border-gray-800 mb-6">
                <button
                  onClick={() => setActiveTab('escrow')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'escrow'
                      ? 'text-purple-400 border-b-2 border-purple-500'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Escrow Projects ({escrowProjects.length})
                </button>
                <button
                  onClick={() => setActiveTab('user-projects')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'user-projects'
                      ? 'text-purple-400 border-b-2 border-purple-500'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Regular Projects
                </button>
              </div>

              {activeTab === 'escrow' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Milestone Escrow Contracts</h3>
                    {fundingStats && (
                      <p className="text-gray-400">
                        {fundingStats.fundedByOthers} funded by others • {fundingStats.fundedOthers} funded others
                      </p>
                    )}
                  </div>

                  {escrowProjects.length === 0 ? (
                    <div className="text-center py-12 border border-gray-800 rounded-xl">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-300 mb-2">No escrow contracts found</p>
                      <p className="text-gray-500 text-sm">
                        This user hasn't participated in any milestone-based escrow contracts yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {escrowProjects.map((project) => (
                        <EscrowProjectCard 
                          key={project.projectId} 
                          project={project} 
                          onClick={handleProjectClick}
                          showFunding={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'user-projects' && (
                <div>
                  <UserProjectsSection address={address} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAddressPage;