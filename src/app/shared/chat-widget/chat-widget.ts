import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  // Hidden until a key is set in src/environments/environment.ts, so the app looks normal without one.
  template: `
    @if (chat.apiKey) {
    @if (open()) {
      <section class="panel" aria-label="SkillSwap assistant">
        <header>
          <strong>SkillSwap assistant</strong>
          <span>
            <button type="button" (click)="chat.clear()" aria-label="Clear chat">Clear</button>
            <button type="button" (click)="open.set(false)" aria-label="Close chat">&times;</button>
          </span>
        </header>

        <div class="log" #log>
          @if (!chat.messages().length) {
            <p class="hint">Hi! Tell me what you want to learn and I'll suggest a course.</p>
          }
          @for (m of chat.messages(); track $index) {
            <p class="msg" [class.user]="m.role === 'user'">{{ m.content }}</p>
          }
          @if (chat.loading()) { <p class="msg">Thinking...</p> }
        </div>

        @if (chat.error()) { <p class="error" role="alert">{{ chat.error() }}</p> }

        <form (submit)="send($event, textInput)">
          <input #textInput placeholder="Ask about courses..." aria-label="Your message" />
          <button class="btn" type="submit" [disabled]="chat.loading()">Send</button>
        </form>
      </section>
    } @else {
      <button class="fab" type="button" (click)="open.set(true)" aria-label="Open chat">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <circle cx="8" cy="10" r="1.4" fill="var(--accent)" />
          <circle cx="12" cy="10" r="1.4" fill="var(--accent)" />
          <circle cx="16" cy="10" r="1.4" fill="var(--accent)" />
        </svg>
      </button>
    }
    }
  `,
  styles: `
    :host { position: fixed; right: 1rem; bottom: 1rem; z-index: 20; }
    .fab { display: grid; place-items: center; width: 3.6rem; height: 3.6rem; padding: 0; border: none; border-radius: 50%; background: var(--accent); color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
    .panel { display: flex; flex-direction: column; width: 22rem; height: 28rem; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow: hidden; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: var(--primary); color: #fff; }
    header button { background: none; border: none; color: #fff; font: inherit; cursor: pointer; padding: 0 0.4rem; }
    .log { flex: 1; overflow-y: auto; padding: 0.6rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .msg { margin: 0; padding: 0.4rem 0.7rem; border-radius: 10px; background: #eef2fa; align-self: flex-start; max-width: 85%; white-space: pre-wrap; }
    .msg.user { background: var(--primary); color: #fff; align-self: flex-end; }
    .hint { color: var(--muted); margin: 0; }
    .error { margin: 0 0.6rem; }
    form { display: flex; gap: 0.4rem; padding: 0.6rem; border-top: 1px solid var(--border); }
    /* Phones: full-screen panel */
    @media (max-width: 599px) {
      :host:has(.panel) { inset: 0; right: 0; bottom: 0; }
      .panel { width: 100%; height: 100%; border-radius: 0; }
    }
  `,
})
export class ChatWidget {
  chat = inject(ChatService);
  open = signal(false);
  private log = viewChild<ElementRef<HTMLElement>>('log');

  constructor() {
    effect(() => {
      this.chat.messages();
      this.chat.loading();
      const el = this.log()?.nativeElement;
      if (el) setTimeout(() => (el.scrollTop = el.scrollHeight)); // keep the newest message in view
    });
  }

  send(event: Event, input: HTMLInputElement) {
    event.preventDefault();
    const text = input.value;
    input.value = '';
    void this.chat.send(text);
  }
}
