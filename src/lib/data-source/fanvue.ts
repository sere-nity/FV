import { DataSource, ChatMessage, FanProfile } from './types';

/**
 * FanvueSource: reads from Fanvue API
 * Used when DATA_SOURCE=fanvue
 * Requires valid Fanvue session token
 * 
 * NOTE: This is a placeholder. The Fanvue API does not currently expose
 * chat history endpoints, so this cannot be implemented yet.
 */
export class FanvueSource implements DataSource {
  async getChatMessages(creatorId: string, fanId: string): Promise<ChatMessage[]> {
    // The @fanvue/builder-sdk doesn't expose chat APIs in the current version
    // This is a placeholder for when the API becomes available
    
    // Example future implementation:
    // const response = await fetch(`/api/conversations/${fanId}/messages`, {
    //   headers: { Authorization: `Bearer ${accessToken}` }
    // });
    // return response.data.messages;

    throw new Error('FanvueSource.getChatMessages not yet implemented - Fanvue API does not expose chat history');
  }

  async getFanProfile(fanvueUserUuid: string): Promise<FanProfile | null> {
    // Note: This would use the Fanvue API to get fan profile
    // Placeholder for when the API becomes available
    
    throw new Error('FanvueSource.getFanProfile not yet implemented - use MockSource for demo');
  }

  async sendMessage(creatorId: string, fanId: string, message: string): Promise<void> {
    // Would use Fanvue API to send DM
    throw new Error('FanvueSource.sendMessage not yet implemented');
  }
}
