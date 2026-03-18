import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Construction,
} from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 12;
const LABEL_WIDTH = 280;
const TICK_DAYS = 14;

const dateAtStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (base, days) => new Date(dateAtStart(base).getTime() + days * DAY_MS);

const diffDays = (start, end) => {
  const a = dateAtStart(start).getTime();
  const b = dateAtStart(end).getTime();
  return Math.round((b - a) / DAY_MS);
};

const formatDate = (date) => dateAtStart(date).toISOString().split('T')[0];

const ACCIDENTS = [
  {
    id: 20,
    title: '単管パイプ工場解体中に水平材から墜落',
    type: '墜落・転落',
    category: '解体工事',
    imageDir: '職場のあんぜんサイト：労働災害統計20',
    imageFiles: ['fc215869-1.png', 'fc215869-2.png', 'fc215869-3.png'],
    keywords: ['解体', '単管足場', '安全帯'],
    description:
      '解体中の水平材を移動中、安全帯のフックを掛け替えようとして、緩んでいた縦単管に手をかけ転落。',
    countermeasure: '2丁掛け安全帯の徹底。解体手順の遵守。クランプの緩み確認。',
  },
  {
    id: 19,
    title: 'コンクリート打設中、フラットデッキが抜け作業員5名が墜落',
    type: '崩壊・倒壊',
    category: '躯体・コンクリ',
    imageDir: '職場のあんぜんサイト：労働災害統計19',
    imageFiles: ['8f33feb3-1.png', '8f33feb3-2.png'],
    keywords: ['コンクリート打設', '支保工', 'スラブ'],
    description:
      '許容スパンを超えたデッキプレート上で打設中、デッキが外れ下階まで墜落。',
    countermeasure: '割付図通りの支保工設置。許容荷重の確認。打設順序の遵守。',
  },
  {
    id: 18,
    title: 'キュービクル式高圧受電設備内で露出充電部に触れ感電',
    type: '感電',
    category: '電気設備',
    imageDir: '職場のあんぜんサイト：労働災害統計18',
    imageFiles: ['ca8088fb-1.png', 'ca8088fb-2.png'],
    keywords: ['電気工事', '高圧受電', '絶縁シート'],
    description:
      '通電中の隣接系統との境界に絶縁シートを取り付ける際、露出していた変流器端子に接触。',
    countermeasure: '絶縁用保護具の着用。作業指揮者の配置。停電範囲の明確化。',
  },
  {
    id: 17,
    title: '脚立での配管移設中、仮設配線を踏み作業員4名が感電',
    type: '感電',
    category: '設備工事',
    imageDir: '職場のあんぜんサイト：労働災害統計17',
    imageFiles: ['6601321b-1.png', '6601321b-2.png'],
    keywords: ['配管工事', '脚立', '漏電'],
    description:
      '脚立の足で仮設ケーブルを踏み、被覆が剥がれて脚立が帯電。救助者も含め感電。',
    countermeasure: 'ケーブルの養生・高所配線。絶縁性の脚立使用。漏電遮断機の設置。',
  },
  {
    id: 16,
    title: 'クレーン作業中、突風で補助ジブが折れ、つり荷が落下',
    type: '飛来・落下',
    category: '揚重・クレーン',
    relatedCategories: ['鉄骨・躯体', '外装工事'],
    imageDir: '職場のあんぜんサイト：労働災害統計16',
    imageFiles: ['747087f5-1.png', '747087f5-2.png', '747087f5-3.png'],
    keywords: ['クレーン', '強風', '過負荷防止'],
    description:
      '長尺な屋根材を吊り上げ中、突風を受け補助ジブが破損。過負荷防止装置のミスも重なった。',
    countermeasure: '強風時の作業中止基準の遵守。過負荷防止装置の適正設定。',
  },
  {
    id: 14,
    title: '天井クレーンでダクト吊り上げ中、フックブロックが落下',
    type: '飛来・落下',
    category: '揚重・クレーン',
    relatedCategories: ['設備工事', '電気設備'],
    imageDir: '職場のあんぜんサイト：労働災害統計14',
    imageFiles: ['bd93ebed-1.png', 'bd93ebed-2.png', 'bd93ebed-3.png'],
    keywords: ['巻過防止', 'ワイヤー切断'],
    description:
      '巻過防止装置を無効にした状態で作業。ワイヤーが噛み込み切断され落下。',
    countermeasure: '安全装置を故意に解除しない。始業前点検の徹底。',
  },
  {
    id: 13,
    title: '鉄骨組立作業中、梁上から足を踏み外し墜落',
    type: '墜落・転落',
    category: '鉄骨・躯体',
    imageDir: '職場のあんぜんサイト：労働災害統計13',
    imageFiles: ['25586fc3-1.png', '25586fc3-2.png'],
    keywords: ['梁上作業', '安全帯フック'],
    description:
      '幅10cmの梁上を歩行中、足を踏み外し8m下に墜落。安全帯は掛けていなかった。',
    countermeasure: '親綱へのフック掛け徹底。安全ネットの早期展張。',
  },
  {
    id: 10,
    title: '地下ピット内でアーク溶接中に感電',
    type: '感電',
    category: '地下・基礎',
    imageDir: '職場のあんぜんサイト：労働災害統計10',
    imageFiles: ['7e932389-1.png', '7e932389-2.png', '7e932389-3.png'],
    keywords: ['溶接', '水たまり', 'ピット'],
    description:
      '浸水したピット内で溶接作業を中断した際、ホルダーを足場にかけ回路が形成され感電。',
    countermeasure: '水場での作業停止。ホルダーの絶縁管理。電防点検。',
  },
  {
    id: 8,
    title: 'ダンプトラックが突現在後退し挟まれる',
    type: 'はさまれ',
    category: '土工・基礎',
    imageDir: '職場のあんぜんサイト：労働災害統計8',
    imageFiles: ['d1240c61-1.png', 'd1240c61-2.png'],
    keywords: ['ダンプ', '輪留め', '自走'],
    description:
      '傾斜地で砕石降ろし中、サイドブレーキが不十分でダンプが自走し柱に挟まれた。',
    countermeasure: '傾斜地での輪留め使用。エンジン停止・完全制動。',
  },
];

