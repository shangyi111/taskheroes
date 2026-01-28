import { Component, input, output, ViewChild, ElementRef, signal, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from 'src/app/shared/models/message';
import { MessageComponent } from '../../../message/message.component';
import { ThLoadingComponent } from 'src/app/shared/ui-components/th-loading/loading.component';
import { EmptyStateComponent } from 'src/app/shared/ui-components/th-empty-state/empty-state.component';
@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  imports: [CommonModule, MessageComponent, ThLoadingComponent, EmptyStateComponent],
  templateUrl: './chat-message-list.component.html',
  styleUrls: ['./chat-message-list.component.scss']
})
export class ChatMessageListComponent implements OnDestroy {
    _messages = signal<Message[]>([]);
  // Inputs
  @Input() set messages(newMessages: Message[]) {
    const container = this.messageContainer?.nativeElement;
    
    // If we are loading HISTORY (adding to the top)
    if (this.chatStatus() === 'fetching-history' && container) {
        const prevHeight = container.scrollHeight;
        this._messages.set(newMessages);
        
        // After the DOM updates, stay at the same relative position
        setTimeout(() => {
        container.scrollTop = container.scrollHeight - prevHeight;
        }, 0);
    } else {
        this._messages.set(newMessages);
    }
  }
  chatStatus = input.required<string>();
  allMessagesLoaded = input.required<boolean>();
  currentUserId = input.required<string | null>();
  chatPartnerAvatarUrl = input.required<string | null>();
  error = input<string | null>(null);

  // Outputs
  loadMore = output<void>();
  retry = output<void>();

  @ViewChild('messageContainer') messageContainer!: ElementRef;
  
  private historyObserver?: IntersectionObserver;
  private bottomObserver?: IntersectionObserver;
  
  showScrollToBottomBtn = signal(false);
  hasUnreadAtBottom = signal(false);

  @ViewChild('scrollAnchor') set scrollAnchor(content: ElementRef) {
    if (content) this.setupHistoryObserver(content.nativeElement);
  }

  @ViewChild('bottomAnchor') set bottomAnchor(content: ElementRef) {
    if (content) this.setupBottomObserver(content.nativeElement);
  }

  private setupHistoryObserver(element: HTMLElement) {
    this.historyObserver?.disconnect();
    this.historyObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && this.chatStatus() === 'idle' && !this.allMessagesLoaded()) {
        this.loadMore.emit();
      }
    }, { root: this.messageContainer.nativeElement, threshold: 0.1 });
    this.historyObserver.observe(element);
  }

  private setupBottomObserver(element: HTMLElement) {
    this.bottomObserver?.disconnect();
    this.bottomObserver = new IntersectionObserver(([entry]) => {
      this.showScrollToBottomBtn.set(!entry.isIntersecting);
      if (entry.isIntersecting) this.hasUnreadAtBottom.set(false);
    }, { root: this.messageContainer.nativeElement, threshold: 0.1 });
    this.bottomObserver.observe(element);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  ngOnDestroy() {
    this.historyObserver?.disconnect();
    this.bottomObserver?.disconnect();
  }

  isUserAtBottom(): boolean {
    return !this.showScrollToBottomBtn();
  }
}