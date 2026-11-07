import { Injectable, inject, signal } from '@angular/core';
import { KEYS } from '../config';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

export type SoundName = 'click' | 'success' | 'error' | 'cart';

// [frequency in Hz, duration in seconds]. Tones are generated, so no audio files or licences are needed.
const TONES: Record<SoundName, [number, number][]> = {
  click: [[600, 0.05]],
  success: [[660, 0.1], [880, 0.18]],
  error: [[220, 0.12], [160, 0.2]],
  cart: [[500, 0.06], [750, 0.09]],
};

/**
 * Short feedback sounds. Usage anywhere: inject(SoundService).play('success').
 * Silent when the navbar mute button is on, or the user turned sound off in their profile.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private storage = inject(StorageService);
  private auth = inject(AuthService);
  private ctx?: AudioContext;

  /** Mute choice survives refreshes (localStorage). */
  readonly muted = signal(this.storage.local.get<boolean>(KEYS.sound) === false);

  toggle(): void {
    this.muted.update((m) => !m);
    this.storage.local.set(KEYS.sound, !this.muted());
  }

  play(name: SoundName): void {
    if (this.muted() || this.auth.currentUser()?.preferences.sound === false) return;
    try {
      const ctx = (this.ctx ??= new AudioContext());
      if (ctx.state === 'suspended') void ctx.resume(); // browsers start audio paused until a user click
      let start = ctx.currentTime;
      for (const [freq, length] of TONES[name]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + length);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + length);
        start += length;
      }
    } catch {
      // audio not available (old browser, tests): feedback sound is optional, so ignore
    }
  }
}
