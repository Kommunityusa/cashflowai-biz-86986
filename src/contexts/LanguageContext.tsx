import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface Translations {
  // Common
  common: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    businessName: string;
    taxId: string;
    address: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    confirm: string;
    yes: string;
    no: string;
    back: string;
    next: string;
    previous: string;
    finish: string;
    close: string;
    open: string;
    select: string;
    selectAll: string;
    clear: string;
    reset: string;
    apply: string;
    submit: string;
    create: string;
    update: string;
    view: string;
      signOut: string;
      signIn: string;
      signUp: string;
      forgotPassword: string;
      resetPassword: string;
      start: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    transactions: string;
    reports: string;
    settings: string;
    funding: string;
    about: string;
    blog: string;
    demo: string;
    pricing: string;
    features: string;
  };
  
  // Hero
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
    ctaSecondary: string;
    trustBadge: string;
  };
  
  // Auth
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    welcomeBack: string;
    orContinueWith: string;
    signInGoogle: string;
    termsAgree: string;
    termsOfService: string;
    privacyPolicy: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    overview: string;
    quickActions: string;
    recentTransactions: string;
    insights: string;
    cashFlow: string;
    income: string;
    expenses: string;
    netIncome: string;
    totalBalance: string;
    accountsConnected: string;
    transactionsImported: string;
    insightsGenerated: string;
    noData: string;
    connectBank: string;
    importTransactions: string;
    generateReport: string;
    monthlyTrend: string;
    categoryBreakdown: string;
    lastUpdated: string;
  };
  
  // Settings
  settings: {
    title: string;
    description: string;
    profile: string;
    categories: string;
    vendors: string;
    budgets: string;
    security: string;
    billing: string;
    integrations: string;
    preferences: string;
    personalInfo: string;
    businessInfo: string;
    changePassword: string;
    twoFactor: string;
    notifications: string;
    emailNotifications: string;
    weeklyReports: string;
    transactionAlerts: string;
    accountManagement: string;
    downloadData: string;
    exportData: string;
    bankConnections: string;
    connectPlaid: string;
    platformIntegrations: string;
  };
  
  // Plans
  plans: {
    selectPlan: string;
    choosePlan: string;
    free: string;
    starter: string;
    professional: string;
    business: string;
    mostPopular: string;
    currentPlan: string;
    upgrade: string;
    downgrade: string;
    features: string;
    unlimited: string;
    limited: string;
    perMonth: string;
    perYear: string;
    selectPlanToContinue: string;
  };
  
  // Transactions
  transactions: {
    title: string;
    subtitle: string;
    allTransactions: string;
    filterBy: string;
    sortBy: string;
    date: string;
    amount: string;
    category: string;
    vendor: string;
    description: string;
    status: string;
    pending: string;
    completed: string;
    failed: string;
    income: string;
    expense: string;
    noTransactions: string;
    importFromBank: string;
    addManually: string;
    bulkActions: string;
    categorize: string;
    reconcile: string;
    refresh: string;
    uploadPDF: string;
    importCSV: string;
    exportCSV: string;
    addTransaction: string;
    processing: string;
    addNewTransaction: string;
    addNewTransactionDesc: string;
    enterDescription: string;
    selectType: string;
    selectCategory: string;
    selectDate: string;
    enterAmount: string;
    notes: string;
    addNotes: string;
  };
  
  // Reports
  reports: {
    title: string;
    generateReport: string;
    profitLoss: string;
    balanceSheet: string;
    cashFlow: string;
    taxReport: string;
    customReport: string;
    dateRange: string;
    thisMonth: string;
    lastMonth: string;
    thisQuarter: string;
    lastQuarter: string;
    thisYear: string;
    lastYear: string;
    custom: string;
    export: string;
    schedule: string;
  };
  
  // Funding
  funding: {
    title: string;
    searchLenders: string;
    filterByCounty: string;
    filterByLoanType: string;
    allCounties: string;
    allLoanTypes: string;
    contact: string;
    website: string;
    eligibility: string;
    loanRange: string;
    noLenders: string;
    cdfiNetwork: string;
  };
  
  // Features
    features: {
      unlimitedBanks: string;
      advancedAI: string;
      realtimeReports: string;
      unlimitedTransactions: string;
      emailSupport: string;
      taxReports: string;
      customCategories: string;
      aiInsights: string;
      bankSync: string;
      smartReports: string;
      secureData: string;
      realTimeUpdates: string;
      visualAnalytics: string;
      expenseTracking: string;
      saveTime: string;
      automaticInsights: string;
      secureEncryption: string;
      cancelAnytime: string;
    };
  
  // Bank Accounts & Plaid
  bankAccounts: {
    title: string;
    totalBalance: string;
    addManually: string;
    syncAll: string;
    import12Months: string;
    importing: string;
    connected: string;
    lastUpdated: string;
    accountName: string;
    bankName: string;
    accountType: string;
    checking: string;
    savings: string;
    credit: string;
    currentBalance: string;
    accountNumber: string;
    routingNumber: string;
    noAccounts: string;
    connectYourBank: string;
  };
  
  // Tax & Reports
  tax: {
    preparation: string;
    totalIncome: string;
    totalExpenses: string;
    deductible: string;
    savings: string;
    netTaxable: string;
    grossRevenue: string;
    allBusinessExpenses: string;
    eligibleDeductions: string;
    afterDeductions: string;
    deductibleExpenses: string;
    quarterly: string;
    forms: string;
    tips: string;
    exportPDF: string;
    exportCSV: string;
    atTaxRate: string;
  };
  
  // General UI
  ui: {
    welcomeBack: string;
    financialOverview: string;
    forMonth: string;
    letsGetStarted: string;
    dashboardReady: string;
    addFirstTransaction: string;
    generateSampleData: string;
    gettingStartedTips: string;
    connectBank: string;
    aiAssistant: string;
    instantInsights: string;
    professionalReports: string;
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    avgTransaction: string;
    perTransaction: string;
    profitable: string;
    loss: string;
    recorded: string;
    financialOverviewLast30: string;
    incomeByCategory: string;
    expensesByCategory: string;
    monthlyIncomeVsExpenses: string;
    overview: string;
    categories: string;
    monthly: string;
    recentTransactions: string;
    viewAll: string;
    uncategorized: string;
    recurringTransactions: string;
    taxPreparation: string;
    refresh: string;
    aiFinancialInsights: string;
    needMoreData: string;
    loading: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      businessName: "Business Name",
      taxId: "Tax ID",
      address: "Address",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      download: "Download",
      upload: "Upload",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Info",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      back: "Back",
      next: "Next",
      previous: "Previous",
      finish: "Finish",
      close: "Close",
      open: "Open",
      select: "Select",
      selectAll: "Select All",
      clear: "Clear",
      reset: "Reset",
      apply: "Apply",
      submit: "Submit",
      create: "Create",
      update: "Update",
      view: "View",
      signOut: "Sign Out",
      signIn: "Sign In",
      signUp: "Sign Up",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      start: "Start"
    },
    nav: {
      dashboard: "Dashboard",
      transactions: "Transactions",
      reports: "Reports",
      settings: "Settings",
      funding: "Funding",
      about: "About",
      blog: "Blog",
      demo: "Demo",
      pricing: "Pricing",
      features: "Features"
    },
    hero: {
      title: "AI-Powered Financial Management for Small Businesses",
      subtitle: "Automate bookkeeping, track cash flow, and get AI insights to grow your business",
      cta: "Get Started",
      secondaryCta: "How It Works",
      ctaSecondary: "How It Works",
      trustBadge: "Trusted by businesses"
    },
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      welcomeBack: "Welcome Back",
      orContinueWith: "Or continue with",
      signInGoogle: "Continue with Google",
      termsAgree: "By continuing, you agree to our",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service"
    },
    dashboard: {
      welcome: "Welcome back",
      overview: "Overview",
      quickActions: "Quick Actions",
      recentTransactions: "Recent Transactions",
      insights: "Insights",
      cashFlow: "Cash Flow",
      income: "Income",
      expenses: "Expenses",
      netIncome: "Net Income",
      totalBalance: "Total Balance",
      accountsConnected: "Accounts Connected",
      transactionsImported: "Transactions Imported",
      insightsGenerated: "Insights Generated",
      noData: "No data available",
      connectBank: "Connect Bank Account",
      importTransactions: "Import Transactions",
      generateReport: "Generate Report",
      monthlyTrend: "Monthly Trend",
      categoryBreakdown: "Category Breakdown",
      lastUpdated: "Last Updated"
    },
    settings: {
      title: "Settings",
      description: "Manage your account and application preferences",
      profile: "Profile",
      categories: "Categories",
      vendors: "Vendors",
      budgets: "Budgets",
      security: "Security",
      billing: "Billing",
      integrations: "Integrations",
      preferences: "Preferences",
      personalInfo: "Personal Information",
      businessInfo: "Business Information",
      changePassword: "Change Password",
      twoFactor: "Two-Factor Authentication",
      notifications: "Notifications",
      emailNotifications: "Email Notifications",
      weeklyReports: "Weekly Reports",
      transactionAlerts: "Transaction Alerts",
      accountManagement: "Account Management",
      downloadData: "Download Data",
      exportData: "Export All Data",
      bankConnections: "Bank Connections",
      connectPlaid: "Connect with Plaid",
      platformIntegrations: "Platform Integrations"
    },
    plans: {
      selectPlan: "Select a Plan",
      choosePlan: "Choose the plan that's right for your business",
      free: "Free",
      starter: "Starter",
      professional: "Professional",
      business: "Business",
      mostPopular: "Most Popular",
      currentPlan: "Current Plan",
      upgrade: "Upgrade",
      downgrade: "Downgrade",
      features: "Features",
      unlimited: "Unlimited",
      limited: "Limited",
      perMonth: "/month",
      perYear: "/year",
      selectPlanToContinue: "Please select a plan to continue"
    },
    transactions: {
      title: "Transactions",
      subtitle: "Manage your income and expenses with AI-powered insights",
      allTransactions: "All Transactions",
      filterBy: "Filter by",
      sortBy: "Sort by",
      date: "Date",
      amount: "Amount",
      category: "Category",
      vendor: "Vendor",
      description: "Description",
      status: "Status",
      pending: "Pending",
      completed: "Completed",
      failed: "Failed",
      income: "Income",
      expense: "Expense",
      noTransactions: "No transactions found",
      importFromBank: "Import from Bank",
      addManually: "Add Manually",
      bulkActions: "Bulk Actions",
      categorize: "Categorize",
      reconcile: "Reconcile",
      refresh: "Refresh",
      uploadPDF: "Upload PDF",
      importCSV: "Import CSV",
      exportCSV: "Export CSV",
      addTransaction: "Add Transaction",
      processing: "Processing...",
      addNewTransaction: "Add New Transaction",
      addNewTransactionDesc: "Add a new income or expense transaction to your records",
      enterDescription: "Enter transaction description",
      selectType: "Select transaction type",
      selectCategory: "Select category",
      selectDate: "Select date",
      enterAmount: "Enter amount",
      notes: "Notes",
      addNotes: "Add notes (optional)",
    },
    reports: {
      title: "Reports",
      generateReport: "Generate Report",
      profitLoss: "Profit & Loss",
      balanceSheet: "Balance Sheet",
      cashFlow: "Cash Flow Statement",
      taxReport: "Tax Report",
      customReport: "Custom Report",
      dateRange: "Date Range",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisQuarter: "This Quarter",
      lastQuarter: "Last Quarter",
      thisYear: "This Year",
      lastYear: "Last Year",
      custom: "Custom",
      export: "Export",
      schedule: "Schedule"
    },
    funding: {
      title: "Funding Opportunities",
      searchLenders: "Search Lenders",
      filterByCounty: "Filter by County",
      filterByLoanType: "Filter by Loan Type",
      allCounties: "All Counties",
      allLoanTypes: "All Loan Types",
      contact: "Contact",
      website: "Visit Website",
      eligibility: "Eligibility",
      loanRange: "Loan Range",
      noLenders: "No lenders found",
      cdfiNetwork: "PA CDFI Network"
    },
    features: {
      unlimitedBanks: "Unlimited bank connections",
      advancedAI: "Advanced AI-powered insights",
      realtimeReports: "Real-time reports & analytics",
      aiInsights: "AI-powered insights",
      bankSync: "Bank statement uploads",
      smartReports: "Smart Reports",
      secureData: "Bank-Level Security",
      realTimeUpdates: "Real-Time Updates",
      visualAnalytics: "Visual Analytics",
      expenseTracking: "Expense Tracking",
      saveTime: "Save 10+ Hours Weekly",
      automaticInsights: "Automatically get insights with AI",
      secureEncryption: "Secure bank-level encryption",
      cancelAnytime: "Cancel anytime",
      unlimitedTransactions: "Unlimited transactions",
      emailSupport: "Email support",
      taxReports: "Tax preparation reports",
      customCategories: "Custom categories",
    },
    bankAccounts: {
      title: "Bank Accounts",
      totalBalance: "Total Balance",
      addManually: "Add Manually",
      syncAll: "Sync All Accounts",
      import12Months: "Import 12 Months History",
      importing: "Importing...",
      connected: "Connected",
      lastUpdated: "Last updated",
      accountName: "Account Name",
      bankName: "Bank Name",
      accountType: "Account Type",
      checking: "Checking",
      savings: "Savings",
      credit: "Credit",
      currentBalance: "Current Balance",
      accountNumber: "Account Number",
      routingNumber: "Routing Number",
      noAccounts: "No accounts yet",
      connectYourBank: "Connect your bank to get started"
    },
    tax: {
      preparation: "Tax Preparation",
      totalIncome: "Total Income",
      totalExpenses: "Total Expenses",
      deductible: "Tax Deductible",
      savings: "Tax Savings",
      netTaxable: "Net Taxable",
      grossRevenue: "Gross revenue",
      allBusinessExpenses: "All business expenses",
      eligibleDeductions: "Eligible deductions",
      afterDeductions: "After deductions",
      deductibleExpenses: "Deductible Expenses by Category",
      quarterly: "Quarterly",
      forms: "Tax Forms",
      tips: "Tax Tips",
      exportPDF: "Export PDF Report",
      exportCSV: "Export CSV Data",
      atTaxRate: "At"
    },
    ui: {
      welcomeBack: "Welcome back",
      financialOverview: "Here's your financial overview for",
      forMonth: "for",
      letsGetStarted: "Let's get started!",
      dashboardReady: "Your dashboard is ready. Start by adding your first transaction or connecting your bank account for automatic imports.",
      addFirstTransaction: "Add Your First Transaction",
      generateSampleData: "Generate Sample Data",
      gettingStartedTips: "Getting Started Tips",
      connectBank: "Connect Your Bank",
      aiAssistant: "AI Assistant",
      instantInsights: "Get instant insights and answers about your finances from our AI-powered assistant.",
      professionalReports: "Create professional financial reports for taxes, investors, or business planning.",
      totalRevenue: "Total Revenue",
      totalExpenses: "Total Expenses",
      netProfit: "Net Profit",
      avgTransaction: "Avg Transaction",
      perTransaction: "Per transaction",
      profitable: "Profitable",
      loss: "Loss",
      recorded: "Total recorded",
      financialOverviewLast30: "Financial Overview (Last 30 Days)",
      incomeByCategory: "Income by Category",
      expensesByCategory: "Expenses by Category",
      monthlyIncomeVsExpenses: "Monthly Income vs Expenses",
      overview: "Overview",
      categories: "Categories",
      monthly: "Monthly Trend",
      recentTransactions: "Recent Transactions",
      viewAll: "View All",
      uncategorized: "Uncategorized",
      recurringTransactions: "Recurring Transactions",
      taxPreparation: "Tax Preparation",
      refresh: "Refresh",
      aiFinancialInsights: "AI Financial Insights",
      needMoreData: "Add more transactions to get personalized financial insights.",
      loading: "Loading"
    }
  },
  es: {
    common: {
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      firstName: "Nombre",
      lastName: "Apellido",
      phone: "Teléfono",
      businessName: "Nombre del negocio",
      taxId: "ID fiscal",
      address: "Dirección",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Agregar",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      import: "Importar",
      download: "Descargar",
      upload: "Cargar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      warning: "Advertencia",
      info: "Información",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
      back: "Atrás",
      next: "Siguiente",
      previous: "Anterior",
      finish: "Finalizar",
      close: "Cerrar",
      open: "Abrir",
      select: "Seleccionar",
      selectAll: "Seleccionar todo",
      clear: "Limpiar",
      reset: "Restablecer",
      apply: "Aplicar",
      submit: "Enviar",
      create: "Crear",
      update: "Actualizar",
      view: "Ver",
      signOut: "Cerrar sesión",
      signIn: "Iniciar sesión",
      signUp: "Registrarse",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetPassword: "Restablecer contraseña",
      start: "Comenzar"
    },
    nav: {
      dashboard: "Panel",
      transactions: "Transacciones",
      reports: "Informes",
      settings: "Configuración",
      funding: "Financiamiento",
      about: "Acerca de",
      blog: "Blog",
      demo: "Demostración",
      pricing: "Precios",
      features: "Características"
    },
    hero: {
      title: "Gestión financiera impulsada por IA para pequeñas empresas",
      subtitle: "Automatiza la contabilidad, rastrea el flujo de efectivo y obtén información de IA para hacer crecer tu negocio",
      cta: "Comenzar",
      secondaryCta: "Cómo Funciona",
      ctaSecondary: "Cómo Funciona",
      trustBadge: "Confiado por empresas"
    },
    auth: {
      signIn: "Iniciar sesión",
      signUp: "Registrarse",
      signOut: "Cerrar sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetPassword: "Restablecer contraseña",
      createAccount: "Crear cuenta",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      dontHaveAccount: "¿No tienes una cuenta?",
      welcomeBack: "Bienvenido de nuevo",
      orContinueWith: "O continuar con",
      signInGoogle: "Continuar con Google",
      termsAgree: "Al continuar, aceptas nuestra",
      privacyPolicy: "Política de privacidad",
      termsOfService: "Términos de servicio"
    },
    dashboard: {
      welcome: "Bienvenido de nuevo",
      overview: "Resumen",
      quickActions: "Acciones rápidas",
      recentTransactions: "Transacciones recientes",
      insights: "Información",
      cashFlow: "Flujo de efectivo",
      income: "Ingresos",
      expenses: "Gastos",
      netIncome: "Ingresos netos",
      totalBalance: "Saldo total",
      accountsConnected: "Cuentas conectadas",
      transactionsImported: "Transacciones importadas",
      insightsGenerated: "Información generada",
      noData: "No hay datos disponibles",
      connectBank: "Conectar cuenta bancaria",
      importTransactions: "Importar transacciones",
      generateReport: "Generar informe",
      monthlyTrend: "Tendencia mensual",
      categoryBreakdown: "Desglose por categoría",
      lastUpdated: "Última actualización"
    },
    settings: {
      title: "Configuración",
      description: "Administra tu cuenta y preferencias de la aplicación",
      profile: "Perfil",
      categories: "Categorías",
      vendors: "Proveedores",
      budgets: "Presupuestos",
      security: "Seguridad",
      billing: "Facturación",
      integrations: "Integraciones",
      preferences: "Preferencias",
      personalInfo: "Información personal",
      businessInfo: "Información del negocio",
      changePassword: "Cambiar contraseña",
      twoFactor: "Autenticación de dos factores",
      notifications: "Notificaciones",
      emailNotifications: "Notificaciones por correo",
      weeklyReports: "Informes semanales",
      transactionAlerts: "Alertas de transacciones",
      accountManagement: "Gestión de cuenta",
      downloadData: "Descargar datos",
      exportData: "Exportar todos los datos",
      bankConnections: "Conexiones bancarias",
      connectPlaid: "Conectar con Plaid",
      platformIntegrations: "Integraciones de plataforma"
    },
    plans: {
      selectPlan: "Selecciona un plan",
      choosePlan: "Elige el plan adecuado para tu negocio",
      free: "Gratis",
      starter: "Inicial",
      professional: "Profesional",
      business: "Empresarial",
      mostPopular: "Más popular",
      currentPlan: "Plan actual",
      upgrade: "Mejorar",
      downgrade: "Cambiar a inferior",
      features: "Características",
      unlimited: "Ilimitado",
      limited: "Limitado",
      perMonth: "/mes",
      perYear: "/año",
      selectPlanToContinue: "Por favor selecciona un plan para continuar"
    },
    transactions: {
      title: "Transacciones",
      subtitle: "Gestiona tus ingresos y gastos con información impulsada por IA",
      allTransactions: "Todas las transacciones",
      filterBy: "Filtrar por",
      sortBy: "Ordenar por",
      date: "Fecha",
      amount: "Monto",
      category: "Categoría",
      vendor: "Proveedor",
      description: "Descripción",
      status: "Estado",
      pending: "Pendiente",
      completed: "Completado",
      failed: "Fallido",
      income: "Ingreso",
      expense: "Gasto",
      noTransactions: "No se encontraron transacciones",
      importFromBank: "Importar del banco",
      addManually: "Agregar manualmente",
      bulkActions: "Acciones masivas",
      categorize: "Categorizar",
      reconcile: "Conciliar",
      refresh: "Actualizar",
      uploadPDF: "Cargar PDF",
      importCSV: "Importar CSV",
      exportCSV: "Exportar CSV",
      addTransaction: "Agregar Transacción",
      processing: "Procesando...",
      addNewTransaction: "Agregar Nueva Transacción",
      addNewTransactionDesc: "Agrega una nueva transacción de ingreso o gasto a tus registros",
      enterDescription: "Ingresa descripción de la transacción",
      selectType: "Selecciona tipo de transacción",
      selectCategory: "Selecciona categoría",
      selectDate: "Selecciona fecha",
      enterAmount: "Ingresa monto",
      notes: "Notas",
      addNotes: "Agregar notas (opcional)",
    },
    reports: {
      title: "Informes",
      generateReport: "Generar informe",
      profitLoss: "Pérdidas y ganancias",
      balanceSheet: "Balance general",
      cashFlow: "Estado de flujo de efectivo",
      taxReport: "Informe fiscal",
      customReport: "Informe personalizado",
      dateRange: "Rango de fechas",
      thisMonth: "Este mes",
      lastMonth: "Mes pasado",
      thisQuarter: "Este trimestre",
      lastQuarter: "Trimestre pasado",
      thisYear: "Este año",
      lastYear: "Año pasado",
      custom: "Personalizado",
      export: "Exportar",
      schedule: "Programar"
    },
    funding: {
      title: "Oportunidades de financiamiento",
      searchLenders: "Buscar prestamistas",
      filterByCounty: "Filtrar por condado",
      filterByLoanType: "Filtrar por tipo de préstamo",
      allCounties: "Todos los condados",
      allLoanTypes: "Todos los tipos de préstamo",
      contact: "Contacto",
      website: "Visitar sitio web",
      eligibility: "Elegibilidad",
      loanRange: "Rango de préstamo",
      noLenders: "No se encontraron prestamistas",
      cdfiNetwork: "Red CDFI de PA"
    },
    features: {
      unlimitedBanks: "Conexiones bancarias ilimitadas",
      advancedAI: "Información avanzada impulsada por IA",
      realtimeReports: "Informes y análisis en tiempo real",
      unlimitedTransactions: "Transacciones ilimitadas",
      emailSupport: "Soporte por correo electrónico",
      taxReports: "Informes de preparación de impuestos",
      customCategories: "Categorías personalizadas",
      aiInsights: "Información impulsada por IA",
      bankSync: "Cargas de estados de cuenta bancarios",
      smartReports: "Reportes Inteligentes",
      secureData: "Seguridad de Nivel Bancario",
      realTimeUpdates: "Actualizaciones en Tiempo Real",
      visualAnalytics: "Análisis Visual",
      expenseTracking: "Seguimiento de Gastos",
      saveTime: "Ahorra más de 10 horas semanales",
      automaticInsights: "Obtén información automáticamente con IA",
      secureEncryption: "Encriptación segura de nivel bancario",
      cancelAnytime: "Cancela en cualquier momento",
    },
    bankAccounts: {
      title: "Cuentas bancarias",
      totalBalance: "Saldo total",
      addManually: "Agregar manualmente",
      syncAll: "Sincronizar todas las cuentas",
      import12Months: "Importar historial de 12 meses",
      importing: "Importando...",
      connected: "Conectado",
      lastUpdated: "Última actualización",
      accountName: "Nombre de la cuenta",
      bankName: "Nombre del banco",
      accountType: "Tipo de cuenta",
      checking: "Corriente",
      savings: "Ahorros",
      credit: "Crédito",
      currentBalance: "Saldo actual",
      accountNumber: "Número de cuenta",
      routingNumber: "Número de ruta",
      noAccounts: "Aún no hay cuentas",
      connectYourBank: "Conecta tu banco para comenzar"
    },
    tax: {
      preparation: "Preparación de impuestos",
      totalIncome: "Ingresos totales",
      totalExpenses: "Gastos totales",
      deductible: "Deducible de impuestos",
      savings: "Ahorro fiscal",
      netTaxable: "Ingreso neto gravable",
      grossRevenue: "Ingresos brutos",
      allBusinessExpenses: "Todos los gastos del negocio",
      eligibleDeductions: "Deducciones elegibles",
      afterDeductions: "Después de deducciones",
      deductibleExpenses: "Gastos deducibles por categoría",
      quarterly: "Trimestral",
      forms: "Formularios fiscales",
      tips: "Consejos fiscales",
      exportPDF: "Exportar informe PDF",
      exportCSV: "Exportar datos CSV",
      atTaxRate: "Con tasa de impuesto del"
    },
    ui: {
      welcomeBack: "Bienvenido de nuevo",
      financialOverview: "Aquí está tu resumen financiero de",
      forMonth: "para",
      letsGetStarted: "¡Comencemos!",
      dashboardReady: "Tu panel está listo. Comienza agregando tu primera transacción o conectando tu cuenta bancaria para importaciones automáticas.",
      addFirstTransaction: "Agregar tu primera transacción",
      generateSampleData: "Generar datos de muestra",
      gettingStartedTips: "Consejos para comenzar",
      connectBank: "Conecta tu banco",
      aiAssistant: "Asistente IA",
      instantInsights: "Obtén información instantánea y respuestas sobre tus finanzas de nuestro asistente impulsado por IA.",
      professionalReports: "Crea informes financieros profesionales para impuestos, inversores o planificación empresarial.",
      totalRevenue: "Ingresos totales",
      totalExpenses: "Gastos totales",
      netProfit: "Beneficio neto",
      avgTransaction: "Transacción promedio",
      perTransaction: "Por transacción",
      profitable: "Rentable",
      loss: "Pérdida",
      recorded: "Total registrado",
      financialOverviewLast30: "Resumen financiero (Últimos 30 días)",
      incomeByCategory: "Ingresos por categoría",
      expensesByCategory: "Gastos por categoría",
      monthlyIncomeVsExpenses: "Ingresos vs gastos mensuales",
      overview: "Resumen",
      categories: "Categorías",
      monthly: "Tendencia mensual",
      recentTransactions: "Transacciones recientes",
      viewAll: "Ver todo",
      uncategorized: "Sin categorizar",
      recurringTransactions: "Transacciones recurrentes",
      taxPreparation: "Preparación de impuestos",
      refresh: "Actualizar",
      aiFinancialInsights: "Información financiera con IA",
      needMoreData: "Agrega más transacciones para obtener información financiera personalizada.",
      loading: "Cargando"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      return (saved as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      t: translations[language] 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};