const SCHEDULE = [
  { id: 1, task: '既存建物解体工事', start: '2026-03-01', end: '2026-03-20', category: '解体工事' },
  { id: 2, task: '山留め・根切り工事', start: '2026-03-15', end: '2026-04-10', category: '土工・基礎' },
  { id: 3, task: '基礎杭・地業', start: '2026-04-05', end: '2026-04-25', category: '土工・基礎' },
  { id: 4, task: '1F躯体・地下ピット', start: '2026-04-20', end: '2026-05-15', category: '地下・基礎' },
  { id: 5, task: '鉄骨建方（下層節）', start: '2026-05-10', end: '2026-06-05', category: '鉄骨・躯体' },
  { id: 6, task: '床デッキプレート敷設', start: '2026-05-20', end: '2026-06-15', category: '躯体・コンクリ' },
  { id: 7, task: 'スラブ配筋・コン打設', start: '2026-06-01', end: '2026-06-25', category: '躯体・コンクリ' },
  { id: 8, task: 'カーテンウォール取付', start: '2026-06-15', end: '2026-07-20', category: '外装工事' },
  { id: 9, task: '設備配管・空調ダクト', start: '2026-06-20', end: '2026-07-30', category: '設備工事' },
  { id: 10, task: '強電・弱電幹線敷設', start: '2026-07-01', end: '2026-08-10', category: '電気設備' },
  { id: 11, task: '内装LGS下地・ボード', start: '2026-07-15', end: '2026-08-25', category: '内装工事' },
].map((item) => ({
  ...item,
  startDate: dateAtStart(item.start),
  endDate: dateAtStart(item.end),
}));

const CHART_START = dateAtStart('2026-03-01');
const CHART_END = dateAtStart('2026-08-25');
const TOTAL_DAYS = diffDays(CHART_START, CHART_END);
const IMAGE_CACHE_BUST = '20260318b';

