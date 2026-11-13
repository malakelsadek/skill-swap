import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { SeedService } from './seed.service';

const reply = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('ChatService', () => {
  let fetchMock: jasmine.Spy;
  let chat: ChatService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.inject(SeedService).init();
    fetchMock = spyOn(window, 'fetch');
    chat = TestBed.inject(ChatService);
  });

  it('does not call the network when no key is configured', async () => {
    chat.apiKey = '';
    await chat.send('hello');
    expect(chat.error()).toBe('Assistant unavailable right now');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores empty messages', async () => {
    chat.apiKey = 'k';
    await chat.send('   ');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the catalog prompt with the key and stores the reply in sessionStorage', async () => {
    chat.apiKey = 'secret-key';
    fetchMock.and.returnValue(reply({ choices: [{ message: { content: ' Try **Angular** from Scratch. ' } }] })); // markdown bold is stripped
    await chat.send('I want to code');

    const [url, init] = fetchMock.calls.argsFor(0);
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(init.headers.Authorization).toBe('Bearer secret-key');
    const body = JSON.parse(init.body);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('Catalog');
    expect(body.messages[0].content).toContain('UI Design Fundamentals'); // a real seeded course
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'I want to code' });

    expect(chat.messages().map((m) => m.content)).toEqual(['I want to code', 'Try Angular from Scratch.']);
    expect(JSON.parse(sessionStorage.getItem('sw_chat')!).length).toBe(2);
  });

  it('reports an invalid key', async () => {
    chat.apiKey = 'bad';
    fetchMock.and.returnValue(reply({}, 401));
    await chat.send('hi');
    expect(chat.error()).toBe('Invalid API key');
  });

  it('shows a friendly message when the network fails, and recovers', async () => {
    chat.apiKey = 'k';
    fetchMock.and.rejectWith(new TypeError('Failed to fetch'));
    await chat.send('hi');
    expect(chat.error()).toBe('Assistant unavailable right now');
    expect(chat.loading()).toBe(false);
  });

  it('clear() empties the history', async () => {
    chat.apiKey = 'k';
    fetchMock.and.returnValue(reply({ choices: [{ message: { content: 'ok' } }] }));
    await chat.send('hi');
    chat.clear();
    expect(chat.messages()).toEqual([]);
    expect(sessionStorage.getItem('sw_chat')).toBeNull();
  });
});
