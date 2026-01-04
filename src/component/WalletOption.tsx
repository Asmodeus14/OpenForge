// In your WalletOption component file
interface WalletOptionProps {
  name: string
  description: string
  icon: React.ReactNode  // Changed from string to React.ReactNode
  onClick: () => void
  disabled: boolean
  darkTheme?: boolean
}

export default function WalletOption({ 
  name, 
  description, 
  icon, 
  onClick, 
  disabled,
  darkTheme = false 
}: WalletOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 
        ${darkTheme 
          ? 'bg-gray-800/40 hover:bg-gray-700/60 border border-gray-700/50 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed' 
          : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center
        ${darkTheme ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`font-semibold ${darkTheme ? 'text-gray-100' : 'text-gray-800'}`}>
          {name}
        </p>
        <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
          {description}
        </p>
      </div>
    </button>
  )
}