import { useEffect, useMemo, useState } from "react";

const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);
const letterFor = (n) => {
  if (n >= 1 && n <= 15) return "B";
  if (n >= 16 && n <= 30) return "I";
  if (n >= 31 && n <= 45) return "N";
  if (n >= 46 && n <= 60) return "G";
  if (n >= 61 && n <= 75) return "O";
  return "—";
};
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function App() {
  const allNumbers = useMemo(() => range(1, 75), []);
  const [queue, setQueue] = useState(() => shuffle(allNumbers));
  const [calledCount, setCalledCount] = useState(0);
  const [calledSet, setCalledSet] = useState(() => new Set());
  const [current, setCurrent] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);
  const [cornerInitial, setCornerInitial] = useState("");
  const [cornerNumber, setCornerNumber] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const loaded = synth.getVoices();
      const esVoices = loaded.filter((v) =>
        v.lang?.toLowerCase().startsWith("es")
      );

      // En el selector solo mostramos voces en español.
      setVoices(esVoices);

      if (!selectedVoiceURI) {
        const preferredList = esVoices.length > 0 ? esVoices : loaded;
        if (preferredList.length > 0) {
          // Priorizar voces de Google si existen (por nombre o voiceURI)
          const googleVoice = preferredList.find(
            (v) =>
              v.name?.toLowerCase().includes("google") ||
              v.voiceURI?.toLowerCase().includes("google")
          );

          const chosen = googleVoice || preferredList[0];
          setSelectedVoiceURI(chosen.voiceURI);
        }
      }
    };

    loadVoices();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof synth.onvoiceschanged !== "undefined") {
        synth.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceURI]);

  const speakNumber = (n) => {
    if (
      !voiceEnabled ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance();
    // Frase sencilla: letra de bingo + número. El motor de voz se encarga del resto.
    utterance.text = `${letterFor(n)} ${n}`;
    utterance.lang = "es-ES";

    if (voices.length > 0) {
      const chosen = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (chosen) {
        utterance.voice = chosen;
      }
    }

    synth.speak(utterance);
  };

  const columns = [
    { letter: "B", nums: range(1, 15) },
    { letter: "I", nums: range(16, 30) },
    { letter: "N", nums: range(31, 45) },
    { letter: "G", nums: range(46, 60) },
    { letter: "O", nums: range(61, 75) },
  ];

  const singNext = () => {
    if (calledCount >= 75) return;
    const next = queue[calledCount];
    setCurrent(next);
    setCalledCount((c) => c + 1);
    setCalledSet((prev) => new Set(prev).add(next));
    speakNumber(next);
  };

  const resetGame = () => {
    setQueue(shuffle(allNumbers));
    setCalledCount(0);
    setCalledSet(new Set());
    setCurrent(null);
    setCornerInitial("");
    setCornerNumber(null);
  };

  const handleCorner = () => {
    if (typeof window === "undefined") return;

    // Solo se pueden cantar esquinas con números de la B (1–15) u O (61–75)
    if (!current || (current > 15 && current < 61)) {
      window.alert(
        "Las esquinas solo se pueden registrar con números de la B (1–15) u O (61–75)."
      );
      return;
    }

    const input = window.prompt(
      "Ingresa la inicial de quien ganó la esquina:",
      cornerInitial || ""
    );
    if (!input) return;

    const letter = input.trim().toUpperCase().charAt(0);
    if (!letter) return;

    setCornerInitial(letter);
    setCornerNumber(current);
  };

  const disabled = calledCount >= 75;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="max-w-7xl w-full px-1">
        <section className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-start justify-center">
          {/* Panel de Llamado */}
          <div className="flex flex-col items-center justify-between bg-slate-800/70 rounded-xl p-3 shadow-lg">
            <div className="w-full text-center mb-2">
              <div className="leading-none">
                <div
                  id="currentLetter"
                  className="text-[clamp(8rem,12vw,15rem)] font-extrabold text-emerald-400"
                >
                  {current ? letterFor(current) : "—"}
                </div>
                <div
                  id="currentNumber"
                  className="text-[clamp(18rem,27.5vw,38rem)] leading-none font-black tracking-tight select-none"
                >
                  {current ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full mt-1">
              <button
                id="nextBtn"
                onClick={singNext}
                disabled={disabled}
                className="flex-1 py-4 text-xl font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] transition disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Cantar Siguiente Número
              </button>
              <button
                onClick={handleCorner}
                className="px-4 py-4 text-xl font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 active:scale-[0.99] transition"
              >
                Esquina
              </button>
              <button
                onClick={resetGame}
                className="px-4 py-4 text-xl font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-[0.99] transition"
              >
                Reiniciar
              </button>
            </div>
            <div className="flex items-center justify-end w-full mt-2 text-slate-200 text-sm">
              <div className="text-right">
                <span className="font-semibold mr-1">Ganó esquina:</span>
                <span className="text-lg">
                  {cornerNumber && cornerInitial
                    ? `${cornerNumber} - ${cornerInitial}`
                    : "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-2 text-slate-200 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Voz activada</span>
              </label>
              <div className="flex-1 flex items-center gap-2 w-full">
                <span className="whitespace-nowrap">Voz:</span>
                <select
                  disabled={!voiceEnabled || voices.length === 0}
                  value={selectedVoiceURI || ""}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="flex-1 bg-slate-700 text-slate-100 rounded px-2 py-1 text-sm disabled:opacity-60"
                >
                  {voices.length === 0 ? (
                    <option value="">Cargando voces...</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <p id="status" className="mt-2 text-center text-slate-300">
              {disabled
                ? "Juego terminado: se cantaron todos los números (1–75)."
                : ""}
            </p>
          </div>

          {/* El Uno / Tablero Maestro */}
          <div className="bg-slate-800/70 rounded-xl p-2 shadow-lg">
            <div className="grid grid-cols-5 gap-1 justify-items-center">
              {columns.map(({ letter, nums }) => (
                <div key={letter} className="flex flex-col gap-1 items-center">
                  <div className="bg-slate-700 text-white w-24 text-center py-1 rounded-md font-semibold text-2xl lg:text-3xl">
                    {letter}
                  </div>
                  {nums.map((n) => {
                    const isCalled = calledSet.has(n);
                    return (
                      <div
                        key={n}
                        className={
                          `w-24 text-center py-1 rounded-md font-semibold text-5xl lg:text-5xl ` +
                          (isCalled
                            ? "bg-emerald-500 text-black"
                            : "bg-slate-700 text-white")
                        }
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
