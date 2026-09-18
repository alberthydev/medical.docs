import React, { useState, useEffect } from 'react';
import { ScreenId, PatientAnalysis, AppUser, UserSettings, SharedParecerDetails } from './types';
import { DEFAULT_PATIENT_ANALYSIS, getMarkdownForPatient } from './data/mockData';
import { 
  getCurrentUser, 
  setCurrentUser as persistCurrentUser, 
  getUserSettings, 
  saveUserSettings, 
  saveNewPromptVersion 
} from './utils/userSettings';
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './components/LoginScreen';
import { NovaAnaliseScreen } from './components/NovaAnaliseScreen';
import { ParecerScreen } from './components/ParecerScreen';
import { HistoricoScreen } from './components/HistoricoScreen';
import { PerfilScreen } from './components/PerfilScreen';
import { ConfiguracoesScreen } from './components/ConfiguracoesScreen';
import { PromptEditorModal } from './components/PromptEditorModal';
import { ShareModal } from './components/ShareModal';
import { ParecerCompartilhadoScreen } from './components/ParecerCompartilhadoScreen';
import { Toast } from './components/Toast';
import { AvatarId } from './components/Avatar';

const STORAGE_HISTORY_KEY = 'medauditor_patients_history_v1';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('nova-analise');
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>(() => getUserSettings(getCurrentUser().id));
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);

  const [activePatient, setActivePatient] = useState<PatientAnalysis>(DEFAULT_PATIENT_ANALYSIS);
  const [currentMarkdown, setCurrentMarkdown] = useState<string>('');
  const [allPatients, setAllPatients] = useState<PatientAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading patient history from localStorage:', e);
    }
    return [];
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [shareModalPatient, setShareModalPatient] = useState<PatientAnalysis | null>(null);
  const [sharedParecerData, setSharedParecerData] = useState<SharedParecerDetails | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<AvatarId>(() => (getCurrentUser().avatarId as AvatarId) || 'cat');

  // Auto-collapse sidebar on tablet resolutions (768px - 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check URL hash on load for deep linking to shared parecer
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#parecer=')) {
        const protocol = decodeURIComponent(hash.replace('#parecer=', '')).toUpperCase();
        const found = allPatients.find(p => p.protocolNumber.toUpperCase() === protocol || p.id === protocol);
        if (found) {
          const targetMarkdown = getMarkdownForPatient(found);
          handleOpenSharedView(found, targetMarkdown);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [allPatients, currentUser, avatarId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Switch active user & automatically load their respective settings & prompt history
  const handleSwitchUser = (newUser: AppUser) => {
    persistCurrentUser(newUser);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    const loadedSettings = getUserSettings(newUser.id);
    setUserSettings(loadedSettings);
    setAvatarId(newUser.avatarId as AvatarId);
  };

  // Update settings (fontFamily, fontSize, colorPalette)
  const handleUpdateSettings = (newPartial: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...userSettings,
      ...newPartial
    };
    setUserSettings(updated);
    saveUserSettings(currentUser.id, updated);
  };

  // Save new prompt version (moves old active prompt to promptHistory with timestamp)
  const handleSavePrompt = (newContent: string, note?: string) => {
    const updated = saveNewPromptVersion(currentUser.id, newContent, note);
    setUserSettings(updated);
  };

  const handleSelectPatientFromHistory = (patient: PatientAnalysis) => {
    setActivePatient(patient);
    setCurrentMarkdown(getMarkdownForPatient(patient));
    setCurrentScreen('parecer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartAnalysis = (markdownText: string, patientData?: PatientAnalysis) => {
    setCurrentMarkdown(markdownText);
    if (patientData) {
      setActivePatient(patientData);
      setAllPatients(prev => {
        const filtered = prev.filter(p => p.id !== patientData.id && p.protocolNumber !== patientData.protocolNumber);
        const updated = [patientData, ...filtered];
        try {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving patient history to localStorage:', e);
        }
        return updated;
      });
    }
    setCurrentScreen('parecer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Shared View (includes author, date/time with day and exact hour)
  const handleOpenSharedView = (patient: PatientAnalysis, customMarkdown?: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullDateStr = now.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    const markdownToUse = customMarkdown || (activePatient.id === patient.id && currentMarkdown.trim() ? currentMarkdown : getMarkdownForPatient(patient));

    const details: SharedParecerDetails = {
      id: `shared-${patient.protocolNumber || 'REG'}`,
      patient: patient,
      markdown: markdownToUse,
      author: {
        name: currentUser.name,
        role: currentUser.role,
        crf: currentUser.crf || 'CRF-SP 48.912',
        avatarId: avatarId || currentUser.avatarId || 'cat',
        email: currentUser.email || 'auditoria@saude.gov.br'
      },
      generatedAt: `${formattedDate} às ${formattedTime}`,
      generatedDateFull: `${fullDateStr} às ${formattedTime} (Horário de Brasília)`,
      securityHash: `MD-SEC-${patient.protocolNumber.replace(/[^0-9]/g, '') || 'REG7'}-X7`,
      isProtected: true
    };

    setSharedParecerData(details);
    setCurrentScreen('parecer-compartilhado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveParecer = Boolean(currentMarkdown && currentMarkdown.trim().length > 0);

  // If currently in login screen
  if (currentScreen === 'login') {
    return (
      <div 
        data-palette={userSettings.colorPalette}
        className={`w-full min-h-screen font-family-${userSettings.fontFamily} font-size-${userSettings.fontSize}`}
      >
        <LoginScreen 
          currentUser={currentUser}
          onSelectUser={handleSwitchUser}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setCurrentScreen('nova-analise');
          }} 
        />
        <Toast message={toastMessage} />
      </div>
    );
  }

  return (
    <div 
      data-palette={userSettings.colorPalette}
      className={`min-h-screen flex text-[#1c1c19] selection:bg-[#0f2137] selection:text-white font-family-${userSettings.fontFamily} font-size-${userSettings.fontSize}`}
      style={{ backgroundColor: 'var(--color-bg, #fcf9f4)' }}
    >
      {/* Standardized Collapsible Web Sidebar (shown on md: and up) */}
      <Sidebar 
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={() => {
          setIsLoggedIn(false);
          setCurrentScreen('login');
        }}
        currentUser={currentUser}
        avatarId={avatarId}
        hasParecer={hasActiveParecer}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Minimal Context Header */}
        <AppHeader 
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={() => {
            setIsLoggedIn(false);
            setCurrentScreen('login');
          }}
          currentUser={currentUser}
          avatarId={avatarId}
        />

        {/* Content Container */}
        <main className="flex-1 pb-24 md:pb-12">
          {currentScreen === 'nova-analise' && (
            <NovaAnaliseScreen 
              onStartAnalysis={handleStartAnalysis}
              onShowNotice={showToast}
              activePrompt={userSettings.activePrompt}
              onOpenPromptEditor={() => setIsPromptEditorOpen(true)}
            />
          )}

          {currentScreen === 'parecer' && (
            <ParecerScreen 
              markdownContent={currentMarkdown}
              onUpdateMarkdown={setCurrentMarkdown}
              onCopyNotice={showToast}
              onOpenShareModal={() => setShareModalPatient(activePatient)}
              onNavigateToNovaAnalise={() => {
                setCurrentScreen('nova-analise');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentScreen === 'parecer-compartilhado' && (
            <ParecerCompartilhadoScreen 
              sharedData={sharedParecerData || {
                id: `shared-${activePatient.protocolNumber || 'PROCESSO'}`,
                patient: activePatient,
                markdown: currentMarkdown,
                author: {
                  name: currentUser.name,
                  role: currentUser.role,
                  crf: currentUser.crf || 'CRF-SP 48.912',
                  avatarId: avatarId || currentUser.avatarId || 'cat',
                  email: currentUser.email || 'auditoria@saude.gov.br'
                },
                generatedAt: 'Hoje',
                generatedDateFull: 'Hoje (Horário Oficial de Brasília)',
                securityHash: `MD-SEC-${activePatient.protocolNumber.replace(/[^0-9]/g, '') || '0000'}-X7`,
                isProtected: true
              }}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}
              onLogin={(user) => {
                handleSwitchUser(user);
                setIsLoggedIn(true);
              }}
              onLogout={() => setIsLoggedIn(false)}
              onNavigate={(screen) => {
                setCurrentScreen(screen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCopyNotice={showToast}
            />
          )}

          {currentScreen === 'historico' && (
            <HistoricoScreen 
              historyItems={allPatients}
              onSelectPatient={handleSelectPatientFromHistory}
              onOpenShareModal={(p) => setShareModalPatient(p)}
            />
          )}

          {currentScreen === 'configuracoes' && (
            <ConfiguracoesScreen 
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              settings={userSettings}
              onUpdateSettings={handleUpdateSettings}
              onOpenPromptEditor={() => setIsPromptEditorOpen(true)}
              onShowNotice={showToast}
            />
          )}

          {currentScreen === 'perfil' && (
            <PerfilScreen 
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onNavigateToConfig={() => {
                setCurrentScreen('configuracoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLogout={() => {
                setIsLoggedIn(false);
                setCurrentScreen('login');
              }}
              onShowNotice={showToast}
              avatarId={avatarId}
              onSelectAvatar={setAvatarId}
            />
          )}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (< md) */}
      <BottomNav 
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasParecer={hasActiveParecer}
      />

      {/* Prompt Editor & Version History Modal */}
      <PromptEditorModal 
        isOpen={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
        currentUser={currentUser}
        activePrompt={userSettings.activePrompt}
        promptHistory={userSettings.promptHistory}
        onSavePrompt={handleSavePrompt}
        onShowNotice={showToast}
      />

      {/* Share Bottom Sheet Modal */}
      <ShareModal 
        patient={shareModalPatient}
        onClose={() => setShareModalPatient(null)}
        onShowNotice={showToast}
        onOpenSharedView={(patient) => handleOpenSharedView(patient)}
      />

      {/* Action Feedback Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
