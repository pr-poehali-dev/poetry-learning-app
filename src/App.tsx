import { useState } from "react";
import Icon from "@/components/ui/icon";

const POEMS = [
  {
    id: 1,
    title: "Я помню чудное мгновенье",
    author: "А.С. Пушкин",
    year: "1825",
    duration: "2:30",
    difficulty: "Лёгкое",
    lines: 24,
    strophes: [
      ["Я помню чудное мгновенье:", "Передо мной явилась ты,", "Как мимолётное виденье,", "Как гений чистой красоты."],
      ["В томленьях грусти безнадежной,", "В тревогах шумной суеты,", "Звучал мне долго голос нежный", "И снились милые черты."],
      ["Шли годы. Бурь порыв мятежный", "Рассеял прежние мечты,", "И я забыл твой голос нежный,", "Твои небесные черты."],
      ["В глуши, во мраке заточенья", "Тянулись тихо дни мои", "Без божества, без вдохновенья,", "Без слёз, без жизни, без любви."],
      ["Душе настало пробужденье:", "И вот опять явилась ты,", "Как мимолётное виденье,", "Как гений чистой красоты."],
      ["И сердце бьётся в упоенье,", "И для него воскресли вновь", "И божество, и вдохновенье,", "И жизнь, и слёзы, и любовь."],
    ],
  },
  {
    id: 2,
    title: "Парус",
    author: "М.Ю. Лермонтов",
    year: "1832",
    duration: "1:45",
    difficulty: "Лёгкое",
    lines: 12,
    strophes: [
      ["Белеет парус одинокой", "В тумане моря голубом!..", "Что ищет он в стране далёкой?", "Что кинул он в краю родном?.."],
      ["Играют волны — ветер свищет,", "И мачта гнётся и скрипит...", "Увы! он счастия не ищет", "И не от счастия бежит!"],
      ["Под ним струя светлей лазури,", "Над ним луч солнца золотой...", "А он, мятежный, просит бури,", "Как будто в бурях есть покой!"],
    ],
  },
  {
    id: 3,
    title: "Берёза",
    author: "С.А. Есенин",
    year: "1913",
    duration: "1:20",
    difficulty: "Лёгкое",
    lines: 16,
    strophes: [
      ["Белая берёза", "Под моим окном", "Принакрылась снегом,", "Точно серебром."],
      ["На пушистых ветках", "Снежною каймой", "Распустились кисти", "Белой бахромой."],
      ["И стоит берёза", "В сонной тишине,", "И горят снежинки", "В золотом огне."],
      ["А заря, лениво", "Обходя кругом,", "Обсыпает ветки", "Новым серебром."],
    ],
  },
  {
    id: 4,
    title: "Ночь, улица, фонарь, аптека",
    author: "А.А. Блок",
    year: "1912",
    duration: "0:50",
    difficulty: "Среднее",
    lines: 8,
    strophes: [
      ["Ночь, улица, фонарь, аптека,", "Бессмысленный и тусклый свет.", "Живи ещё хоть четверть века —", "Всё будет так. Исхода нет."],
      ["Умрёшь — начнёшь опять сначала,", "И повторится всё, как встарь:", "Ночь, ледяная рябь канала,", "Аптека, улица, фонарь."],
    ],
  },
];

const HISTORY = [
  { date: "08 мая", poem: "Парус", score: 94, sessions: 3 },
  { date: "07 мая", poem: "Берёза", score: 87, sessions: 2 },
  { date: "06 мая", poem: "Я помню чудное мгновенье", score: 71, sessions: 5 },
  { date: "05 мая", poem: "Берёза", score: 100, sessions: 1 },
];

// Flatten all lines from a poem
function getAllLines(poem: typeof POEMS[0]) {
  return poem.strophes.flatMap((s) => s);
}

type Screen = "home" | "catalog" | "learn" | "listen" | "stats" | "settings";
type VoiceState = "idle" | "listening" | "analyzing" | "done";

