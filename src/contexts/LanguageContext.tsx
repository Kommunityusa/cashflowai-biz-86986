import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Hero
    'hero.aiPowered': 'AI-Powered Financial Management',
    'hero.bookkeepingMade': 'Bookkeeping Made',
    'hero.effortless': 'Effortless',
    'hero.withAI': 'with AI',
    'hero.subtitle': 'Automate your bookkeeping, connect your bank accounts, and generate professional reports in seconds. Let AI handle the numbers while you focus on growing your business.',
    'hero.startFreeTrial': 'Start Free Trial',
    'hero.goToDashboard': 'Go to Dashboard',
    'hero.watchDemo': 'Watch Demo',
    'hero.features': 'Features',
    'hero.pricing': 'Pricing',
    'hero.blog': 'Blog',
    'hero.about': 'About',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.funding': 'Funding',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign Out',
    'nav.signIn': 'Sign In',
    
    // Auth
    'auth.welcomeBack': 'Welcome Back',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.createAccount': 'Create Account',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.emailPlaceholder': 'your@email.com',
    'auth.passwordPlaceholder': '••••••••',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.manageFinances': 'Manage your business finances with AI-powered insights',
    'auth.orContinueWith': 'Or continue with',
    'auth.bySigningUp': 'By signing up, you agree to our Terms of Service and Privacy Policy',
    
    // Plan Selection
    'plans.selectPlan': 'Select Your Plan',
    'plans.choosePlan': 'Choose the plan that best fits your needs',
    'plans.starter': 'Starter',
    'plans.professional': 'Professional',
    'plans.business': 'Business',
    'plans.starterDesc': 'Perfect for freelancers just getting started',
    'plans.professionalDesc': 'Ideal for growing businesses',
    'plans.businessDesc': 'For established businesses',
    'plans.month': '/month',
    'plans.startTrial': 'Start Free Trial',
    'plans.upgradeNow': 'Upgrade Now',
    'plans.currentPlan': 'Current Plan',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to Cash Flow AI',
    'dashboard.overview': 'Financial Overview',
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.insights': 'AI Insights',
    'dashboard.quickActions': 'Quick Actions',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    'common.language': 'Language',
  },
  es: {
    // Hero
    'hero.aiPowered': 'Gestión Financiera con IA',
    'hero.bookkeepingMade': 'Contabilidad',
    'hero.effortless': 'Sin Esfuerzo',
    'hero.withAI': 'con IA',
    'hero.subtitle': 'Automatiza tu contabilidad, conecta tus cuentas bancarias y genera informes profesionales en segundos. Deja que la IA maneje los números mientras te enfocas en hacer crecer tu negocio.',
    'hero.startFreeTrial': 'Iniciar Prueba Gratis',
    'hero.goToDashboard': 'Ir al Panel',
    'hero.watchDemo': 'Ver Demo',
    'hero.features': 'Características',
    'hero.pricing': 'Precios',
    'hero.blog': 'Blog',
    'hero.about': 'Acerca de',
    
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.transactions': 'Transacciones',
    'nav.reports': 'Reportes',
    'nav.settings': 'Configuración',
    'nav.funding': 'Financiamiento',
    'nav.admin': 'Admin',
    'nav.signOut': 'Cerrar Sesión',
    'nav.signIn': 'Iniciar Sesión',
    
    // Auth
    'auth.welcomeBack': 'Bienvenido de Nuevo',
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.createAccount': 'Crear Cuenta',
    'auth.continueWithGoogle': 'Continuar con Google',
    'auth.emailPlaceholder': 'tu@correo.com',
    'auth.passwordPlaceholder': '••••••••',
    'auth.signingIn': 'Iniciando sesión...',
    'auth.creatingAccount': 'Creando cuenta...',
    'auth.manageFinances': 'Administra las finanzas de tu negocio con información impulsada por IA',
    'auth.orContinueWith': 'O continuar con',
    'auth.bySigningUp': 'Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad',
    
    // Plan Selection
    'plans.selectPlan': 'Selecciona Tu Plan',
    'plans.choosePlan': 'Elige el plan que mejor se adapte a tus necesidades',
    'plans.starter': 'Inicial',
    'plans.professional': 'Profesional',
    'plans.business': 'Empresarial',
    'plans.starterDesc': 'Perfecto para freelancers que recién comienzan',
    'plans.professionalDesc': 'Ideal para negocios en crecimiento',
    'plans.businessDesc': 'Para empresas establecidas',
    'plans.month': '/mes',
    'plans.startTrial': 'Iniciar Prueba Gratis',
    'plans.upgradeNow': 'Actualizar Ahora',
    'plans.currentPlan': 'Plan Actual',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido a Cash Flow AI',
    'dashboard.overview': 'Resumen Financiero',
    'dashboard.recentTransactions': 'Transacciones Recientes',
    'dashboard.insights': 'Información de IA',
    'dashboard.quickActions': 'Acciones Rápidas',
    
    // Common
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.confirm': 'Confirmar',
    'common.language': 'Idioma',
  }
};