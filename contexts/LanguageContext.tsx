
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'pt' | 'de';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'BRL';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

const translations = {
  en: {
    // Navigation
    "nav.discover": "Discover",
    "nav.dashboard": "Dashboard",
    "nav.messages": "Messages",
    "nav.connect": "Connect",
    "nav.login": "Login / Connect",
    "nav.logout": "Log Out",
    "nav.profile": "Edit Profile",
    "nav.security": "Security",
    "nav.my_dashboard": "My Dashboard",
    
    // Home
    "home.hero_badge": "Join 2,000+ neighbors sharing today",
    "home.hero_title_1": "Borrow locally,",
    "home.hero_title_2": "Connect globally.",
    "home.hero_desc": "The trusted platform to borrow tools, share skills, and build a stronger neighborhood community right where you live.",
    "home.search_placeholder": "What do you need? (e.g. Drill, Gardening)",
    "home.filter_all": "All",
    "home.filter_goods": "Goods",
    "home.filter_skills": "Skills",
    "home.category_all": "All Categories",
    "home.showing": "Showing",
    "home.of": "of",
    "home.results": "results",
    "home.no_matches": "No matches found",
    "home.no_matches_desc": "We couldn't find exactly what you're looking for. Try adjusting your filters.",
    "home.clear_filters": "Clear all filters",
    "home.loading": "Finding nearby treasures...",

    // Connect
    "connect.welcome_back": "Welcome back",
    "connect.create_account": "Create an account",
    "connect.login_desc": "Enter your details to access your account.",
    "connect.signup_desc": "Start sharing with your neighbors today.",
    "connect.login_btn": "Log In",
    "connect.signup_btn": "Sign Up",
    "connect.full_name": "Full Name",
    "connect.email": "Email",
    "connect.password": "Password",
    "connect.processing": "Processing...",
    "connect.sign_in": "Sign In",
    "connect.demo_text": "Or try a demo account",
    "connect.hero_title": "Your neighborhood, unlocked.",
    "connect.hero_desc": "Join a community that believes in sharing over buying. Save money, reduce waste, and meet your neighbors.",
    "connect.trust_system": "Trust Score System",
    "connect.trust_desc": "Verified identity and community vouches.",
    "connect.hyper_local": "Hyper-local",
    "connect.local_desc": "Connect with people within 2 miles.",

    // Dashboard
    "dash.admin_overview": "Admin Overview",
    "dash.my_dashboard": "My Dashboard",
    "dash.admin_subtitle": "Platform health and moderation.",
    "dash.member_subtitle": "Manage your sharing activity and reputation.",
    "dash.trust_score": "Trust Score",
    "dash.vouches": "Vouches",
    "dash.verify_identity": "Verify Identity",
    "dash.verifying": "Verifying...",
    "dash.verified": "Verified",
    "dash.incoming_requests": "Incoming Requests",
    "dash.my_listings": "My Listings",
    "dash.add_new": "Add New",
    "dash.active_borrows": "Active Borrows",
    "dash.borrowing_history": "Borrowing History",
    "dash.recommendations": "Recommended for You",
    "dash.no_listings": "You haven't listed anything yet.",
    "dash.no_active_borrows": "You aren't borrowing anything active.",
    "dash.browse_listings": "Browse Listings",
    "dash.edit_profile": "Edit Profile",
    "dash.save_changes": "Save Changes",
    "dash.cancel": "Cancel",
    "dash.security_settings": "Security Settings",
    "dash.change_password": "Change Password",
    "dash.2fa": "Two-Factor Authentication",
    "dash.close": "Close",
    "dash.logout_all": "Log Out of All Devices"
  },
  pt: {
    // Navigation
    "nav.discover": "Descobrir",
    "nav.dashboard": "Painel",
    "nav.messages": "Mensagens",
    "nav.connect": "Conectar",
    "nav.login": "Entrar / Conectar",
    "nav.logout": "Sair",
    "nav.profile": "Editar Perfil",
    "nav.security": "Segurança",
    "nav.my_dashboard": "Meu Painel",

    // Home
    "home.hero_badge": "Junte-se a 2.000+ vizinhos compartilhando hoje",
    "home.hero_title_1": "Empreste localmente,",
    "home.hero_title_2": "Conecte globalmente.",
    "home.hero_desc": "A plataforma confiável para emprestar ferramentas, compartilhar habilidades e construir uma comunidade mais forte onde você mora.",
    "home.search_placeholder": "O que você precisa? (ex: Furadeira, Jardinagem)",
    "home.filter_all": "Todos",
    "home.filter_goods": "Bens",
    "home.filter_skills": "Habilidades",
    "home.category_all": "Todas Categorias",
    "home.showing": "Mostrando",
    "home.of": "de",
    "home.results": "resultados",
    "home.no_matches": "Nenhum resultado encontrado",
    "home.no_matches_desc": "Não encontramos exatamente o que você procura. Tente ajustar seus filtros.",
    "home.clear_filters": "Limpar filtros",
    "home.loading": "Procurando tesouros próximos...",

    // Connect
    "connect.welcome_back": "Bem-vindo de volta",
    "connect.create_account": "Criar uma conta",
    "connect.login_desc": "Insira seus dados para acessar sua conta.",
    "connect.signup_desc": "Comece a compartilhar com seus vizinhos hoje.",
    "connect.login_btn": "Entrar",
    "connect.signup_btn": "Cadastrar",
    "connect.full_name": "Nome Completo",
    "connect.email": "Email",
    "connect.password": "Senha",
    "connect.processing": "Processando...",
    "connect.sign_in": "Entrar",
    "connect.demo_text": "Ou tente uma conta demo",
    "connect.hero_title": "Sua vizinhança, desbloqueada.",
    "connect.hero_desc": "Junte-se a uma comunidade que acredita em compartilhar em vez de comprar. Economize dinheiro e reduza o desperdício.",
    "connect.trust_system": "Sistema de Confiança",
    "connect.trust_desc": "Identidade verificada e garantias da comunidade.",
    "connect.hyper_local": "Hiper-local",
    "connect.local_desc": "Conecte-se com pessoas em um raio de 2 milhas.",

    // Dashboard
    "dash.admin_overview": "Visão Geral Admin",
    "dash.my_dashboard": "Meu Painel",
    "dash.admin_subtitle": "Saúde da plataforma e moderação.",
    "dash.member_subtitle": "Gerencie sua atividade de compartilhamento e reputação.",
    "dash.trust_score": "Pontuação de Confiança",
    "dash.vouches": "Garantias",
    "dash.verify_identity": "Verificar Identidade",
    "dash.verifying": "Verificando...",
    "dash.verified": "Verificado",
    "dash.incoming_requests": "Solicitações Recebidas",
    "dash.my_listings": "Meus Anúncios",
    "dash.add_new": "Adicionar Novo",
    "dash.active_borrows": "Empréstimos Ativos",
    "dash.borrowing_history": "Histórico de Empréstimos",
    "dash.recommendations": "Recomendado para Você",
    "dash.no_listings": "Você ainda não anunciou nada.",
    "dash.no_active_borrows": "Você não está pegando nada emprestado no momento.",
    "dash.browse_listings": "Navegar nos Anúncios",
    "dash.edit_profile": "Editar Perfil",
    "dash.save_changes": "Salvar Alterações",
    "dash.cancel": "Cancelar",
    "dash.security_settings": "Configurações de Segurança",
    "dash.change_password": "Mudar Senha",
    "dash.2fa": "Autenticação de Dois Fatores",
    "dash.close": "Fechar",
    "dash.logout_all": "Sair de todos os dispositivos"
  },
  de: {
    // Navigation
    "nav.discover": "Entdecken",
    "nav.dashboard": "Dashboard",
    "nav.messages": "Nachrichten",
    "nav.connect": "Verbinden",
    "nav.login": "Anmelden / Verbinden",
    "nav.logout": "Abmelden",
    "nav.profile": "Profil bearbeiten",
    "nav.security": "Sicherheit",
    "nav.my_dashboard": "Mein Dashboard",

    // Home
    "home.hero_badge": "Über 2.000 Nachbarn teilen bereits",
    "home.hero_title_1": "Lokal leihen,",
    "home.hero_title_2": "Global vernetzen.",
    "home.hero_desc": "Die vertrauenswürdige Plattform, um Werkzeuge zu leihen, Fähigkeiten zu teilen und eine stärkere Nachbarschaft aufzubauen.",
    "home.search_placeholder": "Was brauchen Sie? (z.B. Bohrer, Garten)",
    "home.filter_all": "Alle",
    "home.filter_goods": "Waren",
    "home.filter_skills": "Fähigkeiten",
    "home.category_all": "Alle Kategorien",
    "home.showing": "Zeige",
    "home.of": "von",
    "home.results": "Ergebnissen",
    "home.no_matches": "Keine Treffer gefunden",
    "home.no_matches_desc": "Wir konnten nicht genau das finden, wonach Sie suchen. Versuchen Sie, Ihre Filter anzupassen.",
    "home.clear_filters": "Alle Filter löschen",
    "home.loading": "Suche nach lokalen Schätzen...",

    // Connect
    "connect.welcome_back": "Willkommen zurück",
    "connect.create_account": "Konto erstellen",
    "connect.login_desc": "Geben Sie Ihre Daten ein, um auf Ihr Konto zuzugreifen.",
    "connect.signup_desc": "Teilen Sie noch heute mit Ihren Nachbarn.",
    "connect.login_btn": "Anmelden",
    "connect.signup_btn": "Registrieren",
    "connect.full_name": "Vollständiger Name",
    "connect.email": "E-Mail",
    "connect.password": "Passwort",
    "connect.processing": "Verarbeitung...",
    "connect.sign_in": "Anmelden",
    "connect.demo_text": "Oder versuchen Sie ein Demo-Konto",
    "connect.hero_title": "Ihre Nachbarschaft, freigeschaltet.",
    "connect.hero_desc": "Treten Sie einer Gemeinschaft bei, die an Teilen statt Kaufen glaubt. Sparen Sie Geld und reduzieren Sie Abfall.",
    "connect.trust_system": "Vertrauenssystem",
    "connect.trust_desc": "Verifizierte Identität und Bürgschaften.",
    "connect.hyper_local": "Hyper-lokal",
    "connect.local_desc": "Verbinden Sie sich mit Menschen im Umkreis von 2 Meilen.",

    // Dashboard
    "dash.admin_overview": "Admin Übersicht",
    "dash.my_dashboard": "Mein Dashboard",
    "dash.admin_subtitle": "Plattformgesundheit und Moderation.",
    "dash.member_subtitle": "Verwalten Sie Ihre Teilaktivitäten und Ihren Ruf.",
    "dash.trust_score": "Vertrauenswert",
    "dash.vouches": "Bürgschaften",
    "dash.verify_identity": "Identität verifizieren",
    "dash.verifying": "Verifizierung...",
    "dash.verified": "Verifiziert",
    "dash.incoming_requests": "Eingehende Anfragen",
    "dash.my_listings": "Meine Einträge",
    "dash.add_new": "Neu hinzufügen",
    "dash.active_borrows": "Aktive Ausleihen",
    "dash.borrowing_history": "Ausleihhistorie",
    "dash.recommendations": "Für Sie empfohlen",
    "dash.no_listings": "Sie haben noch nichts eingestellt.",
    "dash.no_active_borrows": "Sie leihen derzeit nichts aus.",
    "dash.browse_listings": "Einträge durchsuchen",
    "dash.edit_profile": "Profil bearbeiten",
    "dash.save_changes": "Änderungen speichern",
    "dash.cancel": "Abbrechen",
    "dash.security_settings": "Sicherheitseinstellungen",
    "dash.change_password": "Passwort ändern",
    "dash.2fa": "Zwei-Faktor-Authentifizierung",
    "dash.close": "Schließen",
    "dash.logout_all": "Von allen Geräten abmelden"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');

  const t = (key: string): string => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  const formatPrice = (amount: number) => {
    // Determine locale based on language, though this could be separate
    const locale = language === 'pt' ? 'pt-BR' : language === 'de' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
