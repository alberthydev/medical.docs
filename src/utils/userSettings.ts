import { AppUser, UserSettings, PromptVersionItem } from '../types';
import { FULL_SYSTEM_PROMPT } from '../data/fullSystemPrompt';

export const PREDEFINED_USERS: AppUser[] = [
  {
    id: 'helena',
    name: 'Dra. Helena Vance',
    role: 'Farmacêutica Auditora',
    avatarId: 'cat',
    email: 'helena.vance@saude.sp.gov.br',
    crf: 'CRF-SP 48.912'
  },
  {
    id: 'carlos',
    name: 'Dr. Carlos Mendes',
    role: 'Médico Regulador / Auditor',
    avatarId: 'lion',
    email: 'carlos.mendes@saude.sp.gov.br',
    crf: 'CRM-SP 98.441'
  },
  {
    id: 'patricia',
    name: 'Dra. Patrícia Lima',
    role: 'Especialista em Gestão CEAF',
    avatarId: 'fox',
    email: 'patricia.lima@saude.sp.gov.br',
    crf: 'CRF-SP 52.310'
  }
];

const CURRENT_USER_KEY = 'medicaldocs_current_user_id';
const SETTINGS_PREFIX = 'medicaldocs_user_settings_';

// Default initial prompt history version
function createDefaultHistory(userName: string): PromptVersionItem[] {
  return [
    {
      id: 'v-1-default',
      version: 1,
      timestamp: '17/09/2026 às 08:30',
      isoDate: new Date().toISOString(),
      content: FULL_SYSTEM_PROMPT,
      charCount: FULL_SYSTEM_PROMPT.length,
      note: 'Versão de Referência Oficial (PCDT / CEAF Ministério da Saúde)',
      authorName: userName
    }
  ];
}

export function getDefaultSettingsForUser(user: AppUser): UserSettings {
  // Give distinctive initial presets so user instantly sees each profile's uniqueness
  if (user.id === 'carlos') {
    return {
      fontFamily: 'serif',
      fontSize: 'lg',
      colorPalette: 'slate',
      activePrompt: FULL_SYSTEM_PROMPT,
      promptHistory: createDefaultHistory(user.name)
    };
  } else if (user.id === 'patricia') {
    return {
      fontFamily: 'mono',
      fontSize: 'sm',
      colorPalette: 'emerald',
      activePrompt: FULL_SYSTEM_PROMPT,
      promptHistory: createDefaultHistory(user.name)
    };
  }

  // Default for Helena
  return {
    fontFamily: 'sans',
    fontSize: 'md',
    colorPalette: 'navy',
    activePrompt: FULL_SYSTEM_PROMPT,
    promptHistory: createDefaultHistory(user.name)
  };
}

export function getCurrentUser(): AppUser {
  try {
    const savedId = localStorage.getItem(CURRENT_USER_KEY);
    if (savedId) {
      const found = PREDEFINED_USERS.find(u => u.id === savedId);
      if (found) return found;
      // If custom user was stored as JSON
      const customUserJson = localStorage.getItem(`medicaldocs_custom_user_${savedId}`);
      if (customUserJson) {
        return JSON.parse(customUserJson);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar usuário atual:', e);
  }
  return PREDEFINED_USERS[0]; // Helena by default
}

export function setCurrentUser(user: AppUser): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    if (!PREDEFINED_USERS.some(u => u.id === user.id)) {
      localStorage.setItem(`medicaldocs_custom_user_${user.id}`, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Erro ao salvar usuário atual:', e);
  }
}

export function getUserSettings(userId: string): UserSettings {
  const user = PREDEFINED_USERS.find(u => u.id === userId) || getCurrentUser();
  try {
    const data = localStorage.getItem(`${SETTINGS_PREFIX}${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure all fields exist
      return {
        fontFamily: parsed.fontFamily || 'sans',
        fontSize: parsed.fontSize || 'md',
        colorPalette: parsed.colorPalette || 'navy',
        activePrompt: parsed.activePrompt || FULL_SYSTEM_PROMPT,
        promptHistory: Array.isArray(parsed.promptHistory) && parsed.promptHistory.length > 0 
          ? parsed.promptHistory 
          : createDefaultHistory(user.name)
      };
    }
  } catch (e) {
    console.warn(`Erro ao ler configurações do usuário ${userId}:`, e);
  }

  return getDefaultSettingsForUser(user);
}

export function saveUserSettings(userId: string, settings: UserSettings): void {
  try {
    localStorage.setItem(`${SETTINGS_PREFIX}${userId}`, JSON.stringify(settings));
  } catch (e) {
    console.warn(`Erro ao persistir configurações do usuário ${userId}:`, e);
  }
}

/**
 * Saves a new prompt version.
 * Moves previous active prompt to the history list with date/time,
 * and sets the new text as active.
 */
export function saveNewPromptVersion(
  userId: string, 
  newContent: string, 
  note?: string
): UserSettings {
  const currentSettings = getUserSettings(userId);
  const user = PREDEFINED_USERS.find(u => u.id === userId) || getCurrentUser();

  // If text hasn't changed at all, just return current
  if (newContent.trim() === currentSettings.activePrompt.trim()) {
    return currentSettings;
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const nextVersionNum = (currentSettings.promptHistory[0]?.version || 0) + 1;

  // The *previous* active prompt is archived into the history list
  const archivedPrevious: PromptVersionItem = {
    id: `v-${Date.now()}`,
    version: nextVersionNum,
    timestamp: `${formattedDate} às ${formattedTime}`,
    isoDate: now.toISOString(),
    content: currentSettings.activePrompt,
    charCount: currentSettings.activePrompt.length,
    note: note || `Versão arquivada antes da atualização por ${user.name}`,
    authorName: user.name
  };

  const updatedSettings: UserSettings = {
    ...currentSettings,
    activePrompt: newContent,
    promptHistory: [archivedPrevious, ...currentSettings.promptHistory]
  };

  saveUserSettings(userId, updatedSettings);
  return updatedSettings;
}

export function resetPromptToDefault(userId: string): UserSettings {
  return saveNewPromptVersion(
    userId, 
    FULL_SYSTEM_PROMPT, 
    'Restauração das diretrizes originais do PCDT/CEAF'
  );
}
