"use client";

import {
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BibleAudioPlayerProps = {
  html: string;
  reference: string;
  onFinished?: () => void;
};

function htmlToText(html: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitForSpeech(text: string) {
  const sentences =
    text.match(/[^.!?;:]+[.!?;:]?/g) || [text];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean) continue;

    if (clean.length <= 220) {
      chunks.push(clean);
      continue;
    }

    for (let index = 0; index < clean.length; index += 200) {
      chunks.push(clean.slice(index, index + 200));
    }
  }

  return chunks;
}

export default function BibleAudioPlayer({
  html,
  reference,
  onFinished,
}: BibleAudioPlayerProps) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voiceName, setVoiceName] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const currentChunk = useRef(0);
  const session = useRef(0);

  const chunks = useMemo(
    () => splitForSpeech(htmlToText(html)),
    [html]
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const french = available.filter((voice) =>
        voice.lang.toLowerCase().startsWith("fr")
      );
      const next = french.length ? french : available;
      setVoices(next);
      setVoiceName((current) => current || next[0]?.name || "");
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      session.current += 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      session.current += 1;
      window.speechSynthesis.cancel();
    }
    currentChunk.current = 0;
    setPlaying(false);
    setPaused(false);
  }, [html, reference]);

  function speakChunk(index: number, activeSession: number) {
    if (
      activeSession !== session.current ||
      index >= chunks.length
    ) {
      setPlaying(false);
      setPaused(false);
      currentChunk.current = 0;
      onFinished?.();
      return;
    }

    currentChunk.current = index;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "fr-FR";
    utterance.rate = rate;
    utterance.voice =
      voices.find((voice) => voice.name === voiceName) || null;
    utterance.onend = () => speakChunk(index + 1, activeSession);
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  }

  function play() {
    if (!chunks.length) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    session.current += 1;
    window.speechSynthesis.cancel();
    setPlaying(true);
    setPaused(false);
    speakChunk(currentChunk.current, session.current);
  }

  function pause() {
    window.speechSynthesis.pause();
    setPaused(true);
    setPlaying(false);
  }

  function stop() {
    session.current += 1;
    window.speechSynthesis.cancel();
    currentChunk.current = 0;
    setPlaying(false);
    setPaused(false);
  }

  function restart() {
    stop();
    currentChunk.current = 0;
    session.current += 1;
    setPlaying(true);
    speakChunk(0, session.current);
  }

  if (!supported) {
    return (
      <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
        La lecture audio n’est pas prise en charge par ce navigateur.
      </p>
    );
  }

  return (
    <section
      aria-label={`Bible audio — ${reference}`}
      className="rounded-2xl border border-[#CFE1EF] bg-gradient-to-r from-[#EAF3FA] to-white p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03357A] text-white">
            <Volume2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-black text-[#03357A]">Écouter ce chapitre</p>
            <p className="text-xs font-semibold text-slate-500">
              Lecture vocale en français
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={playing ? pause : play}
            disabled={!chunks.length}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white disabled:opacity-40"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : paused ? "Continuer" : "Écouter"}
          </button>
          <button
            type="button"
            onClick={restart}
            disabled={!chunks.length}
            aria-label="Recommencer le chapitre"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#03357A] shadow-sm disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Arrêter la lecture"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#03357A] shadow-sm"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-black text-slate-600">
          Vitesse
          <select
            value={rate}
            onChange={(event) => {
              stop();
              setRate(Number(event.target.value));
            }}
            className="mt-1 min-h-10 w-full rounded-xl border border-[#CFE1EF] bg-white px-3 text-sm"
          >
            <option value={0.75}>Lente — 0,75×</option>
            <option value={1}>Normale — 1×</option>
            <option value={1.25}>Rapide — 1,25×</option>
            <option value={1.5}>Très rapide — 1,5×</option>
          </select>
        </label>

        <label className="text-xs font-black text-slate-600">
          Voix
          <select
            value={voiceName}
            onChange={(event) => {
              stop();
              setVoiceName(event.target.value);
            }}
            className="mt-1 min-h-10 w-full rounded-xl border border-[#CFE1EF] bg-white px-3 text-sm"
          >
            {voices.map((voice) => (
              <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
