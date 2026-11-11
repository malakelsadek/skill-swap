import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';

/** Little bot face inside a speech bubble. Colours come from --bot-face / --bot-eyes. */
@Component({
  selector: 'app-bot-icon',
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <line x1="16" y1="3.5" x2="16" y2="8" stroke="var(--bot-face, #fff)" stroke-width="2" stroke-linecap="round" />
      <circle cx="16" cy="3.5" r="2" fill="var(--bot-face, #fff)" />
      <rect x="4" y="8" width="24" height="18" rx="8" fill="var(--bot-face, #fff)" />
      <path d="M9 24l-2.5 6.5L15 25z" fill="var(--bot-face, #fff)" />
      <circle cx="12" cy="16" r="2.4" fill="var(--bot-eyes, #ff7a00)" />
      <circle cx="20" cy="16" r="2.4" fill="var(--bot-eyes, #ff7a00)" />
      <path d="M12 21c2.5 2 5.5 2 8 0" fill="none" stroke="var(--bot-eyes, #ff7a00)" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  `,
  styles: `:host { display: inline-flex; width: 100%; height: 100%; } svg { width: 100%; height: 100%; }`,
})
export class BotIcon {}

@Component({
  selector: 'app-chat-widget',
  imports: [BotIcon],
  template: `
    @if (open()) {
      <section class="panel" aria-label="SkillSwap assistant">
        <header>
          <span class="avatar big"><app-bot-icon /></span>
          <div class="title">
            <strong>SkillSwap Assistant</strong>
            <small>Ask me about courses</small>
          </div>
          <button type="button" class="text-btn" (click)="chat.clear()" aria-label="Clear chat">Clear</button>
          <button type="button" class="text-btn" (click)="open.set(false)" aria-label="Close chat">&times;</button>
        </header>

        <div class="log" #log>
          <div class="row bot">
            <span class="avatar"><app-bot-icon /></span>
            <p class="msg bot">Hi! Tell me what you want to learn and I'll suggest a course.</p>
          </div>
          @for (m of chat.messages(); track $index) {
            <div class="row" [class.user]="m.role === 'user'" [class.bot]="m.role === 'assistant'">
              @if (m.role === 'assistant') { <span class="avatar"><app-bot-icon /></span> }
              <p class="msg" [class.user]="m.role === 'user'" [class.bot]="m.role === 'assistant'">{{ m.content }}</p>
            </div>
          }
          @if (chat.loading()) {
            <div class="row bot">
              <span class="avatar"><app-bot-icon /></span>
              <p class="msg bot typing" role="status" aria-label="The assistant is typing"><i></i><i></i><i></i></p>
            </div>
          }
        </div>

        @if (chat.error()) { <p class="error" role="alert">{{ chat.error() }}</p> }

        <form (submit)="send($event, textInput)">
          <input #textInput placeholder="Message..." aria-label="Your message" autocomplete="off" />
          <button class="send" type="submit" [disabled]="chat.loading()" aria-label="Send">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </form>
      </section>
    } @else {
      <button class="fab" type="button" (click)="open.set(true)" aria-label="Open chat">
        <app-bot-icon />
      </button>
    }
  `,
  styles: `
    :host { position: fixed; right: 1rem; bottom: 1rem; z-index: 20; }
    .fab { width: 3.8rem; height: 3.8rem; padding: 0.7rem; border: none; border-radius: 50%; background: var(--accent); cursor: pointer; box-shadow: 0 4px 14px rgba(255, 122, 0, 0.5); }
    .fab:hover { background: var(--accent-dark); }

    .panel { display: flex; flex-direction: column; width: 22rem; height: 30rem; background: #fff; border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 12px 32px rgba(10, 42, 99, 0.3); overflow: hidden; }
    header { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem; background: var(--primary); color: #fff; }
    .title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
    .title small { color: #c9d8f5; }
    .text-btn { background: none; border: none; color: #fff; font: inherit; cursor: pointer; padding: 0 0.3rem; opacity: 0.85; }
    .text-btn:hover { opacity: 1; }

    .avatar { flex: none; display: inline-grid; place-items: center; width: 1.9rem; height: 1.9rem; padding: 0.3rem; border-radius: 50%; background: var(--tint); --bot-face: var(--primary); --bot-eyes: #fff; }
    .avatar.big { width: 2.4rem; height: 2.4rem; background: #fff; }

    .log { flex: 1; overflow-y: auto; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem; background: #fbfcff; }
    .row { display: flex; align-items: flex-end; gap: 0.4rem; animation: pop 0.2s ease-out; }
    .row.user { justify-content: flex-end; }
    .msg { margin: 0; padding: 0.5rem 0.9rem; max-width: 78%; border-radius: 18px; white-space: pre-wrap; overflow-wrap: anywhere; }
    .msg.bot { background: #e8edf7; color: var(--text); border-bottom-left-radius: 5px; }
    .msg.user { background: var(--blue); color: #fff; border-bottom-right-radius: 5px; }

    .typing { display: inline-flex; gap: 4px; align-items: center; padding: 0.75rem 0.9rem; }
    .typing i { width: 8px; height: 8px; border-radius: 50%; background: #8a98b8; animation: bounce 1.2s infinite ease-in-out; }
    .typing i:nth-child(2) { animation-delay: 0.15s; }
    .typing i:nth-child(3) { animation-delay: 0.3s; }

    .error { margin: 0; padding: 0.3rem 0.9rem; background: #fff3f1; }
    form { display: flex; gap: 0.5rem; padding: 0.6rem; border-top: 1px solid var(--border); background: #fff; }
    form input { flex: 1; border-radius: 999px; padding: 0.55rem 1rem; }
    .send { flex: none; width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border: none; border-radius: 50%; background: var(--blue); color: #fff; cursor: pointer; }
    .send:disabled { opacity: 0.45; cursor: not-allowed; }

    @keyframes pop { from { opacity: 0; transform: translateY(6px) scale(0.96); } }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }

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