const toImageUrl = (accident, fileName) => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}image-assets/${accident.id}/${fileName}?v=${IMAGE_CACHE_BUST}`;
};

function App() {
  const [activeTab, setActiveTab] = useState('simulation');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dayOffset, setDayOffset] = useState(diffDays(CHART_START, dateAtStart('2026-03-18')));
  const [selectedId, setSelectedId] = useState(ACCIDENTS[0].id);
  const [zoomState, setZoomState] = useState(null);
  const [dragging, setDragging] = useState(false);
  const ganttViewportRef = useRef(null);

  const currentDate = useMemo(() => addDays(CHART_START, dayOffset), [dayOffset]);

  const activeTasks = useMemo(() => {
    const now = currentDate.getTime();
    return SCHEDULE.filter((task) => now >= task.startDate.getTime() && now <= task.endDate.getTime());
  }, [currentDate]);

  const currentSuggestions = useMemo(() => {
    const categories = activeTasks.map((task) => task.category);
    return ACCIDENTS.filter((accident) => {
      if (categories.includes(accident.category)) return true;
      return accident.relatedCategories?.some((related) => categories.includes(related));
    });
  }, [activeTasks]);

  const currentSuggestionImageTotal = useMemo(
    () => currentSuggestions.reduce((total, accident) => total + accident.imageFiles.length, 0),
    [currentSuggestions],
  );

  const dateTicks = useMemo(() => {
    const ticks = [];
    for (let day = 0; day <= TOTAL_DAYS; day += TICK_DAYS) {
      const tickDate = addDays(CHART_START, day);
      ticks.push({ day, label: `${tickDate.getMonth() + 1}/${tickDate.getDate()}` });
    }
    return ticks;
  }, []);

  const selectedAccident =
    ACCIDENTS.find((item) => item.id === selectedId) ||
    currentSuggestions[0] ||
    ACCIDENTS[0];

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragging || !ganttViewportRef.current) return;
      const rect = ganttViewportRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left + ganttViewportRef.current.scrollLeft - LABEL_WIDTH;
      const clamped = Math.max(0, Math.min(x, TOTAL_DAYS * DAY_WIDTH));
      setDayOffset(Math.round(clamped / DAY_WIDTH));
    };

    const handleUp = () => setDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setZoomState(null);
      if (!zoomState) return;
      if (event.key === 'ArrowRight') {
        setZoomState((prev) => {
          if (!prev) return prev;
          const max = prev.accident.imageFiles.length - 1;
          return { ...prev, index: Math.min(max, prev.index + 1) };
        });
      }
      if (event.key === 'ArrowLeft') {
        setZoomState((prev) => {
          if (!prev) return prev;
          return { ...prev, index: Math.max(0, prev.index - 1) };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomState]);

  const openZoom = (accident, index = 0) => {
    setZoomState({ accident, index });
  };

  const lineLeft = LABEL_WIDTH + dayOffset * DAY_WIDTH;
  const ganttWidth = LABEL_WIDTH + TOTAL_DAYS * DAY_WIDTH + 120;

  return (
    <div className={`layout-root ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand">
          <Construction size={30} />
          {sidebarOpen && (
            <div>
              <strong>事故事例</strong>
              <strong>提案くん</strong>
            </div>
          )}
        </div>

        <nav className="menu">
          <button className={activeTab === 'simulation' ? 'is-active' : ''} onClick={() => setActiveTab('simulation')}>
            <CalendarDays size={17} />
            {sidebarOpen && '工程表'}
          </button>
          <button className={activeTab === 'library' ? 'is-active' : ''} onClick={() => setActiveTab('library')}>
            <BookOpen size={17} />
            {sidebarOpen && '災害事例ライブラリ'}
          </button>
        </nav>
      </aside>

      <main className="main-area">
        <header className="main-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <h1>{formatDate(currentDate)}</h1>
          </div>
          <div className="risk-pill">
            <AlertTriangle size={14} /> 稼働リスク: {currentSuggestions.length}件
          </div>
        </header>

        <div className="content-scroll">
          {activeTab === 'simulation' && (
            <div className="simulation-layout">
              <section className="panel">
                <h2>今日起こりそうな事故</h2>
                <p className="panel-note">
                  赤い縦ラインをドラッグして日付を変更してください。その日の工程に基づいた事例が表示されます。
                </p>

                <div className="gantt-shell" ref={ganttViewportRef}>
                  <div className="gantt-canvas" style={{ width: ganttWidth }}>
                    <div className="gantt-header">
                      <div className="gantt-header-label">工程</div>
                      <div className="gantt-header-track">
                        {dateTicks.map((tick) => (
                          <span key={tick.day} style={{ left: tick.day * DAY_WIDTH }}>
                            {tick.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className="today-line"
                      style={{ left: lineLeft }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                    >
                      <span>{formatDate(currentDate)}</span>
                      <i />
                    </div>

                    <div className="gantt-rows">
                      {SCHEDULE.map((task) => {
                        const isActive = activeTasks.some((active) => active.id === task.id);
                        const barLeft = LABEL_WIDTH + diffDays(CHART_START, task.startDate) * DAY_WIDTH;
                        const barWidth = Math.max(36, (diffDays(task.startDate, task.endDate) + 1) * DAY_WIDTH);
                        return (
                          <div key={task.id} className={`gantt-row ${isActive ? 'is-active' : ''}`}>
                            <div className="task-name">{task.task}</div>
                            <div className="task-bar" style={{ left: barLeft, width: barWidth }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel detail-list-panel">
                <h2>
                  <AlertTriangle size={18} /> 選択日の事例一覧（詳細・資料）
                </h2>
                <p className="list-summary">
                  事例 {currentSuggestions.length} 件 / 資料画像 合計 {currentSuggestionImageTotal} 枚
                </p>

                {currentSuggestions.length === 0 && (
                  <div className="empty-block">この日付に該当する重点警戒事例はありません。</div>
                )}

                <div className="incident-list">
                  {currentSuggestions.map((accident) => (
                    <article key={accident.id} className="incident-item">
                      <div className="incident-images">
                        <img
                          src={toImageUrl(accident, accident.imageFiles[0])}
                          alt={`${accident.title} 1`}
                          onClick={() => openZoom(accident, 0)}
                        />
                      </div>

                      <div className="incident-text">
                        <div className="meta">
                          <span>{accident.category}</span>
                          <span>#{accident.id}</span>
                        </div>
                        <p className="image-count">資料画像: {accident.imageFiles.length} 枚</p>
                        <h3>{accident.title}</h3>
                        <p>{accident.description}</p>
                        <div className="tags">
                          {accident.keywords.map((keyword) => (
                            <span key={keyword}>{keyword}</span>
                          ))}
                        </div>
                        <p className="countermeasure">再発防止策: {accident.countermeasure}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="library-layout">
              <section className="panel">
                <h2>災害事例ライブラリ</h2>
                <div className="library-grid">
                  {ACCIDENTS.map((accident) => (
                    <button
                      key={accident.id}
                      className={`library-card ${selectedAccident.id === accident.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedId(accident.id)}
                    >
                      <div className="meta">
                        <span>{accident.category}</span>
                        <span>#{accident.id}</span>
                      </div>
                      <h3>{accident.title}</h3>
                      <p>{accident.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel detail-list-panel">
                <h2>選択中の事例詳細・資料</h2>
                <article className="incident-item">
                  <div className="incident-images">
                    <img
                      src={toImageUrl(selectedAccident, selectedAccident.imageFiles[0])}
                      alt={`${selectedAccident.title} 1`}
                      onClick={() => openZoom(selectedAccident, 0)}
                    />
                  </div>
                  <div className="incident-text">
                    <p className="type">{selectedAccident.type}</p>
                    <h3>{selectedAccident.title}</h3>
                    <p>{selectedAccident.description}</p>
                    <p className="countermeasure">再発防止策: {selectedAccident.countermeasure}</p>
                  </div>
                </article>
              </section>
            </div>
          )}
        </div>
      </main>

      {zoomState && (
        <div className="image-modal" onClick={() => setZoomState(null)}>
          <div className="image-modal-inner" onClick={(event) => event.stopPropagation()}>
            <div className="image-modal-toolbar">
              <button
                className="image-modal-nav"
                onClick={() =>
                  setZoomState((prev) => (prev ? { ...prev, index: Math.max(0, prev.index - 1) } : prev))
                }
                disabled={zoomState.index === 0}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="image-modal-page">
                {zoomState.index + 1} / {zoomState.accident.imageFiles.length}
              </span>
              <button
                className="image-modal-nav"
                onClick={() =>
                  setZoomState((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: Math.min(prev.accident.imageFiles.length - 1, prev.index + 1),
                        }
                      : prev,
                  )
                }
                disabled={zoomState.index >= zoomState.accident.imageFiles.length - 1}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button className="image-modal-close" onClick={() => setZoomState(null)}>
              閉じる
            </button>
            <img
              src={toImageUrl(zoomState.accident, zoomState.accident.imageFiles[zoomState.index])}
              alt={`${zoomState.accident.title} ${zoomState.index + 1}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
