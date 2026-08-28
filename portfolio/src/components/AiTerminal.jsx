import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { personalInfo } from '../data/personalInfo.js';
import { aiSystemPrompt } from '../data/aiSystemPrompt.js';
import { GEMINI_ENDPOINT, GEMINI_API_KEY } from '../data/aiConfig.js';

const FIRST_NAME = personalInfo.name.split(' ')[0].toLowerCase();
const PROMPT_LABEL = `visitor@${FIRST_NAME}-portfolio:~$`;

const BOOT_LINES = [
  `Last login: ${new Date().toDateString()} on ttys000`,
  `Welcome to ${personalInfo.name}'s portfolio shell.`,
  `Type a question about his skills, projects, or background and press Enter.`,
];

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
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
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

function AiTerminal() {
  // Each entry: { type: 'boot' | 'command' | 'output' | 'error', text }
  const [lines, setLines] = useState(() => BOOT_LINES.map((text) => ({ type: 'boot', text })));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest line whenever the conversation changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, isLoading]);

  const focusInput = () => inputRef.current?.focus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

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
          it reads as a real terminal session rather than a chat log. */}
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
              {line.text}
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
            autoFocus
            spellCheck={false}
            autoComplete="off"
            disabled={isLoading}
            className="flex-1 bg-transparent text-white outline-none placeholder-white/25 disabled:opacity-50"
            placeholder={isLoading ? '' : 'ask something…'}
          />
          {!isLoading && <span className="w-2 h-4 bg-white/70 animate-pulse" aria-hidden="true" />}
        </form>
      </div>
    </div>
  );
}

export default AiTerminal;
