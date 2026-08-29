import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { personalInfo } from '../data/personalInfo.js';
import { aiSystemPrompt } from '../data/aiSystemPrompt.js';
import { WORKER_ENDPOINT } from '../data/aiConfig.js';
import {
  TYPING_DURATIONS,
  TYPING_CATEGORIES,
  buildTypingPrompt,
  getRandomFallbackText,
} from '../data/typingTest.js';

const FIRST_NAME = personalInfo.name.split(' ')[0].toLowerCase();
const PROMPT_LABEL = `visitor@${FIRST_NAME}-portfolio:~$`;

const BOOT_LINES = [
  `Last login: ${new Date().toDateString()} on ttys000`,
  `Welcome to ${personalInfo.name}'s portfolio shell.`,
  `Type a question about his skills, projects, or background and press Enter.`,
];

// Matches http(s) and mailto/tel-style URLs so AI answers that mention
// a link render as an actual clickable <a>, not plain text.
const URL_PATTERN = /(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)/g;

// Matches [color]...[/color] tags the AI uses to highlight words,
// terminal-style. Keep this list in sync with the colors named in the
// system prompt.
const COLOR_TAG_PATTERN = /\[(green|red|yellow|blue|cyan|magenta|white)\]([\s\S]*?)\[\/\1\]/g;

const TERMINAL_COLORS = {
  green: '#27c93f',
  red: '#ff5f56',
  yellow: '#ffbd2e',
  blue: '#61afef',
  cyan: '#56d4dd',
  magenta: '#c678dd',
  white: '#ffffff',
};

