// AI Teacher voice session: Start / Stop, end-of-turn detection, one request
// per spoken turn, microphone gated while speaking, and late events ignored
// after Stop. Uses fake speech drivers (no browser or microphone).
import { VoiceSession, END_OF_TURN_MS, type VoiceDrivers, type Recognizer } from '../voice/VoiceSession';
import type { TurnResponse } from '../services/aiTeacherApi';

type FakeRec = Recognizer & { lang: string; start: jest.Mock; abort: jest.Mock };
type Spoken = { text: string; lang: string; h: { onStart(): void; onBoundary(): void; onEnd(): void } };

function setup(opts: { supported?: boolean; mic?: { granted: boolean; reason?: any } } = {}) {
  const recs: FakeRec[] = [];
  const spoken: Spoken[] = [];
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  const drivers: VoiceDrivers & { cancelSpeech: jest.Mock; requestMic: jest.Mock } = {
    supported: () => opts.supported ?? true,
    requestMic: jest.fn(async () => opts.mic ?? { granted: true }),
    createRecognizer: (lang) => {
      const r = { onresult: null, onend: null, onerror: null, start: jest.fn(), abort: jest.fn(), lang } as unknown as FakeRec;
      recs.push(r);
      return r;
    },
    speak: (text, lang, h) => { spoken.push({ text, lang, h }); },
    cancelSpeech: jest.fn(),
    setTimer: (fn, _ms) => { nextTimer += 1; timers.set(nextTimer, fn); return nextTimer; },
    clearTimer: (id) => { timers.delete(id); },
  };
  let resolveTurn: (r: TurnResponse) => void = () => {};
  const cb = {
    turn: jest.fn((_t: string, _s: AbortSignal) => new Promise<TurnResponse>((res) => { resolveTurn = res; })),
    greeting: () => 'Good morning, Asha! I’m Aarav, your AI Teacher.',
    language: () => 'en' as const,
    onStatus: jest.fn(),
    onCaption: jest.fn(),
    onResponse: jest.fn((_r: TurnResponse): string | void => ''),
    onSegmentStart: jest.fn(),
    onBoundary: jest.fn(),
    onNarrationDone: jest.fn(),
    onError: jest.fn(),
  };
  const session = new VoiceSession(drivers, cb);
  const lastStatus = () => cb.onStatus.mock.calls.at(-1)?.[0];
  const fireTimers = () => { const fns = [...timers.values()]; timers.clear(); fns.forEach((f) => f()); };
  return { session, drivers, cb, recs, spoken, lastStatus, fireTimers, reply: (r: TurnResponse) => resolveTurn(r) };
}

const flush = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };

const lesson = (over: Partial<TurnResponse> = {}): TurnResponse => ({
  kind: 'lesson', language: 'en', board: 'replace', topic: null, practice: null, feedback: null, state: {},
  blocks: [{ id: 'b1', type: 'text', text: 'LCM is the least common multiple.' }],
  segments: [
    { id: 's1', caption: 'LCM means least common multiple.', speech: 'LCM means least common multiple.', reveal: ['b1'] },
    { id: 's2', caption: 'Let us try one.', speech: 'Let us try one.', reveal: [] },
  ],
  ...over,
});

/** Start, finish the greeting, and return the listening recognizer. */
async function startListening(t: ReturnType<typeof setup>) {
  t.session.start();
  await flush();
  t.spoken.at(-1)!.h.onStart();
  t.spoken.at(-1)!.h.onEnd();
  await flush();
  return t.recs.at(-1)!;
}

async function say(t: ReturnType<typeof setup>, rec: FakeRec, text: string) {
  rec.onresult!(text, true);
  t.fireTimers(); // the end-of-turn pause
  await flush();
}

test('first Start asks for the microphone, speaks the greeting, then listens; the mic is off while speaking', async () => {
  const t = setup();
  t.session.start();
  await flush();
  expect(t.drivers.requestMic).toHaveBeenCalledTimes(1);
  expect(t.spoken).toHaveLength(1);
  expect(t.spoken[0].text).toMatch(/^Good morning, Asha!/);
  t.spoken[0].h.onStart();
  expect(t.lastStatus()).toBe('speaking');
  expect(t.cb.onCaption).toHaveBeenLastCalledWith(expect.stringMatching(/^Good morning/));
  expect(t.recs).toHaveLength(0); // no recognition during speech
  t.spoken[0].h.onEnd();
  await flush();
  expect(t.recs).toHaveLength(1);
  expect(t.recs[0].start).toHaveBeenCalled();
  expect(t.lastStatus()).toBe('listening');
  expect(t.session.isActive).toBe(true);
});