interface LineResult {
  lineIndex: number;
  errors: number[];  // indices of wrong words
  feedback: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedPoem, setSelectedPoem] = useState(POEMS[0]);
  const [currentStrophe, setCurrentStrophe] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceScore, setVoiceScore] = useState<null | { intonation: number; tempo: number; emotion: number }>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [learnedStrophes, setLearnedStrophes] = useState<number[]>([]);

  // Home screen state — line-by-line learning
  const [currentLine, setCurrentLine] = useState(0);
  const [learnedLines, setLearnedLines] = useState<number[]>([]);
  const [homeVoiceState, setHomeVoiceState] = useState<VoiceState>("idle");
  const [lineResult, setLineResult] = useState<LineResult | null>(null);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  const allLines = getAllLines(selectedPoem);
  const totalLines = allLines.length;
  const progressPct = totalLines > 0 ? Math.round((learnedLines.length / totalLines) * 100) : 0;

  const handleSelectPoem = (poem: typeof POEMS[0]) => {
    setSelectedPoem(poem);
    setCurrentLine(0);
    setLearnedLines([]);
    setHomeVoiceState("idle");
    setLineResult(null);
    setShowCatalogPicker(false);
  };

  const handleHomeVoiceCheck = () => {
    setHomeVoiceState("listening");
    setLineResult(null);
    setTimeout(() => setHomeVoiceState("analyzing"), 2500);
    setTimeout(() => {
      setHomeVoiceState("done");
      const words = allLines[currentLine].split(" ");
      // Simulate: randomly mark 0-2 words as errors
      const errorCount = Math.random() < 0.4 ? 0 : Math.floor(Math.random() * 2) + 1;
      const errorIndices: number[] = [];
      if (errorCount > 0 && words.length > 1) {
        const idx = Math.floor(Math.random() * words.length);
        errorIndices.push(idx);
      }
      const feedbacks = [
        "Интонация немного занижена в конце строки.",
        "Темп хороший, но ударение на третьем слове смещено.",
        "Отлично! Эмоциональная окраска точная.",
        "Слишком быстро — старайтесь делать паузы между строками.",
        "Ударение верное, но тон монотонный.",
      ];
      setLineResult({
        lineIndex: currentLine,
        errors: errorIndices,
        feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
      });
    }, 5000);
  };

  const handleMarkLearned = () => {
    if (!learnedLines.includes(currentLine)) {
      setLearnedLines((prev) => [...prev, currentLine]);
    }
    if (currentLine < totalLines - 1) {
      setCurrentLine(currentLine + 1);
      setHomeVoiceState("idle");
      setLineResult(null);
    }
  };

  const handleStartLearn = (poem: typeof POEMS[0]) => {
    setSelectedPoem(poem);
    setCurrentStrophe(0);
    setShowHint(false);
    setVoiceState("idle");
    setVoiceScore(null);
    setLearnedStrophes([]);
    setScreen("learn");
  };

  const handleVoiceCheck = () => {
    setVoiceState("listening");
    setTimeout(() => setVoiceState("analyzing"), 2500);
    setTimeout(() => {
      setVoiceState("done");
      setVoiceScore({
        intonation: Math.floor(Math.random() * 20) + 75,
        tempo: Math.floor(Math.random() * 20) + 70,
        emotion: Math.floor(Math.random() * 25) + 65,
      });
    }, 5000);
  };

  const handleNextStrophe = () => {
    if (!learnedStrophes.includes(currentStrophe)) {
      setLearnedStrophes([...learnedStrophes, currentStrophe]);
    }
    if (currentStrophe < selectedPoem.strophes.length - 1) {
      setCurrentStrophe(currentStrophe + 1);
      setShowHint(false);
      setVoiceState("idle");
      setVoiceScore(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e8e4dc] font-ibm">
      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e0f]/95 backdrop-blur border-t border-[#2a2a2e]">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          {[
            { id: "home", icon: "Home", label: "Главная" },
            { id: "catalog", icon: "BookOpen", label: "Каталог" },
            { id: "listen", icon: "Headphones", label: "Слушать" },
            { id: "stats", icon: "BarChart2", label: "Прогресс" },
            { id: "settings", icon: "Settings", label: "Настройки" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id as Screen)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                screen === tab.id ? "text-[#c9a96e]" : "text-[#555]"
              }`}
            >
              <Icon name={tab.icon} size={20} />
              <span className="text-[10px] font-medium tracking-wider uppercase">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-lg mx-auto pb-24 min-h-screen">

        {/* ═══════════════════════════════════════ HOME */}
        {screen === "home" && (
          <div className="flex flex-col min-h-screen">

            {/* Hero image */}
            <div className="relative w-full" style={{ height: "48vh" }}>
              <img
                src="https://cdn.poehali.dev/projects/8b2da2a8-66d6-4695-82c1-472f08d1e8fd/files/63ae14f6-f63d-44c3-89fa-e3f237a06f03.jpg"
                alt="Не забыть"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/20 to-[#0e0e0f]/50" />

              {/* App name top-left */}
              <div className="absolute top-0 left-0 right-0 px-6 pt-10">
                <p className="text-[#c9a96e] text-[10px] tracking-[0.5em] uppercase mb-1">приложение</p>
                <h1 className="font-cormorant text-5xl font-light text-[#e8e4dc] leading-none tracking-wide">
                  не забыть
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6 pb-4">

              {/* Quick actions — icon grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: "BookOpen", label: "Каталог\nстихов", screen: "catalog" as Screen },
                  { icon: "Headphones", label: "Слушать\nчтецов", screen: "listen" as Screen },
                  { icon: "BarChart2", label: "Мой\nпрогресс", screen: "stats" as Screen },
                ].map((item) => (
                  <button
                    key={item.screen}
                    onClick={() => setScreen(item.screen)}
                    className="flex flex-col items-center gap-3 py-5 bg-[#141416] border border-[#1e1e22] hover:border-[#c9a96e]/40 hover:bg-[#17150f] transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-[#c9a96e]/10 border border-[#c9a96e]/20 group-hover:bg-[#c9a96e]/20 transition-all">
                      <Icon name={item.icon} size={22} className="text-[#c9a96e]" />
                    </div>
                    <p className="text-[#888] text-xs text-center leading-4 group-hover:text-[#c9a96e] transition-colors whitespace-pre-line">
                      {item.label}
                    </p>
                  </button>
                ))}
              </div>

              {/* Personal progress + Learn button */}
              <div className="bg-[#141416] border border-[#1e1e22] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[#555] text-[10px] tracking-[0.3em] uppercase mb-1">Мой прогресс</p>
                    <p className="font-cormorant text-xl text-[#e8e4dc]">{selectedPoem.title}</p>
                    <p className="text-[#444] text-xs mt-0.5">{selectedPoem.author}</p>
                  </div>
                  <span className={`text-2xl font-cormorant font-light ${progressPct === 100 ? "text-[#6b9b76]" : "text-[#c9a96e]"}`}>
                    {progressPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-[#1e1e22] mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#c9a96e] to-[#d4b87a] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[#333] text-[10px] mb-5">
                  {learnedLines.length} из {totalLines} строк выучено
                </p>

                {/* Mini stats row */}
                <div className="flex gap-4 mb-5">
                  {[
                    { value: "4", label: "стихи" },
                    { value: "88%", label: "средний балл" },
                    { value: "11", label: "занятий" },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center">
                      <p className="font-cormorant text-xl text-[#c9a96e] font-light">{s.value}</p>
                      <p className="text-[#333] text-[10px] tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleStartLearn(selectedPoem)}
                  className="w-full py-3.5 bg-[#c9a96e] text-[#0e0e0f] text-sm font-medium tracking-[0.15em] uppercase hover:bg-[#d4b87a] transition-all"
                >
                  Учить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ CATALOG */}
        {screen === "catalog" && (
          <div className="px-6 pt-12">
            <div className="mb-10">
              <p className="text-[#555] text-xs tracking-[0.3em] uppercase mb-2">Библиотека</p>
              <h1 className="font-cormorant text-4xl font-light text-[#e8e4dc] leading-tight">
                Стихи для<br />заучивания
              </h1>
            </div>

            <div className="space-y-px">
              {POEMS.map((poem, i) => (
                <div
                  key={poem.id}
                  className="group bg-[#141416] border border-[#1e1e22] hover:border-[#c9a96e]/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleStartLearn(poem)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[#333] text-xs font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 ${
                        poem.difficulty === "Лёгкое"
                          ? "text-[#6b9b76] bg-[#6b9b76]/10"
                          : "text-[#c9a96e] bg-[#c9a96e]/10"
                      }`}>
                        {poem.difficulty}
                      </span>
                    </div>
                    <h3 className="font-cormorant text-xl text-[#e8e4dc] mb-1 group-hover:text-[#c9a96e] transition-colors">
                      {poem.title}
                    </h3>
                    <p className="text-[#555] text-sm mb-4">{poem.author} · {poem.year}</p>
                    <div className="flex items-center gap-4 text-[#444] text-xs">
                      <span className="flex items-center gap-1.5">
                        <Icon name="AlignLeft" size={12} />
                        {poem.lines} строк
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="Clock" size={12} />
                        {poem.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="Layers" size={12} />
                        {poem.strophes.length} строфы
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ LEARN (by strophes) */}
        {screen === "learn" && (
          <div className="px-6 pt-12">
            <button
              onClick={() => setScreen("home")}
              className="flex items-center gap-2 text-[#555] hover:text-[#e8e4dc] transition-colors mb-8 text-sm"
            >
              <Icon name="ArrowLeft" size={16} />
              На главную
            </button>

            <div className="mb-8">
              <p className="text-[#555] text-xs tracking-[0.3em] uppercase mb-1">{selectedPoem.author}</p>
              <h2 className="font-cormorant text-3xl font-light text-[#e8e4dc]">{selectedPoem.title}</h2>
            </div>

            <div className="flex gap-1.5 mb-8">
              {selectedPoem.strophes.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 transition-all duration-500 ${
                    learnedStrophes.includes(i)
                      ? "bg-[#6b9b76]"
                      : i === currentStrophe
                      ? "bg-[#c9a96e]"
                      : "bg-[#2a2a2e]"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[#555] text-xs tracking-widest uppercase">
                Строфа {currentStrophe + 1} из {selectedPoem.strophes.length}
              </span>
              <button
                onClick={() => setShowHint(!showHint)}
                className={`text-xs tracking-wider flex items-center gap-1.5 transition-colors ${
                  showHint ? "text-[#c9a96e]" : "text-[#444] hover:text-[#666]"
                }`}
              >
                <Icon name="Eye" size={13} />
                {showHint ? "Скрыть" : "Подсказка"}
              </button>
            </div>

            <div className="bg-[#141416] border border-[#1e1e22] p-7 mb-6">
              {selectedPoem.strophes[currentStrophe].map((line, i) => (
                <p
                  key={i}
                  className={`font-cormorant text-xl leading-9 transition-all duration-300 ${
                    showHint ? "text-[#e8e4dc]" : "text-[#e8e4dc]/10 select-none blur-[3px]"
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>

            <div className="bg-[#141416] border border-[#1e1e22] p-5 mb-4">
              {voiceState === "idle" && (
                <button
                  onClick={handleVoiceCheck}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-[#c9a96e]/10 hover:bg-[#c9a96e]/20 border border-[#c9a96e]/30 text-[#c9a96e] transition-all text-sm tracking-wider"
                >
                  <Icon name="Mic" size={18} />
                  Голосовая проверка строфы
                </button>
              )}
              {voiceState === "listening" && (
                <div className="flex flex-col items-center py-3 gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#c9a96e]/20 flex items-center justify-center animate-pulse">
                      <Icon name="Mic" size={22} className="text-[#c9a96e]" />
                    </div>
                    <div className="absolute inset-0 rounded-full border border-[#c9a96e]/40 animate-ping" />
                  </div>
                  <p className="text-[#c9a96e] text-sm">Говорите строфу...</p>
                </div>
              )}
              {voiceState === "analyzing" && (
                <div className="flex flex-col items-center py-3 gap-3">
                  <div className="flex gap-1 items-end">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-1 bg-[#c9a96e]/60 animate-pulse rounded-full"
                        style={{ height: `${20 + Math.abs(Math.sin(i)) * 12}px`, animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <p className="text-[#888] text-sm">Анализируем интонацию и темп...</p>
                </div>
              )}
              {voiceState === "done" && voiceScore && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[#888] text-xs tracking-wider uppercase">Результат проверки</p>
                    <button onClick={() => { setVoiceState("idle"); setVoiceScore(null); }} className="text-[#444] hover:text-[#888] transition-colors">
                      <Icon name="RotateCcw" size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Интонация", value: voiceScore.intonation, icon: "TrendingUp" },
                      { label: "Темп чтения", value: voiceScore.tempo, icon: "Timer" },
                      { label: "Эмоциональность", value: voiceScore.emotion, icon: "Heart" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <Icon name={item.icon} size={14} className="text-[#555]" />
                        <span className="text-[#888] text-xs w-28">{item.label}</span>
                        <div className="flex-1 h-0.5 bg-[#2a2a2e]">
                          <div className="h-full bg-[#c9a96e] transition-all duration-700" style={{ width: `${item.value}%` }} />
                        </div>
                        <span className={`text-xs font-mono w-8 text-right ${
                          item.value >= 90 ? "text-[#6b9b76]" : item.value >= 75 ? "text-[#c9a96e]" : "text-[#c97070]"
                        }`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {currentStrophe > 0 && (
                <button
                  onClick={() => { setCurrentStrophe(currentStrophe - 1); setShowHint(false); setVoiceState("idle"); setVoiceScore(null); }}
                  className="px-4 py-3 border border-[#2a2a2e] text-[#555] hover:text-[#888] hover:border-[#333] transition-all"
                >
                  <Icon name="ChevronLeft" size={16} />
                </button>
              )}
              <button
                onClick={handleNextStrophe}
                disabled={currentStrophe === selectedPoem.strophes.length - 1}
                className="flex-1 py-3 bg-[#c9a96e] text-[#0e0e0f] text-sm font-medium tracking-wider hover:bg-[#d4b87a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {currentStrophe === selectedPoem.strophes.length - 1 ? "Завершено" : "Следующая строфа"}
              </button>
            </div>

            {currentStrophe === selectedPoem.strophes.length - 1 && (
              <div className="mt-4 p-4 border border-[#6b9b76]/30 bg-[#6b9b76]/5 text-center">
                <p className="font-cormorant text-lg text-[#6b9b76] mb-1">Стихотворение выучено!</p>
                <p className="text-[#555] text-xs">Перейдите к прослушиванию эталонного чтения</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════ LISTEN */}
        {screen === "listen" && (
          <div className="px-6 pt-12">
            <div className="mb-10">
              <p className="text-[#555] text-xs tracking-[0.3em] uppercase mb-2">Прослушивание</p>
              <h1 className="font-cormorant text-4xl font-light text-[#e8e4dc]">Эталонное<br />чтение</h1>
            </div>
            <div className="space-y-px mb-8">
              {POEMS.map((poem) => (
                <div
                  key={poem.id}
                  className={`bg-[#141416] border transition-all cursor-pointer ${
                    selectedPoem.id === poem.id ? "border-[#c9a96e]/40" : "border-[#1e1e22]"
                  }`}
                  onClick={() => { setSelectedPoem(poem); setIsPlaying(false); }}
                >
                  <div className="p-4 flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoem(poem);
                        setIsPlaying(!(isPlaying && selectedPoem.id === poem.id));
                      }}
                      className={`w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedPoem.id === poem.id && isPlaying
                          ? "bg-[#c9a96e] text-[#0e0e0f]"
                          : "bg-[#1e1e22] text-[#555] hover:text-[#888]"
                      }`}
                    >
                      <Icon name={selectedPoem.id === poem.id && isPlaying ? "Pause" : "Play"} size={15} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-cormorant text-base text-[#e8e4dc] truncate">{poem.title}</p>
                      <p className="text-[#444] text-xs">{poem.author}</p>
                    </div>
                    <span className="text-[#444] text-xs font-mono">{poem.duration}</span>
                  </div>
                  {selectedPoem.id === poem.id && isPlaying && (
                    <div className="px-4 pb-4">
                      <div className="h-0.5 bg-[#2a2a2e] mb-3">
                        <div className="h-full bg-[#c9a96e] w-1/3 transition-all" />
                      </div>
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div key={i} className="w-0.5 bg-[#c9a96e]/40 rounded-full animate-pulse"
                            style={{ height: `${8 + Math.abs(Math.sin(i * 0.6)) * 20}px`, animationDelay: `${i * 40}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-[#141416] border border-[#1e1e22] p-5">
              <p className="text-[#555] text-xs tracking-wider uppercase mb-4">Текст</p>
              <div className="space-y-5">
                {selectedPoem.strophes.map((strophe, si) => (
                  <div key={si} className={`transition-all ${isPlaying && si === 0 ? "opacity-100" : isPlaying ? "opacity-30" : "opacity-70"}`}>
                    {strophe.map((line, li) => (
                      <p key={li} className="font-cormorant text-lg leading-7 text-[#e8e4dc]">{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ STATS */}
        {screen === "stats" && (
          <div className="px-6 pt-12">
            <div className="mb-10">
              <p className="text-[#555] text-xs tracking-[0.3em] uppercase mb-2">Аналитика</p>
              <h1 className="font-cormorant text-4xl font-light text-[#e8e4dc]">Прогресс<br />заучивания</h1>
            </div>
            <div className="grid grid-cols-3 gap-px mb-6">
              {[
                { value: "4", label: "Стихи начаты" },
                { value: "11", label: "Сессий всего" },
                { value: "88%", label: "Средний балл" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#141416] border border-[#1e1e22] p-4 text-center">
                  <p className="font-cormorant text-3xl text-[#c9a96e] font-light">{stat.value}</p>
                  <p className="text-[#444] text-[10px] mt-1 tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#141416] border border-[#1e1e22] p-5 mb-4">
              <p className="text-[#555] text-xs tracking-wider uppercase mb-4">Результаты по дням</p>
              <div className="flex items-end gap-2 h-24">
                {[71, 87, 94, 100, 88, 92, 85].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#c9a96e]/80 rounded-sm" style={{ height: `${(val / 100) * 80}px` }} />
                    <span className="text-[#333] text-[9px] font-mono">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#141416] border border-[#1e1e22]">
              <div className="px-5 py-3 border-b border-[#1e1e22]">
                <p className="text-[#555] text-xs tracking-wider uppercase">История занятий</p>
              </div>
              {HISTORY.map((entry, i) => (
                <div key={i} className={`px-5 py-4 flex items-center gap-4 ${i < HISTORY.length - 1 ? "border-b border-[#1a1a1e]" : ""}`}>
                  <span className="text-[#444] text-xs font-mono w-14">{entry.date}</span>
                  <div className="flex-1">
                    <p className="font-cormorant text-base text-[#e8e4dc]">{entry.poem}</p>
                    <p className="text-[#444] text-xs">{entry.sessions} {entry.sessions === 1 ? "сессия" : "сессии"}</p>
                  </div>
                  <div className={`text-sm font-mono font-medium ${
                    entry.score >= 90 ? "text-[#6b9b76]" : entry.score >= 75 ? "text-[#c9a96e]" : "text-[#c97070]"
                  }`}>{entry.score}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ SETTINGS */}
        {screen === "settings" && (
          <div className="px-6 pt-12">
            <div className="mb-10">
              <p className="text-[#555] text-xs tracking-[0.3em] uppercase mb-2">Профиль</p>
              <h1 className="font-cormorant text-4xl font-light text-[#e8e4dc]">Настройки</h1>
            </div>
            <div className="bg-[#141416] border border-[#1e1e22] p-5 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
                <Icon name="User" size={20} className="text-[#c9a96e]" />
              </div>
              <div>
                <p className="text-[#e8e4dc] font-medium">Пользователь</p>
                <p className="text-[#444] text-sm">Начинающий чтец</p>
              </div>
              <button className="ml-auto text-[#444] hover:text-[#888] transition-colors">
                <Icon name="Edit2" size={16} />
              </button>
            </div>
            <div className="space-y-px">
              {[
                {
                  title: "Голосовая проверка",
                  items: [
                    { label: "Анализ интонации", desc: "Оценка эмоциональных переходов", active: true },
                    { label: "Анализ темпа", desc: "Контроль ритма чтения", active: true },
                    { label: "Эмоциональная окраска", desc: "Соответствие настроению стиха", active: false },
                  ],
                },
                {
                  title: "Обучение",
                  items: [
                    { label: "Показывать подсказки", desc: "Первая строка строфы", active: true },
                    { label: "Звуковые сигналы", desc: "Уведомления о прогрессе", active: false },
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="bg-[#141416] border border-[#1e1e22]">
                  <div className="px-5 py-3 border-b border-[#1e1e22]">
                    <p className="text-[#555] text-xs tracking-wider uppercase">{section.title}</p>
                  </div>
                  {section.items.map((item, i) => (
                    <div key={i} className={`px-5 py-4 flex items-center gap-4 ${i < section.items.length - 1 ? "border-b border-[#1a1a1e]" : ""}`}>
                      <div className="flex-1">
                        <p className="text-[#e8e4dc] text-sm">{item.label}</p>
                        <p className="text-[#444] text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${item.active ? "bg-[#c9a96e]/80" : "bg-[#2a2a2e]"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#0e0e0f] transition-all ${item.active ? "left-5" : "left-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 border border-[#1e1e22] text-center">
              <p className="text-[#333] text-xs">Версия 1.0 · Стихи наизусть</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}