// Renders a plain (non-color-tagged) text segment, turning any raw
// URLs inside it into clickable links.
function renderLinksOnly(text, keyPrefix) {
  const parts = text.split(URL_PATTERN);
  return parts.map((part, i) => {
    if (part.match(URL_PATTERN)) {
      const trailingMatch = part.match(/[).,!?]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : '';
      const cleanUrl = trailing ? part.slice(0, -trailing.length) : part;
      return (
        <span key={`${keyPrefix}-${i}`}>
          <a
            href={cleanUrl}
            target={cleanUrl.startsWith('http') ? '_blank' : undefined}
            rel={cleanUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="underline break-all"
            style={{ color: 'inherit' }}
          >
            {cleanUrl}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

// Full renderer: splits out [color]...[/color] tags first (applying
// the terminal color to that span, defaulting to the default link
// blue for unmatched links), then runs link detection on every
// remaining plain segment, including inside color tags.
function renderWithLinks(text) {
  const segments = [];
  let lastIndex = 0;
  let match;

  COLOR_TAG_PATTERN.lastIndex = 0;
  while ((match = COLOR_TAG_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'plain', text: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'color', color: match[1], text: match[2] });
    lastIndex = COLOR_TAG_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'plain', text: text.slice(lastIndex) });
  }

  return segments.map((seg, i) => {
    if (seg.type === 'color') {
      return (
        <span key={i} style={{ color: TERMINAL_COLORS[seg.color] || undefined }}>
          {renderLinksOnly(seg.text, `c${i}`)}
        </span>
      );
    }
    return (
      <span key={i} className="[&_a]:text-[#61afef] [&_a]:hover:text-[#8fc4f5]">
        {renderLinksOnly(seg.text, `p${i}`)}
      </span>
    );
  });
}

// Turns our local message history into the "contents" array the
// Gemini generateContent endpoint expects, with the system prompt
// injected as the very first user/model exchange so the model stays
// in character without needing the newer systemInstruction-only flow.
function buildContents(history) {
  const seed = [
    { role: 'user', parts: [{ text: aiSystemPrompt }] },
    {
      role: 'model',
      parts: [{ text: 'Understood. Ready to answer visitor questions about the portfolio.' }],
    },
  ];

  const turns = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  return [...seed, ...turns];
}

async function askGemini(history) {
  // Calls our Cloudflare Worker, not Gemini directly. The Worker holds
  // the real API key server-side and forwards this to Gemini, so no
  // key of any kind ever reaches the browser or this bundle.
  const response = await fetch(WORKER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: buildContents(history),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || '';
    } catch {
      // ignore parse failure, fall back to status text below
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Response blocked (${blockReason})` : 'Empty response from model.');
  }

  return text.trim();
}

// Recognizes "typing" or "typing test" (case-insensitive, optional
// surrounding whitespace) as the command that opens the typing-test panel.
const TYPING_COMMAND_PATTERN = /^typing(\s+test)?$/i;

// Calls the same Cloudflare Worker as the Q&A assistant, but with a
// standalone one-shot prompt that has nothing to do with aiSystemPrompt —
// Gemini's only job here is to hand back the paragraph to type.
async function askGeminiTypingText(category, wordCount) {
  const response = await fetch(WORKER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildTypingPrompt(category, wordCount) }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!response.ok) throw new Error(`Request failed (${response.status})`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text.trim()) throw new Error('Empty response from model.');

  return text.trim();
}

function AiTerminal() {
  // Each entry: { type: 'boot' | 'command' | 'output' | 'error', text }
  const [lines, setLines] = useState(() => BOOT_LINES.map((text) => ({ type: 'boot', text })));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Typing-test mode. 'setup' = choosing duration/category, 'running' =
  // actively typing, 'done' = finished, showing final stats.
  const [typingMode, setTypingMode] = useState(null); // null | 'setup' | 'running' | 'done'

  // Auto-scroll to the latest line whenever the conversation changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, isLoading]);

  // Disabling the input while loading strips its focus (browsers do
  // this automatically for disabled elements). Restore focus once
  // loading finishes so the visitor can keep typing without re-clicking.
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const focusInput = () => inputRef.current?.focus();

  // Called when the typing-test panel's X (close) button is pressed, or
  // a finished test is dismissed. Drops back to the plain terminal.
  const closeTypingTest = (resultLine) => {
    setTypingMode(null);
    setLines((prev) => [
      ...prev,
      ...(resultLine ? [{ type: 'boot', text: resultLine }] : []),
      { type: 'boot', text: 'Typing test closed. Back to normal terminal.' },
    ]);
    // Wait a tick so the input isn't disabled/unmounted when we focus it.
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    // Intercept the "typing" / "typing test" command before it goes to
    // Gemini — it still echoes as a normal typed command line, then opens
    // the setup panel instead of asking the AI anything.
    if (TYPING_COMMAND_PATTERN.test(question)) {
      setLines((prev) => [...prev, { type: 'command', text: question }]);
      setInput('');
      setTypingMode('setup');
      return;
    }

    const nextHistory = [...history, { role: 'user', text: question }];
    setHistory(nextHistory);
    setLines((prev) => [...prev, { type: 'command', text: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await askGemini(nextHistory);
      setHistory((prev) => [...prev, { role: 'assistant', text: answer }]);
      setLines((prev) => [...prev, { type: 'output', text: answer }]);
    } catch (err) {
      setLines((prev) => [
        ...prev,
        { type: 'error', text: err.message || 'Something went wrong talking to the AI.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={focusInput}
      className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0f19] font-mono cursor-text"
    >
      {/* OS-style title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#111827] border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-white/50 truncate">
          zsh — {FIRST_NAME}-portfolio — 80x24
        </span>
      </div>

      {/* Terminal output + input, both inside one scrollable "screen" so
          it reads as a real terminal session rather than a chat log.
          Swapped out entirely for the typing-test panel while active. */}
      {typingMode ? (
        <TypingTestPanel mode={typingMode} setMode={setTypingMode} onClose={closeTypingTest} />
      ) : (
        <div
          ref={scrollRef}
          className="h-[26rem] md:h-[30rem] overflow-y-auto px-5 py-4 text-[13px] md:text-sm leading-relaxed space-y-2"
        >
          {lines.map((line, i) => {
            if (line.type === 'boot') {
              return (
                <p key={i} className="text-white/40">
                  {line.text}
                </p>
              );
            }
            if (line.type === 'command') {
              return (
                <p key={i} className="text-white">
                  <span className="text-[#27c93f]">{PROMPT_LABEL}</span> {line.text}
                </p>
              );
            }
            if (line.type === 'error') {
              return (
                <p key={i} className="text-red-400">
                  error: {line.text}
                </p>
              );
            }
            return (
              <p key={i} className="text-white/85 whitespace-pre-wrap">
                {renderWithLinks(line.text)}
              </p>
            );
          })}

          {isLoading && (
            <p className="flex items-center gap-2 text-white/40">
              <Loader2 size={14} className="animate-spin" />
              thinking…
            </p>
          )}

          {/* Live input line, styled as the next terminal prompt rather
              than a separate chat input box. */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <span className="text-[#27c93f] shrink-0">{PROMPT_LABEL}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={isLoading}
              className="flex-1 bg-transparent text-white outline-none placeholder-white/25 disabled:opacity-50"
              placeholder={isLoading ? '' : 'ask something… (try "typing")'}
            />
            {!isLoading && <span className="w-2 h-4 bg-white/70 animate-pulse" aria-hidden="true" />}
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Typing test panel
// ---------------------------------------------------------------------
//
// Self-contained sub-component covering all 3 typing-test phases:
//   'setup'   - pick duration + category, hit Start
//   'running' - live typing area with WPM/accuracy/time stats
//   'done'    - final results, with Retry / Close
//
// Mounted in place of the normal terminal screen, same height, with its
// own close (X) button in a small header bar so it visually still reads
// as "a terminal that's showing something else right now".

function TypingTestPanel({ mode, setMode, onClose }) {
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState(TYPING_CATEGORIES[0].id);
  const [genError, setGenError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);

  const typingInputRef = useRef(null);
  const timerRef = useRef(null);

  // Focus the hidden input whenever we enter the running phase, so
  // visitors can just start typing without clicking first.
  useEffect(() => {
    if (mode === 'running') {
      typingInputRef.current?.focus();
    }
  }, [mode]);

  // Countdown timer, driven off wall-clock time (not a naive decrement)
  // so it stays accurate even if the tab is briefly backgrounded.
  useEffect(() => {
    if (mode !== 'running' || finished || !startedAt) return;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setFinished(true);
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [mode, finished, startedAt, duration]);

  useEffect(() => {
    if (finished) clearInterval(timerRef.current);
  }, [finished]);

  const handleStart = async () => {
    setIsGenerating(true);
    setGenError('');
    setUsedFallback(false);

    // Rough word budget from duration: enough text that a fast typist
    // won't run out before time's up, without asking Gemini for an
    // excessive wall of text on long durations.
    const wordCount = Math.max(20, Math.round(duration * 1.4));

    let generated = '';
    try {
      generated = await askGeminiTypingText(category, wordCount);
    } catch {
      generated = getRandomFallbackText();
      setUsedFallback(true);
    }

    setText(generated.replace(/\s+/g, ' ').trim());
    setTyped('');
    setFinished(false);
    setTimeLeft(duration);
    setIsGenerating(false);
    setMode('running');
    setStartedAt(Date.now());
  };

  const handleTypedChange = (e) => {
    if (finished) return;
    const value = e.target.value;
    if (value.length > text.length) return; // don't let typing run past the text
    setTyped(value);
    if (value.length >= text.length && text.length > 0) {
      setFinished(true);
    }
  };

  // --- Live stats, derived on every render from `typed` vs `text` ---
  const elapsedSeconds = startedAt ? Math.min(duration, (Date.now() - startedAt) / 1000) : 0;
  const effectiveElapsed = finished
    ? Math.max(0.1, duration - timeLeft)
    : Math.max(0.1, elapsedSeconds);

  let correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correctChars++;
  }
  const errorChars = typed.length - correctChars;
  const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;
  const wpm = Math.round((correctChars / 5) / (effectiveElapsed / 60));

  const handleClose = () => {
    clearInterval(timerRef.current);
    if (mode === 'running' && typed.length > 0) {
      onClose(
        `Typing test ended early — ${wpm} WPM, ${accuracy}% accuracy, ${typed.length}/${text.length} chars.`
      );
    } else {
      onClose();
    }
  };

  const handleRetry = () => {
    setMode('setup');
    setText('');
    setTyped('');
    setFinished(false);
    setStartedAt(null);
  };

  return (
    <div className="h-[26rem] md:h-[30rem] flex flex-col">
      {/* Sub-header identifying the mode + close button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0e1420] border-b border-white/10 shrink-0">
        <span className="text-xs text-white/50 tracking-wide">
          typing-test{mode === 'running' && !finished ? ' — running' : ''}
          {finished ? ' — results' : ''}
        </span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close typing test"
          className="text-white/40 hover:text-white/90 hover:bg-white/10 rounded p-1 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 text-[13px] md:text-sm">
        {mode === 'setup' && (
          <div className="space-y-5 max-w-md">
            <p className="text-white/60">
              Every test is about Antor — pick an angle, and Gemini writes a fresh take on it
              each time.
            </p>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wide">Duration</p>
              <div className="flex flex-wrap gap-2">
                {TYPING_DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                      duration === d
                        ? 'border-[#27c93f] text-[#27c93f] bg-[#27c93f]/10'
                        : 'border-white/15 text-white/60 hover:border-white/30 hover:text-white/80'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wide">Text type</p>
              <div className="flex flex-wrap gap-2">
                {TYPING_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                      category === c.id
                        ? 'border-[#61afef] text-[#61afef] bg-[#61afef]/10'
                        : 'border-white/15 text-white/60 hover:border-white/30 hover:text-white/80'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {genError && <p className="text-red-400 text-xs">{genError}</p>}

            <button
              type="button"
              onClick={handleStart}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#27c93f]/15 border border-[#27c93f]/40 text-[#27c93f] text-sm hover:bg-[#27c93f]/25 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  generating text…
                </>
              ) : (
                'Start test'
              )}
            </button>
          </div>
        )}

        {mode === 'running' && !finished && (
          <RunningView
            text={text}
            typed={typed}
            onTypedChange={handleTypedChange}
            typingInputRef={typingInputRef}
            timeLeft={timeLeft}
            wpm={wpm}
            accuracy={accuracy}
            errorChars={errorChars}
            usedFallback={usedFallback}
          />
        )}

        {finished && (
          <ResultsView
            wpm={wpm}
            accuracy={accuracy}
            correctChars={correctChars}
            errorChars={errorChars}
            totalChars={text.length}
            duration={duration}
            elapsed={effectiveElapsed}
            onRetry={handleRetry}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

// Live typing view: text-to-type with per-character coloring, hidden
// input capturing keystrokes, and a stats bar that updates continuously.
function RunningView({
  text,
  typed,
  onTypedChange,
  typingInputRef,
  timeLeft,
  wpm,
  accuracy,
  errorChars,
  usedFallback,
}) {
  return (
    <div className="space-y-4" onClick={() => typingInputRef.current?.focus()}>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-xs">
        <Stat label="Time" value={`${Math.ceil(timeLeft)}s`} color="#ffbd2e" />
        <Stat label="WPM" value={wpm} color="#27c93f" />
        <Stat label="Accuracy" value={`${accuracy}%`} color="#61afef" />
        <Stat label="Errors" value={errorChars} color="#ff5f56" />
      </div>

      {usedFallback && (
        <p className="text-white/30 text-xs italic">
          (Gemini was unavailable — using a built-in fallback text.)
        </p>
      )}

      {/* Text display with per-character highlighting */}
      <div className="rounded border border-white/10 bg-black/20 p-4 leading-relaxed tracking-wide whitespace-pre-wrap font-mono select-none">
        {text.split('').map((ch, i) => {
          let cls = 'text-white/30'; // untyped
          if (i < typed.length) {
            cls = typed[i] === ch ? 'text-white/90' : 'text-red-400 bg-red-500/20';
          } else if (i === typed.length) {
            cls = 'text-white/90 border-b-2 border-[#27c93f] animate-pulse';
          }
          return (
            <span key={i} className={cls}>
              {ch}
            </span>
          );
        })}
      </div>

      {/* Real input, visually hidden but focused — captures all keystrokes */}
      <input
        ref={typingInputRef}
        type="text"
        value={typed}
        onChange={onTypedChange}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#27c93f]/50 font-mono"
        placeholder="Start typing here…"
      />
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white/35">{label}</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ResultsView({
  wpm,
  accuracy,
  correctChars,
  errorChars,
  totalChars,
  duration,
  elapsed,
  onRetry,
  onClose,
}) {
  return (
    <div className="space-y-5 max-w-md">
      <p className="text-white/60">Test complete.</p>
      <div className="grid grid-cols-2 gap-4">
        <ResultBox label="WPM" value={wpm} color="#27c93f" />
        <ResultBox label="Accuracy" value={`${accuracy}%`} color="#61afef" />
        <ResultBox label="Correct chars" value={correctChars} color="#ffffff" />
        <ResultBox label="Errors" value={errorChars} color="#ff5f56" />
      </div>
      <p className="text-white/30 text-xs">
        {Math.round(elapsed)}s elapsed of {duration}s · {totalChars} chars total
      </p>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded bg-[#61afef]/15 border border-[#61afef]/40 text-[#61afef] text-sm hover:bg-[#61afef]/25 transition-colors"
        >
          New test
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded border border-white/15 text-white/60 text-sm hover:border-white/30 hover:text-white/80 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ResultBox({ label, value, color }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-white/35 text-[11px] uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default AiTerminal;
