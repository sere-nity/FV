// Data source interface for both Mock and Fanvue implementations

export interface ChatMessage {
  id: string;
  sender: 'creator' | 'fan';
  text: string;
  sentAt: Date;
}

export interface FanProfile {
  id: string;
  fanvueUserUuid: string;
  displayName: string;
}

export interface DataSource {
  /**
   * Get chat messages for a fan
   */
  getChatMessages(creatorId: string, fanId: string): Promise<ChatMessage[]>;

  /**
   * Get fan profile by Fanvue UUID
   */
  getFanProfile(fanvueUserUuid: string): Promise<FanProfile | null>;

  /**
   * Send a message to a fan (for DM cards, stretch feature)
   */
  sendMessage?(creatorId: string, fanId: string, message: string): Promise<void>;
}
