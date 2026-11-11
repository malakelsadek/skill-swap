import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CourseService } from '../../features/courses/course.service';
import { KEYS } from '../config';
import { StorageService } from './storage.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Google Gemini's OpenAI-compatible endpoint (free tier). Any OpenAI-style provider works by changing these two lines.
export const CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
// Check this name on Google AI Studio's model list; models get renamed and retired.
export const CHAT_MODEL = 'gemini-3.5-flash-lite';

const PROMPT_INTRO =
  'You are the SkillSwap assistant. Recommend courses only from this catalog and say so if none fits. ' +
  'Keep answers under 80 words.\nCatalog:\n';

/** An error whose message is safe to show to the user. */
class ChatError extends Error {}

/**
 * AI chat through an OpenAI-compatible API. The key comes from src/environments/environment.ts.
 * shortcut: a frontend-only app cannot hide the key (it ships in the bundle), so it must be a revocable
 * low-limit key; a backend proxy replaces this in Milestone 2.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private storage = inject(StorageService);
  private courses = inject(CourseService);

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

  /** The live course list, one line per course. */
  private catalog(): string {
    return this.courses
      .courses()
      .map((c) => `- ${c.title} (${c.category}, $${c.price})`)
      .join('\n');
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.loading()) return;
    this.error.set('');
    if (!this.apiKey) {
      this.error.set('Assistant unavailable right now');
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
          messages: [{ role: 'system', content: PROMPT_INTRO + this.catalog() }, ...this.messages().slice(-10)],
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
