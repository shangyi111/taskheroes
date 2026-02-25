export interface Message {
    id: string;
    chatroomId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    readBy:string[];
    type?: 'ACTION_PENDING' | 'LEAVE_REVIEW' | 'DEFAULT'; 
    isSystem?: boolean;
    // Add other relevant properties as needed
  }
  