export enum AppMode {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  IMAGE_GEN = 'IMAGE_GEN',
  LIVE_VOICE = 'LIVE_VOICE'
}

export interface Message {
  role: 'user' | 'model';
  text?: string;
  image?: string; // base64
  isThinking?: boolean;
  groundingUrls?: Array<{ title: string; uri: string }>;
  audioData?: string; // base64 for TTS playback
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  useThinking: boolean;
  useSearch: boolean;
}

export interface ImageGenSettings {
  aspectRatio: string;
  size: '1K' | '2K' | '4K';
  prompt: string;
}
