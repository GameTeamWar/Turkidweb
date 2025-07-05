// components/Header.tsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuToggle: () => void;
  currentStep?: 'order' | 'cart' | 'payment';
  onStepChange?: (step: 'order' | 'cart' | 'payment') => void;
}

export function Header({ onMenuToggle, currentStep = 'order', onStepChange }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const steps = [
    { id: 'order', label: 'sipariş', step: 1 },
    { id: 'cart', label: 'sepet', step: 2 },
    { id: 'payment', label: 'ödeme', step: 3 },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getProgressWidth = (stepIndex: number) => {
    if (currentStepIndex > stepIndex) return '100%';
    return '0%';
  };

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
              🍽️
            </div>
            <span className="text-xl font-bold text-white">Turkid</span>
          </Link>
          
          {/* Progress Indicator - Only show on order flow pages */}
          {onStepChange && (
            <div className="flex items-center gap-4 md:gap-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4">
                  <button 
                    onClick={() => onStepChange(step.id as any)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 shadow-lg transition-all duration-300 group-hover:scale-110 ${
                      currentStepIndex >= index ? 'bg-white' : 'bg-white/30'
                    }`}>
                      <span className={`font-bold text-sm md:text-base ${
                        currentStepIndex >= index ? 'text-orange-500' : 'text-white'
                      }`}>
                        {step.step}
                      </span>
                    </div>
                    <span className="text-white text-xs md:text-sm font-medium">
                      {step.label}
                    </span>
                  </button>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-12 md:w-24 h-1 bg-white/30 rounded-full">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: getProgressWidth(index) }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Right Section */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-white/30 border border-white/40 rounded-full px-4 py-2 hover:bg-white/50 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-full"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm relative z-10">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-black group-hover:text-white font-medium text-sm hidden sm:block relative z-10 transition-colors duration-300">
                    {session.user?.name}
                  </span>
                </button>
                
                {profileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white/75 backdrop-blur-xl border border-white/50 rounded-xl min-w-[180px] shadow-xl z-50">
                    {session.user?.role === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-t-xl relative overflow-hidden group"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-t-xl"></div>
                        <span className="text-lg relative z-10 text-black group-hover:text-white transition-colors duration-300">⚙️</span>
                        <span className="relative z-10 text-black group-hover:text-white transition-colors duration-300">Admin Panel</span>
                      </Link>
                    )}
                    
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-3 transition-all duration-300 relative overflow-hidden group"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                      <span className="text-lg relative z-10 text-black group-hover:text-white transition-colors duration-300">👤</span>
                      <span className="relative z-10 text-black group-hover:text-white transition-colors duration-300">Profil</span>
                    </Link>
                    
                    <Link 
                      href="/orders" 
                      className="flex items-center gap-3 px-4 py-3 transition-all duration-300 relative overflow-hidden group"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                      <span className="text-lg relative z-10 text-black group-hover:text-white transition-colors duration-300">📋</span>
                      <span className="relative z-10 text-black group-hover:text-white transition-colors duration-300">Siparişlerim</span>
                    </Link>
                    
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-b-xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-b-xl"></div>
                      <span className="text-lg relative z-10 text-black group-hover:text-white transition-colors duration-300">🚪</span>
                      <span className="relative z-10 text-black group-hover:text-white transition-colors duration-300">Hesaptan Çıkış</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/signin"
                  className="bg-white/30 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/50 transition-all duration-300"
                >
                  Giriş
                </Link>
                <Link 
                  href="/auth/signup"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-all duration-300"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
            
            <button 
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-white hover:bg-white/30 rounded-lg transition-colors duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-lg"></div>
              <Bars3Icon className="w-6 h-6 relative z-10" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}