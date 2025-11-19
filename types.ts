export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  userAudio?: string; // Blob URL
  customImage?: string; // Pre-generated image URL for custom stories
}

export interface Story {
  title: string;
  pages: StoryPage[];
  dedicationAudio?: string; // Blob URL for personal message
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppView {
  HOME = 'HOME',
  STORY_CREATOR = 'STORY_CREATOR',
  CUSTOM_CREATOR = 'CUSTOM_CREATOR',
  BOOK_READER = 'BOOK_READER',
  CHAT = 'CHAT'
}