export interface Message {
    id: string;
    chatroomId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    readBy:string[];
    // Add other relevant properties as needed
  }
  