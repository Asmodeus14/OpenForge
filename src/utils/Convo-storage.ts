// src/utils/conversationStorage.ts

const CONVERSATIONS_STORAGE_KEY = 'openforge_conversations_v1';
const MESSAGES_STORAGE_KEY_PREFIX = 'openforge_messages_';

export interface StoredConversation {
  id: string;
  peerAddress: string;
  peerName?: string;
  peerAvatar?: string;
  lastMessage?: string;
  lastMessageTime: Date;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // XMTP specific
  xmtpConversationId?: string;
  inboxId?: string;
}

export interface StoredMessage {
  id: string;
  content: string;
  senderAddress: string;
  receiverAddress: string;
  sent: Date;
  isRead: boolean;
  conversationId: string;
  xmtpMessageId?: string;
}

class ConversationStorage {
  // Get all stored conversations
  static getConversations(): StoredConversation[] {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: any) => ({
        ...conv,
        lastMessageTime: new Date(conv.lastMessageTime),
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
    } catch (error) {
      console.error('Error reading conversations from storage:', error);
      return [];
    }
  }
  
  // Save conversation to storage
  static saveConversation(conversation: StoredConversation): void {
    try {
      const conversations = this.getConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        // Update existing
        conversations[existingIndex] = {
          ...conversations[existingIndex],
          ...conversation,
          updatedAt: new Date()
        };
      } else {
        // Add new
        conversations.push({
          ...conversation,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Sort by last message time (most recent first)
      conversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
  
  // Get messages for a conversation
  static getMessages(conversationId: string): StoredMessage[] {
    try {
      const key = `${MESSAGES_STORAGE_KEY_PREFIX}${conversationId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      
      const messages = JSON.parse(stored);
      return messages.map((msg: any) => ({
        ...msg,
        sent: new Date(msg.sent)
      }));
    } catch (error) {
      console.error('Error reading messages:', error);
      return [];
    }
  }
  
  // Save message to storage
  static saveMessage(message: StoredMessage): void {
    try {
      const messages = this.getMessages(message.conversationId);
      
      // Check if message already exists
      const existingIndex = messages.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      // Sort by timestamp (oldest first)
      messages.sort((a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime());
      
      const key = `${MESSAGES_STORAGE_KEY_PREFIX}${message.conversationId}`;
      localStorage.setItem(key, JSON.stringify(messages));
      
      // Update conversation's last message
      this.updateConversationLastMessage(message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }
  
  // Update conversation's last message
  static updateConversationLastMessage(message: StoredMessage): void {
    const conversations = this.getConversations();
    const conversationIndex = conversations.findIndex(c => c.id === message.conversationId);
    
    if (conversationIndex >= 0) {
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        lastMessage: message.content,
        lastMessageTime: message.sent,
        updatedAt: new Date(),
        unreadCount: message.senderAddress !== message.receiverAddress && !message.isRead
          ? conversations[conversationIndex].unreadCount + 1
          : conversations[conversationIndex].unreadCount
      };
      
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
  }
  
  // Mark conversation as read
  static markAsRead(conversationId: string): void {
    const conversations = this.getConversations();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex >= 0) {
      conversations[conversationIndex].unreadCount = 0;
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
      
      // Also mark all messages as read
      const messages = this.getMessages(conversationId);
      const updatedMessages = messages.map(msg => ({
        ...msg,
        isRead: true
      }));
      
      const key = `${MESSAGES_STORAGE_KEY_PREFIX}${conversationId}`;
      localStorage.setItem(key, JSON.stringify(updatedMessages));
    }
  }
  
  // Delete conversation
  static deleteConversation(conversationId: string): void {
    try {
      const conversations = this.getConversations();
      const filtered = conversations.filter(c => c.id !== conversationId);
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(filtered));
      
      // Also delete messages
      const key = `${MESSAGES_STORAGE_KEY_PREFIX}${conversationId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }
  
  // Clear all storage
  static clearAll(): void {
    localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
    // Find and remove all message keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(MESSAGES_STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // Search conversations
  static searchConversations(query: string): StoredConversation[] {
    const conversations = this.getConversations();
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conv =>
      conv.peerAddress.toLowerCase().includes(lowerQuery) ||
      conv.peerName?.toLowerCase().includes(lowerQuery) ||
      conv.lastMessage?.toLowerCase().includes(lowerQuery)
    );
  }
}

export default ConversationStorage;