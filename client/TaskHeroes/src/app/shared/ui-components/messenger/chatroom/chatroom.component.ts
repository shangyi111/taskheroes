import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // For route parameters and navigation
import { Subscription } from 'rxjs'; // To manage observable subscriptions

// --- Import your services here ---
// import { ChatroomService } from 'path/to/your/chatroom.service';
// import { AuthService } from 'path/to/your/auth.service';

@Component({
  selector: 'app-chatroom', // Changed selector to app-chatroom
  templateUrl: './chatroom.component.html', // Path to your HTML template
  styleUrls: ['./chatroom.component.scss'] // Path to your SCSS styles
})
export class ChatroomComponent implements OnInit, OnDestroy { // Changed class name to ChatroomComponent

  // --- Properties to hold data ---
  currentUserId: string | null = null;
  currentUserRole: string | null = null; // 'seeker' or 'provider'
  chatroomId: string | null = null; // The ID of the currently viewed chatroom

  chatroom: any; // You'll define a proper interface for Chatroom later
  messages: any[] = []; // You'll define a proper interface for Message later

  newMessageContent: string = ''; // Holds the content of the message being typed

  isLoading: boolean = true; // To show a loading indicator
  error: string | null = null; // To display error messages

  // --- Subscriptions to manage memory ---
  private routeSubscription: Subscription | undefined;
  private chatroomMessageSubscription: Subscription | undefined; // For real-time messages

  constructor(
    private route: ActivatedRoute, // Used to read URL parameters (like chatroomId)
    private router: Router,       // Used for programmatic navigation (e.g., redirecting)
    // --- Inject your services here ---
    // private chatroomService: ChatroomService,
    // private authService: AuthService
  ) {}

  /**
   * ngOnInit is called once, after the component's data-bound properties are initialized.
   * It's a good place to fetch data from services or set up subscriptions.
   */
  ngOnInit(): void {
    console.log('ChatroomComponent initialized.'); // Updated console log

    // --- Step 1: Get current user info ---
    // Uncomment and replace with your actual AuthService calls
    // this.currentUserId = this.authService.getCurrentUserId();
    // this.currentUserRole = this.authService.currentUserValue?.role || null;

    // if (!this.currentUserId || !this.currentUserRole) {
    //   this.error = 'User not logged in or role not defined.';
    //   this.router.navigate(['/login']); // Redirect if not logged in
    //   return;
    // }

    // --- Step 2: Subscribe to route parameters to get chatroomId ---
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.chatroomId = params.get('chatroomId');
      console.log('Chatroom ID from route:', this.chatroomId);

      if (this.chatroomId) {
        // --- Step 3: Load chatroom data and messages ---
        // You'll call methods here to fetch data from your chatroomService
        // Example: this.loadChatroomData(this.chatroomId);
        // Example: this.setupRealtimeMessaging(this.chatroomId);
      } else {
        this.error = 'Chatroom ID not found in URL.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Method to load chatroom details and messages from your backend.
   * This will involve calling methods on your `chatroomService`.
   */
  private loadChatroomData(id: string): void {
    // Implement logic to fetch chatroom details and initial messages
    // Set isLoading to false once data is loaded or if an error occurs.
    // Example:
    // this.chatroomService.getChatroomById(id).subscribe(
    //   data => { this.chatroom = data; this.isLoading = false; },
    //   error => { this.error = 'Failed to load chatroom.'; this.isLoading = false; }
    // );
  }

  /**
   * Method to set up real-time messaging listeners (e.g., Socket.IO).
   */
  private setupRealtimeMessaging(id: string): void {
    // Implement logic to join a Socket.IO room and listen for new messages
    // Example:
    // this.chatroomService.joinChatroom(id);
    // this.chatroomMessageSubscription = this.chatroomService.onNewMessage().subscribe(message => {
    //   if (message.chatroomId === this.chatroomId) {
    //     this.messages.push(message);
    //     // Optionally scroll to bottom here
    //   }
    // });
  }

  /**
   * Method to send a new message.
   * This will involve calling a method on your `chatroomService`.
   */
  sendMessage(): void {
    if (this.newMessageContent.trim() && this.currentUserId && this.chatroomId) {
      console.log('Sending message:', this.newMessageContent);
      // Construct the message object (e.g., { chatroomId, senderId, content, timestamp })
      // Call your chatroomService to send the message
      // Example:
      // this.chatroomService.sendMessage(messageObject).subscribe(
      //   response => { this.newMessageContent = ''; }, // Clear input on success
      //   error => { this.error = 'Failed to send message.'; console.error(error); }
      // );
    }
  }

  /**
   * Helper function to determine if a message was sent by the current user for styling.
   */
  isMyMessage(senderId: string): boolean {
    return senderId === this.currentUserId;
  }

  /**
   * ngOnDestroy is called once, before the component is destroyed.
   * It's crucial for unsubscribing from observables to prevent memory leaks.
   */
  ngOnDestroy(): void {
    console.log('ChatroomComponent destroyed.'); // Updated console log
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.chatroomMessageSubscription) {
      this.chatroomMessageSubscription.unsubscribe();
    }
    // If you joined a real-time chatroom, leave it here
    // Example: if (this.chatroomId) this.chatroomService.leaveChatroom(this.chatroomId);
  }
}