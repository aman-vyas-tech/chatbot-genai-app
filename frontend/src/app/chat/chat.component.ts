import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Message } from './chat.model';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .container { max-width: 900px; margin: 2rem auto; padding: 1rem; }
    .chat-box { border: 1px solid #e2e2e2; border-radius: 12px; padding: 1rem; height: 70vh; overflow: auto; background: #fff; }
    .msg { margin: 0.5rem 0; padding: 0.75rem 1rem; border-radius: 10px; line-height: 1.5; white-space: pre-wrap; }
    .user { background: #e8f0fe; align-self: flex-end; }
    .assistant { background: #f5f5f5; }
    .system { background: #fff3cd; }
    .row { display: flex; gap: 0.75rem; }
    .composer { margin-top: 1rem; }
    textarea { flex: 1; min-height: 64px; resize: vertical; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
    button { padding: 0.75rem 1.25rem; border-radius: 8px; border: none; background: #1769aa; color: white; cursor: pointer; }
    button[disabled] { opacity: 0.6; cursor: not-allowed; }
    .usage { font-size: 12px; color: #666; margin-left: 0.5rem; }
  `],
  template: `
    <div class="container">
      <h2>Chatbot (OpenAI)</h2>
      <div class="chat-box" #scrollRef>
        <div style="display:flex; flex-direction:column;">
          <div *ngFor="let m of visibleMessages()" class="msg" [ngClass]="m.role">
            <strong>{{ m.role === 'user' ? 'You' : (m.role === 'assistant' ? 'Assistant' : 'System') }}:</strong>
            <div>{{ m.content }}</div>
          </div>
          <div *ngIf="isThinking()" class="msg assistant"><em>Thinking…</em></div>
        </div>
      </div>

      <div class="composer">
        <div class="row">
          <textarea [(ngModel)]="draft" (keydown.enter)="onEnter($event)" placeholder="Type a message..."></textarea>
          <button (click)="send()" [disabled]="isThinking() || !draft.trim()">Send</button>
        </div>
        <div class="row" style="margin-top:0.5rem; align-items:center;">
          <label><input type="checkbox" [(ngModel)]="useStreaming"> Stream</label>
          <span class="usage" *ngIf="tokenInfo()">
            Tokens: {{ tokenInfo()?.prompt }} prompt / {{ tokenInfo()?.completion }} completion / {{ tokenInfo()?.total }} total
          </span>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent {
  private systemPrompt = 'You are a helpful assistant.';
  messages = signal<Message[]>([{ role: 'system', content: this.systemPrompt }]);
  draft = '';
  useStreaming = true;

  isThinking = signal(false);
  tokenInfo = signal<{ prompt?: number; completion?: number; total?: number } | null>(null);

  visibleMessages = computed(() => this.messages().filter(m => m.role !== 'system'));

  constructor(private chat: ChatService) {
    // Auto-scroll effect if desired; placeholder hook
    effect(() => {
      void this.messages();
    });
  }

  onEnter(e: Event) {
    const event = e as KeyboardEvent;
    if (event.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  send() {
    const content = this.draft.trim();
    if (!content || this.isThinking()) return;

    // push user message
    const next: Message[] = [...this.messages(), { role: 'user', content }];
    this.messages.set(next);
    this.draft = '';
    this.isThinking.set(true);
    this.tokenInfo.set(null);

    if (this.useStreaming) {
      // create placeholder assistant message
      const idx = this.messages().length;
      this.messages.update(arr => [...arr, { role: 'assistant', content: '' }]);

      this.chat.stream(next).subscribe({
        next: (delta) => {
          this.messages.update(arr => {
            const copy = [...arr];
            copy[idx] = { ...copy[idx], content: (copy[idx].content || '') + delta };
            return copy;
          });
        },
        error: () => this.isThinking.set(false),
        complete: () => this.isThinking.set(false)
      });
    } else {
      this.chat.send(next).subscribe({
        next: (res) => {
          this.messages.update(arr => [...arr, { role: 'assistant', content: res.content }]);
          this.tokenInfo.set({
            prompt: res.usage?.prompt_tokens,
            completion: res.usage?.completion_tokens,
            total: res.usage?.total_tokens
          });
        },
        error: () => {},
        complete: () => this.isThinking.set(false)
      });
    }
  }
}