import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SeedService } from './seed.service';
import { SoundService } from './sound.service';

describe('SoundService', () => {
  const win = window as unknown as { AudioContext: unknown };
  const realAudioContext = win.AudioContext;
  let oscillators: number;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    oscillators = 0;
    // Minimal AudioContext stand-in that counts the tones played.
    win.AudioContext = class {
      state = 'running';
      currentTime = 0;
      destination = {};
      createGain() {
        const node = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => node };
        return node;
      }
      createOscillator() {
        oscillators++;
        return { frequency: {}, connect: (n: unknown) => n, start() {}, stop() {} };
      }
    };
    TestBed.inject(SeedService).init();
  });

  afterEach(() => (win.AudioContext = realAudioContext));

  it('plays one tone per note', () => {
    const sound = TestBed.inject(SoundService);
    sound.play('click'); // 1 note
    sound.play('success'); // 2 notes
    expect(oscillators).toBe(3);
  });

  it('is silent when muted, and the mute choice survives a reload', () => {
    const sound = TestBed.inject(SoundService);
    sound.toggle();
    sound.play('click');
    expect(oscillators).toBe(0);

    TestBed.resetTestingModule();
    expect(TestBed.inject(SoundService).muted()).toBe(true);
  });

  it('is silent when the user turned sound off in their profile', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('student1', 'Pass1234');
    auth.updateProfile({ preferences: { ...auth.currentUser()!.preferences, sound: false } });
    TestBed.inject(SoundService).play('click');
    expect(oscillators).toBe(0);
  });

  it('does not throw when audio is unavailable', () => {
    win.AudioContext = undefined;
    expect(() => TestBed.inject(SoundService).play('error')).not.toThrow();
  });
});
