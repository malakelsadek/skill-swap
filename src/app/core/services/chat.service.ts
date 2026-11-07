import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { KEYS } from '../config';
import { StorageService } from './storage.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CHAT_URL = 'https://api.together.xyz/v1/chat/completions';
// Check this name against together.ai's current model list; models get retired.
export const CHAT_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

// shortcut: fixed sample catalog, swap for CourseService.courses() once Member 2's service exists.
const CATALOG = [
  'Figma for Beginners (Design, $39)',
  'Intro to Marketing (Business, $49)',
  'Angular from Scratch (Programming, $69)',
];

const SYSTEM_PROMPT =
  'You are the SkillSwap assistant. Recommend courses only from this catalog and say so if none fits. ' +
  'Keep answers under 80 words.\nCatalog:\n' +
  CATALOG.map((c) => '- ' + c).join('\n');

/** An error whose message is safe to show to the user. */
class ChatError extends Error {}

/**
 * AI chat via together.ai. The key comes from src/environments/environment.ts.
 * shortcut: a frontend-only app cannot hide the key (it ships in the bundle), so it must be a revocable
 * low-limit key; a backend proxy replaces this in Milestone 2.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private storage = inject(StorageService);

  readonly messages = signal<ChatMessage[]>(this.storage.session.get<ChatMessage[]>(KEYS.chat) ?? []);
  apiKey = environment.togetherApiKey;
  readonly loading = signal(false);
  readonly error = signal('');

  clear(): void {
    this.messages.set([]);
    this.storage.session.remove(KEYS.chat);
    this.error.set('');
  }

  private push(message: ChatMessage): void {
    this.messages.update((list) => [...list, message]);
    this.storage.session.set(KEYS.chat, this.messages());
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.loading()) return;
    this.error.set('');
    if (!this.apiKey) {
      this.error.set('Chat is not set up: add a together.ai key to src/environments/environment.ts');
      return;
    }
    this.push({ role: 'user', content });
    this.loading.set(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: CHAT_MODEL,
          max_tokens: 300,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...this.messages().slice(-10)],
        }),
      });
      if (res.status === 401) throw new ChatError('Invalid API key');
      if (!res.ok) throw new ChatError(`Assistant error (${res.status})`);
      const reply = (await res.json()).choices?.[0]?.message?.content;
      if (!reply) throw new ChatError('The assistant sent an empty reply');
      this.push({ role: 'assistant', content: String(reply).trim() });
    } catch (e) {
      this.error.set(e instanceof ChatError ? e.message : 'Assistant unavailable right now');
    } finally {
      this.loading.set(false);
    }
  }
}
