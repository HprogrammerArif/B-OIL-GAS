// types/chat.ts

export interface WSBaseMessage {
  type?: "new_message" | "confirm_send" | "message_review";
  message?: string;
  original?: string;
  refined?: string;
}

export interface IChatMessage {
  id?: string;
  message: string;
  sender_id: number;
  sender_name: string;
  timestamp: string; // This will stay as the formatted time for now
  raw_timestamp: string; // Added to store full date info
  is_mine: boolean;
  is_pending?: boolean;
  type?: string;
  image_url?: string;
  image?: string;
  file?: {
    name: string;
    uri: string;
  };
}

export interface IToneReview {
  original: string;
  refined: string;
}
