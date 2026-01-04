import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useWeb3 } from "../hooks/web3"
import InteractiveOwl3D from "../component/3dLogo"
import WalletOption from "../component/WalletOption"
import { ArrowLeft, Shield, Zap, ExternalLink, Lock, Smartphone, Wallet, Sparkles } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const { 
    account, 
    connectWallet, 
    error, 
    isConnecting,
    isWalletInstalled 
  } = useWeb3()

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (account) {
      navigate("/")
    }
  }, [account, navigate])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const x = (clientX / window.innerWidth) * 2 - 1
    const y = -(clientY / window.innerHeight) * 2 + 1
    setMousePosition({ x, y })
  }, [])

  const handleConnect = async (walletType: string) => {
    switch (walletType) {
      case 'injected':
        await connectWallet()
        break
      case 'walletconnect':
        alert('WalletConnect coming soon!')
        break
      case 'coinbase':
        alert('Coinbase Wallet coming soon!')
        break
    }
  }

  return (
    <div 
      className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic grid pattern */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(120, 119, 198, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 119, 198, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated gradient accents */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        
        <button
          onClick={() => navigate("/Home")}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 z-20 border border-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="w-full max-w-6xl z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-gray-900/30 backdrop-blur-xl rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
            
            <div className="p-12 border-b lg:border-b-0 lg:border-r border-gray-800">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-80 h-96 mb-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-violet-900/20 rounded-2xl blur-2xl"></div>
                  <div className="relative">
                    <InteractiveOwl3D mouse={mousePosition} />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-gradient-to-t from-purple-500/30 to-transparent blur-xl"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
                      OpenForge
                    </h1>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    Your Gateway to Web3
                  </p>
                </div>

                <div className="mt-12 p-5 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-gray-200 font-medium">Secure & Encrypted</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Your keys remain in your control</p>
                </div>
              </div>
            </div>

            <div className="p-12">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-white tracking-tight mb-3">Connect Your Wallet</h2>
                <p className="text-gray-400 text-lg">
                  Choose your preferred wallet to access decentralized features
                </p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-gradient-to-r from-gray-900 to-gray-950 border border-red-900/50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center shrink-0 border border-red-800/50">
                      <Lock className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-red-300 text-base font-semibold">Connection Error</p>
                      <p className="text-red-400 text-sm font-normal mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <WalletOption
                  name="Browser Wallet"
                  description="MetaMask, Brave, Coinbase Wallet"
                  icon={<span className="text-2xl">🦊</span>}
                  onClick={() => handleConnect('injected')}
                  disabled={!isWalletInstalled || isConnecting}
                  darkTheme={true}
                />

                <WalletOption
                  name="WalletConnect"
                  description="Connect via QR code or mobile"
                  icon={<Wallet className="w-7 h-7 text-purple-400" />}
                  onClick={() => handleConnect('walletconnect')}
                  disabled={isConnecting}
                  darkTheme={true}
                />

                <WalletOption
                  name="Coinbase Wallet"
                  description="Coinbase non-custodial wallet"
                  icon={<Smartphone className="w-7 h-7 text-violet-400" />}
                  onClick={() => handleConnect('coinbase')}
                  disabled={isConnecting}
                  darkTheme={true}
                />
              </div>

              {isConnecting && (
                <div className="mb-8 p-5 bg-gradient-to-r from-gray-900 to-gray-950 border border-purple-900/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="text-purple-300 text-base font-semibold">Awaiting Approval</p>
                      <p className="text-purple-400 text-sm font-normal">Please check your wallet</p>
                    </div>
                  </div>
                </div>
              )}

              {!isWalletInstalled && (
                <div className="mb-8 p-5 bg-gradient-to-r from-gray-900 to-gray-950 border border-amber-900/50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-800/50">
                      <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-amber-300 text-base font-semibold">Wallet Required</p>
                      <p className="text-amber-400 text-sm font-normal mt-1 mb-3">
                        Install a Web3 wallet to continue
                      </p>
                      <a 
                        href="https://metamask.io/download/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
                      >
                        Download MetaMask
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-gray-800">
                <p className="text-sm text-gray-400 font-normal">
                  New to Web3?{" "}
                  <a 
                    href="https://ethereum.org/en/wallets/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors font-medium underline decoration-purple-400/30 hover:decoration-purple-400"
                  >
                    Learn about wallets
                  </a>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-500 font-normal">
                  By connecting your wallet, you agree to our{" "}
                  <a href="#" className="text-purple-400 hover:text-purple-300 font-medium">Terms</a>
                  {" "}and{" "}
                  <a href="#" className="text-purple-400 hover:text-purple-300 font-medium">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-medium">
              OpenForge © 2024 • Building the future of Web3
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}