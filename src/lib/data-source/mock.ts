import { DataSource, ChatMessage, FanProfile } from './types';
import { db } from '../db';

/**
 * MockSource: reads from local SQLite database
 * Used when DATA_SOURCE=mock (default for demo)
 */
export class MockSource implements DataSource {
  async getChatMessages(creatorId: string, fanId: string): Promise<ChatMessage[]> {
    const messages = await db.message.findMany({
      where: {
        fan: {
          id: fanId,
          creatorId: creatorId,
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender as 'creator' | 'fan',
      text: msg.text,
      sentAt: msg.sentAt,
    }));
  }

  async getFanProfile(fanvueUserUuid: string): Promise<FanProfile | null> {
    const fan = await db.fan.findUnique({
      where: {
        fanvueUserUuid: fanvueUserUuid,
      },
    });

    if (!fan) return null;

    return {
      id: fan.id,
      fanvueUserUuid: fan.fanvueUserUuid,
      displayName: fan.displayName,
    };
  }

  async sendMessage(creatorId: string, fanId: string, message: string): Promise<void> {
    // Mock implementation: save to database
    await db.message.create({
      data: {
        fanId,
        sender: 'creator',
        text: message,
        sentAt: new Date(),
      },
    });
  }
}