test('the greeting is spoken only on the first Start of the visit', async () => {
  const t = setup();
  await startListening(t);
  t.session.stop();
  t.session.start();
  await flush();
  expect(t.spoken).toHaveLength(1); // no second greeting
  expect(t.recs).toHaveLength(2); // straight back to listening, with a fresh recognizer
  expect(t.lastStatus()).toBe('listening');
});

test('a finished spoken turn is sent once, after the end-of-turn pause', async () => {
  expect(END_OF_TURN_MS).toBeGreaterThan(500);
  const t = setup();
  const rec = await startListening(t);
  rec.onresult!('explain', false);
  rec.onresult!('explain LCM', true);
  expect(t.cb.turn).not.toHaveBeenCalled(); // still waiting for the pause
  t.fireTimers();
  await flush();
  expect(t.cb.turn).toHaveBeenCalledTimes(1);
  expect(t.cb.turn.mock.calls[0][0]).toBe('explain LCM');
  expect(t.lastStatus()).toBe('thinking');
  expect(rec.abort).toHaveBeenCalled(); // mic off while thinking
  rec.onend!(); // the recognizer's own end event must not resend
  rec.onresult!('explain LCM again', true);
  t.fireTimers();
  await flush();
  expect(t.cb.turn).toHaveBeenCalledTimes(1);
});

test('the reply is spoken segment by segment, revealing the board as each starts, then listening resumes', async () => {
  const t = setup();
  const rec = await startListening(t);
  await say(t, rec, 'explain LCM');
  t.cb.onSegmentStart.mockClear(); // the greeting was a segment too
  t.cb.onResponse.mockReturnValueOnce('Say your answer when you’re ready.');
  t.reply(lesson());
  await flush();
  expect(t.cb.onResponse).toHaveBeenCalledTimes(1);
  expect(t.spoken).toHaveLength(2);
  expect(t.cb.onSegmentStart).not.toHaveBeenCalled(); // nothing revealed before the audio starts
  t.spoken[1].h.onStart();
  expect(t.cb.onSegmentStart).toHaveBeenCalledWith(expect.objectContaining({ id: 's1', reveal: ['b1'] }), expect.anything());
  t.spoken[1].h.onBoundary();
  expect(t.cb.onBoundary).toHaveBeenCalled();
  const recsBefore = t.recs.length;
  t.spoken[1].h.onEnd();
  await flush();
  expect(t.spoken).toHaveLength(3);
  expect(t.recs.length).toBe(recsBefore); // still speaking: no microphone
  t.spoken[2].h.onStart();
  t.spoken[2].h.onEnd();
  await flush();
  expect(t.cb.onNarrationDone).toHaveBeenCalledTimes(1);
  expect(t.recs.length).toBe(recsBefore + 1);
  expect(t.lastStatus()).toBe('listening');
  expect(t.cb.onCaption).toHaveBeenLastCalledWith('Say your answer when you’re ready.');
});

test('listening is continuous: silence restarts recognition without pressing Start', async () => {
  const t = setup();
  const rec = await startListening(t);
  rec.onerror!('no-speech');
  rec.onend!();
  expect(t.recs).toHaveLength(2);
  expect(t.recs[1].start).toHaveBeenCalled();
  expect(t.cb.turn).not.toHaveBeenCalled();
});

test('Stop while listening: mic off, idle, late transcripts ignored', async () => {
  const t = setup();
  const rec = await startListening(t);
  t.session.stop();
  expect(rec.abort).toHaveBeenCalled();
  expect(t.drivers.cancelSpeech).toHaveBeenCalled();
  expect(t.lastStatus()).toBe('idle');
  expect(t.session.isActive).toBe(false);
  rec.onresult!('explain LCM', true);
  rec.onend!();
  t.fireTimers();
  await flush();
  expect(t.cb.turn).not.toHaveBeenCalled();
  expect(t.recs).toHaveLength(1);
});

test('Stop while thinking: the request is aborted and a late reply is neither shown nor spoken', async () => {
  const t = setup();
  const rec = await startListening(t);
  await say(t, rec, 'explain LCM');
  const signal = t.cb.turn.mock.calls[0][1] as AbortSignal;
  t.session.stop();
  expect(signal.aborted).toBe(true);
  t.reply(lesson());
  await flush();
  expect(t.cb.onResponse).not.toHaveBeenCalled();
  expect(t.spoken).toHaveLength(1); // only the greeting
  expect(t.recs).toHaveLength(1);
});

