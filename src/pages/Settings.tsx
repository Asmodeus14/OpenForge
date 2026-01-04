import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Contrast,
  Smartphone,
  Mail,
  MessageSquare,
  ChevronRight,
  Check,
  Globe,
  Settings as SettingsIcon,
  PaintBucket,
  Type,
  Layout,
  Zap,
  RefreshCw,
  Sparkles,
  Gradient,
  Eye
} from 'lucide-react';

export default function Settings() {
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('#8B5CF6'); // Purple as default
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [glassEffect, setGlassEffect] = useState(true);
  const [gradientIntensity, setGradientIntensity] = useState('medium');

  const themeOptions = [
    { 
      id: 'light', 
      label: 'Light', 
      icon: Sun, 
      description: 'Clean light interface',
      gradient: 'from-gray-100 to-gray-300'
    },
    { 
      id: 'dark', 
      label: 'Dark', 
      icon: Moon, 
      description: 'Deep dark experience',
      gradient: 'from-gray-900 to-black'
    },
    { 
      id: 'system', 
      label: 'System', 
      icon: Monitor, 
      description: 'Follow system theme',
      gradient: 'from-purple-900/50 to-gray-900/50'
    },
  ];

  const accentColors = [
    { name: 'Purple', value: '#8B5CF6', gradient: 'from-purple-500 to-violet-500' },
    { name: 'Fuchsia', value: '#D946EF', gradient: 'from-fuchsia-500 to-pink-500' },
    { name: 'Cyan', value: '#06B6D4', gradient: 'from-cyan-500 to-blue-500' },
    { name: 'Emerald', value: '#10B981', gradient: 'from-emerald-500 to-teal-500' },
    { name: 'Amber', value: '#F59E0B', gradient: 'from-amber-500 to-orange-500' },
    { name: 'Rose', value: '#F43F5E', gradient: 'from-rose-500 to-pink-500' },
  ];

  const fontSizes = [
    { id: 'small', label: 'S', size: 'text-sm' },
    { id: 'medium', label: 'M', size: 'text-base' },
    { id: 'large', label: 'L', size: 'text-lg' },
    { id: 'xlarge', label: 'XL', size: 'text-xl' },
  ];

  const fontFamilies = [
    { id: 'system-ui', label: 'System', font: 'font-sans' },
    { id: 'inter', label: 'Inter', font: 'font-sans' },
    { id: 'sf-pro', label: 'SF Pro', font: 'font-sans' },
    { id: 'roboto', label: 'Roboto', font: 'font-sans' },
    { id: 'mono', label: 'Monospace', font: 'font-mono' },
  ];

  const previewStyles = {
    backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F9FAFB',
    color: theme === 'dark' ? '#F9FAFB' : '#0A0A0A',
    accentColor: accentColor,
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-900 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20">
                <SettingsIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-400 mt-1 text-sm">Customize your OPENFORGE experience</p>
              </div>
            </div>
            <button className="px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-purple-500/50 transition-all duration-300 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Theme Preview Card */}
        <div 
          className="relative rounded-2xl p-8 mb-8 transition-all duration-500 border border-gray-900 overflow-hidden"
          style={previewStyles}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold">Live Preview</h2>
                <p className="text-sm opacity-75 mt-1">Real-time preview of your settings</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 rounded-full bg-current opacity-20"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-current opacity-10 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded-full bg-current opacity-10 w-3/4" />
                  <div className="h-3 rounded-full bg-current opacity-10 w-1/2" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="h-24 rounded-xl bg-current opacity-5 animate-pulse"
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                {[...Array(2)].map((_, i) => (
                  <div 
                    key={i}
                    className="h-10 flex-1 rounded-lg bg-current opacity-10 animate-pulse"
                    style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                <Palette className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Appearance</h2>
                <p className="text-gray-400 mt-1">Customize the visual experience</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-purple-400/50" />
          </div>

          {/* Theme Selection */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-3">
                  <Contrast className="w-5 h-5 text-purple-400" />
                  Theme
                </h3>
                <p className="text-sm text-gray-400 mt-1">Choose your preferred color scheme</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`relative p-6 rounded-xl border transition-all duration-300 group overflow-hidden ${
                      theme === option.id
                        ? 'border-purple-500 bg-gradient-to-br from-purple-900/30 to-pink-900/30'
                        : 'border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${option.gradient} bg-opacity-20`}>
                        <Icon className={`w-6 h-6 ${
                          theme === option.id ? 'text-purple-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="text-center">
                        <span className="font-medium block mb-1">{option.label}</span>
                        <span className="text-xs text-gray-400">{option.description}</span>
                      </div>
                      {theme === option.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                  <PaintBucket className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Accent Color</h3>
                  <p className="text-sm text-gray-400 mt-1">Primary brand color across the interface</p>
                </div>
              </div>
              <div className="relative">
                <div 
                  className="w-10 h-10 rounded-lg border border-gray-700 shadow-lg"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="absolute -inset-1 bg-current opacity-10 rounded-lg blur-sm" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-full border-3 transition-all duration-300 group-hover:scale-110 ${
                        accentColor === color.value
                          ? 'border-white shadow-2xl shadow-current/30'
                          : 'border-gray-800 group-hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                    {accentColor === color.value && (
                      <div className="absolute -inset-2 bg-current opacity-20 rounded-full blur-md" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Gradient className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gradient Intensity
                  </label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setGradientIntensity(level)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          gradientIntensity === level
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : 'border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Color
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-12 h-12 cursor-pointer rounded-xl border border-gray-800 bg-transparent"
                      />
                      <div className="absolute inset-0 border-2 border-white/10 rounded-xl pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-sm font-mono focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      placeholder="#8B5CF6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                <Type className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Typography</h3>
                <p className="text-sm text-gray-400 mt-1">Adjust text appearance and readability</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Font Size
                </label>
                <div className="flex gap-3">
                  {fontSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setFontSize(size.id)}
                      className={`flex-1 py-4 rounded-xl border transition-all duration-300 ${
                        fontSize === size.id
                          ? 'border-purple-500 bg-gradient-to-br from-purple-900/30 to-pink-900/30 text-purple-400'
                          : 'border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className={`${size.size} font-semibold`}>{size.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Font Family
                </label>
                <div className="space-y-3">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                        fontFamily === font.id
                          ? 'border-purple-500 bg-gradient-to-br from-purple-900/30 to-pink-900/30'
                          : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
                      }`}
                    >
                      <span className={`${font.font} font-medium`}>{font.label}</span>
                      {fontFamily === font.id && (
                        <Check className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                <Layout className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Display</h3>
                <p className="text-sm text-gray-400 mt-1">Fine-tune visual preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  id: 'animations',
                  label: 'Animations & Transitions',
                  description: 'Enable smooth animations throughout the app',
                  value: animations,
                  setter: setAnimations,
                  icon: <Zap className="w-5 h-5" />,
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  id: 'glass',
                  label: 'Glass Effect',
                  description: 'Enable frosted glass backgrounds',
                  value: glassEffect,
                  setter: setGlassEffect,
                  icon: <Sparkles className="w-5 h-5" />,
                  gradient: 'from-purple-500 to-blue-500',
                },
                {
                  id: 'compact',
                  label: 'Compact Mode',
                  description: 'Reduce spacing for more content density',
                  value: compactMode,
                  setter: setCompactMode,
                  icon: <Smartphone className="w-5 h-5" />,
                  gradient: 'from-purple-500 to-emerald-500',
                },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800 group hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${setting.gradient} bg-opacity-20`}>
                      <div className="text-purple-400">{setting.icon}</div>
                    </div>
                    <div>
                      <div className="font-medium">{setting.label}</div>
                      <div className="text-sm text-gray-400">{setting.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setting.setter(!setting.value)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
                      setting.value 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                        : 'bg-gray-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
                        setting.value ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-8">
            <button className="px-6 py-3.5 border border-gray-800 text-gray-400 rounded-xl hover:border-gray-700 hover:text-gray-300 hover:bg-gray-900/50 transition-all duration-300 flex items-center gap-3">
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center gap-3">
              <Check className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t border-gray-900">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Contact & Support</h2>
              <p className="text-gray-400 mt-1">Get help from our support team</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl p-8 border border-gray-800 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Need Help?</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  Our support team is here to help you with any questions or issues you might encounter.
                </p>
                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span>support@openforge.dev</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>24/7 Support Available</span>
                  </div>
                </div>
              </div>
              
              <Link
                to="/contact"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center gap-3"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Contact Support</span>
                <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
              </Link>
            </div>
            
            <div className="pt-8 border-t border-gray-800">
              <h4 className="font-semibold mb-6 text-lg">Quick Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Documentation', desc: 'Read our guides and API docs', icon: '📚' },
                  { title: 'Community', desc: 'Join our Discord community', icon: '👥' },
                  { title: 'Status', desc: 'Check system status & uptime', icon: '📈' },
                ].map((link) => (
                  <button
                    key={link.title}
                    className="p-5 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800 text-left hover:border-purple-500/30 hover:bg-gray-900/50 transition-all duration-300 group"
                  >
                    <div className="text-2xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity">{link.icon}</div>
                    <div className="font-medium mb-2 group-hover:text-purple-300 transition-colors">
                      {link.title}
                    </div>
                    <div className="text-sm text-gray-400">{link.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl mx-auto px-6 py-8 mt-8 border-t border-gray-900">
        <p className="text-center text-sm text-gray-500">
          Settings are automatically saved as you make changes
        </p>
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-500/30"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}