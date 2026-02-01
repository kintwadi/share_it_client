
import React, { useState, useEffect, useRef } from 'react';
;(window as any).global = (window as any).global || window
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, Home, UserCircle, MessageSquare, Zap, LogIn, ChevronDown, Settings, LogOut, LayoutDashboard, Lock, Globe, DollarSign } from 'lucide-react';
import logo from './assets/images/logo.png';
import { Home as HomePage } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Messages } from './pages/Messages';
import { Connect } from './pages/Connect';
import { ListingDetail } from './pages/ListingDetail';
import { mockApi } from './services/mockApi';
import { User } from './types';
import { LanguageProvider, useLanguage, Currency } from './contexts/LanguageContext';

const Layout = ({ children, currentUser, onLogout }: { children?: React.ReactNode, currentUser: User | null, onLogout: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isCurrDropdownOpen, setIsCurrDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  
  const { t, language, setLanguage, currency, setCurrency } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const isActive = (path: string) => location.pathname === path;

  // Logic: "messages and dashboard button must only be visible in the users dashboard and not in the discovery page"
  // We show them only if we are NOT on the home page AND the user is logged in.
  const showPrivateNav = !isHomePage && currentUser;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (currRef.current && !currRef.current.contains(event.target as Node)) {
        setIsCurrDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, langRef, currRef]);

  // Handle logout wrapper
  const handleLogoutClick = () => {
    mockApi.logout().then(() => {
       onLogout();
       navigate('/');
       setIsProfileDropdownOpen(false);
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsProfileDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const changeLang = (lang: 'en' | 'pt' | 'de') => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const changeCurrency = (curr: Currency) => {
    setCurrency(curr);
    setIsCurrDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100/50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                    <Link to="/" className="flex items-center space-x-2 group">
                         <img src={logo} alt="share it" className="h-8 w-auto" />
                         <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">share it</span>
                    </Link>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-2">
                    <NavLink to="/" icon={<Home size={18} />} label={t('nav.discover')} active={isActive('/')} />
                    
                    {showPrivateNav && (
                      <>
                        <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} label={t('nav.dashboard')} active={isActive('/dashboard')} />
                        <NavLink to="/messages" icon={<MessageSquare size={18} />} label={t('nav.messages')} active={isActive('/messages')} />
                      </>
                    )}
                    
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    {/* Currency Switcher */}
                    <div className="relative" ref={currRef}>
                      <button
                        onClick={() => setIsCurrDropdownOpen(!isCurrDropdownOpen)}
                        className="px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-medium text-gray-600"
                      >
                        <span className="font-bold text-gray-800">{currency}</span>
                      </button>
                      {isCurrDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-fade-in origin-top-right">
                           {(['USD', 'EUR', 'GBP', 'BRL'] as Currency[]).map(curr => (
                             <button 
                               key={curr} 
                               onClick={() => changeCurrency(curr)} 
                               className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${currency === curr ? 'text-brand-600 font-bold' : 'text-gray-700'}`}
                             >
                               {curr}
                             </button>
                           ))}
                        </div>
                      )}
                    </div>

                    {/* Language Switcher */}
                    <div className="relative" ref={langRef}>
                      <button
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-medium text-gray-600"
                      >
                        <Globe size={16} />
                        <span className="uppercase">{language}</span>
                      </button>
                      {isLangDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-fade-in origin-top-right">
                           <button onClick={() => changeLang('en')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${language === 'en' ? 'text-brand-600 font-bold' : 'text-gray-700'}`}>English {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>}</button>
                           <button onClick={() => changeLang('pt')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${language === 'pt' ? 'text-brand-600 font-bold' : 'text-gray-700'}`}>Português {language === 'pt' && <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>}</button>
                           <button onClick={() => changeLang('de')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${language === 'de' ? 'text-brand-600 font-bold' : 'text-gray-700'}`}>Deutsch {language === 'de' && <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>}</button>
                        </div>
                      )}
                    </div>
                    
                    {currentUser ? (
                       <div className="relative" ref={dropdownRef}>
                          <button 
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="ml-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all flex items-center gap-2 border border-transparent hover:border-gray-200"
                          >
                             <img src={currentUser.avatarUrl || `https://picsum.photos/seed/${currentUser.id}/80/80`} onError={(e)=>{ (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentUser.id}/80/80`; }} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                             <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{currentUser.name}</span>
                             <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Desktop Dropdown */}
                          {isProfileDropdownOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-fade-in origin-top-right">
                                <div className="px-4 py-3 border-b border-gray-50">
                                   <p className="text-xs font-medium text-gray-500">{t('nav.login').split('/')[0] || 'Signed in'} as</p>
                                   <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                                </div>
                                <div className="py-1">
                                   <DropdownItem onClick={() => handleNavigate('/dashboard')} icon={<LayoutDashboard size={16}/>} label={t('nav.my_dashboard')} />
                                   <DropdownItem onClick={() => handleNavigate('/dashboard?action=profile')} icon={<UserCircle size={16}/>} label={t('nav.profile')} />
                                </div>
                                <div className="border-t border-gray-50 py-1">
                                   <button 
                                      onClick={handleLogoutClick}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                                   >
                                      <LogOut size={16} className="mr-2" />
                                      {t('nav.logout')}
                                   </button>
                                </div>
                             </div>
                          )}
                       </div>
                    ) : (
                      <Link 
                        to="/connect" 
                        className="ml-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex items-center"
                      >
                        <Zap size={16} className="mr-2 text-brand-400" />
                        {t('nav.connect')}
                      </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center gap-2">
                    <button
                        onClick={() => {
                           const currs: Currency[] = ['USD', 'EUR', 'GBP', 'BRL'];
                           const next = currs[(currs.indexOf(currency) + 1) % currs.length];
                           setCurrency(next);
                        }}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold uppercase"
                    >
                       {currency}
                    </button>
                    <button
                        onClick={() => {
                           const nextLang = language === 'en' ? 'pt' : language === 'pt' ? 'de' : 'en';
                           setLanguage(nextLang);
                        }}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold uppercase"
                    >
                       {language}
                    </button>
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)} 
                      className="text-gray-500 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 py-2 shadow-xl absolute w-full animate-fade-in-down h-screen">
                <div className="flex flex-col p-4 space-y-2">
                     <MobileNavLink to="/" label={t('nav.discover')} active={isActive('/')} onClick={() => setIsMenuOpen(false)} icon={<Home size={18} />} />
                     
                     {showPrivateNav && (
                       <>
                        <MobileNavLink to="/dashboard" label={t('nav.dashboard')} active={isActive('/dashboard')} onClick={() => setIsMenuOpen(false)} icon={<LayoutDashboard size={18} />} />
                        <MobileNavLink to="/messages" label={t('nav.messages')} active={isActive('/messages')} onClick={() => setIsMenuOpen(false)} icon={<MessageSquare size={18} />} />
                       </>
                     )}

                     <div className="h-px bg-gray-100 my-2"></div>
                     
                     {currentUser ? (
                        <div className="space-y-2">
                           <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Account</div>
                           <MobileNavLink to="/dashboard" label={t('nav.my_dashboard')} active={false} onClick={() => setIsMenuOpen(false)} icon={<UserCircle size={18} />} />
                           <MobileNavLink to="/dashboard?action=profile" label={t('nav.profile')} active={false} onClick={() => setIsMenuOpen(false)} icon={<Settings size={18} />} />
                           
                           <button 
                             onClick={handleLogoutClick}
                             className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 flex items-center"
                           >
                             <LogOut size={18} className="mr-3" />
                             {t('nav.logout')}
                           </button>
                        </div>
                     ) : (
                        <Link 
                          to="/connect" 
                          onClick={() => setIsMenuOpen(false)} 
                          className="w-full py-3 flex items-center justify-center rounded-xl font-bold bg-gray-900 text-white shadow-soft"
                        >
                          <LogIn size={18} className="mr-2" />
                          {t('nav.login')}
                        </Link>
                     )}
                </div>
            </div>
        )}
      </nav>

      <main className="flex-1 w-full mx-auto pt-20 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl">
           {children}
      </main>
    </div>
  );
};

const NavLink = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
      active 
        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const MobileNavLink = ({ to, label, active, onClick, icon }: { to: string, label: string, active: boolean, onClick: () => void, icon?: React.ReactNode }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
      active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    {icon && <span className="mr-3">{icon}</span>}
    {label}
  </Link>
);

const DropdownItem = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
  >
    <span className="mr-2 text-gray-400">{icon}</span>
    {label}
  </button>
);

const AppContent = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    mockApi.getCurrentUser().then(setCurrentUser);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  return (
    <Router>
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connect" element={<Connect onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<Dashboard user={currentUser} onLogout={handleLogout} onUpdateUser={handleUserUpdate} />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