test('Stop while speaking: speech cancelled, the queued narration and late playback events are ignored', async () => {
  const t = setup();
  const rec = await startListening(t);
  await say(t, rec, 'explain LCM');
  t.reply(lesson());
  await flush();
  t.spoken[1].h.onStart();
  t.session.stop();
  expect(t.drivers.cancelSpeech).toHaveBeenCalled();
  t.spoken[1].h.onBoundary();
  t.spoken[1].h.onEnd(); // the engine's late end event
  await flush();
  expect(t.spoken).toHaveLength(2); // the second segment never starts
  expect(t.cb.onBoundary).not.toHaveBeenCalled();
  expect(t.cb.onNarrationDone).not.toHaveBeenCalled();
  expect(t.recs).toHaveLength(1); // the microphone did not come back on
  expect(t.lastStatus()).toBe('idle');
});

test('Start after Stop is a fresh session: old recognizers stay dead', async () => {
  const t = setup();
  const oldRec = await startListening(t);
  t.session.stop();
  t.session.start();
  await flush();
  const newRec = t.recs.at(-1)!;
  oldRec.onresult!('old words', true);
  t.fireTimers();
  await flush();
  expect(t.cb.turn).not.toHaveBeenCalled();
  await say(t, newRec, 'give me a question');
  expect(t.cb.turn).toHaveBeenCalledTimes(1);
  expect(t.cb.turn.mock.calls[0][0]).toBe('give me a question');
});

test('microphone denied: a clear message, back to idle, nothing spoken', async () => {
  const t = setup({ mic: { granted: false, reason: 'denied' } });
  t.session.start();
  await flush();
  expect(t.cb.onError).toHaveBeenCalledWith(expect.stringMatching(/Microphone access is blocked/));
  expect(t.lastStatus()).toBe('idle');
  expect(t.session.isActive).toBe(false);
  expect(t.spoken).toHaveLength(0);
});

test('no microphone and unsupported browsers get their own messages', async () => {
  const noMic = setup({ mic: { granted: false, reason: 'no-microphone' } });
  noMic.session.start();
  await flush();
  expect(noMic.cb.onError).toHaveBeenCalledWith(expect.stringMatching(/can't find a microphone/));
  const unsupported = setup({ supported: false });
  unsupported.session.start();
  await flush();
  expect(unsupported.cb.onError).toHaveBeenCalledWith(expect.stringMatching(/Chrome or Edge/));
  expect(unsupported.drivers.requestMic).not.toHaveBeenCalled();
});

test('a permission error from recognition stops the session', async () => {
  const t = setup();
  const rec = await startListening(t);
  rec.onerror!('not-allowed');
  expect(t.session.isActive).toBe(false);
  expect(t.lastStatus()).toBe('idle');
  expect(t.cb.onError).toHaveBeenCalledWith(expect.stringMatching(/Microphone access is blocked/));
});

test('a failed request is spoken as a short apology and listening resumes', async () => {
  const t = setup();
  const rec = await startListening(t);
  t.cb.turn.mockImplementationOnce(() => Promise.reject(new Error('network')));
  await say(t, rec, 'explain LCM');
  await flush();
  expect(t.spoken.at(-1)!.text).toMatch(/couldn't answer/);
  t.spoken.at(-1)!.h.onEnd();
  await flush();
  expect(t.lastStatus()).toBe('listening');
});

test('"repeat" replays the previous narration and keeps the waiting hint', async () => {
  const t = setup();
  let rec = await startListening(t);
  await say(t, rec, 'explain LCM');
  t.cb.onResponse.mockReturnValueOnce('Say your answer when you’re ready.');
  t.reply(lesson());
  await flush();
  t.spoken[1].h.onEnd(); await flush();
  t.spoken[2].h.onEnd(); await flush();
  rec = t.recs.at(-1)!;
  await say(t, rec, 'say that again');
  t.reply(lesson({ kind: 'repeat', board: 'keep', segments: [], blocks: [] }));
  await flush();
  expect(t.spoken[3].text).toBe('LCM means least common multiple.');
  t.spoken[3].h.onEnd(); await flush();
  t.spoken[4].h.onEnd(); await flush();
  expect(t.cb.onCaption).toHaveBeenLastCalledWith('Say your answer when you’re ready.');
});
