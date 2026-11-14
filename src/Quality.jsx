import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, ScanSearch, Upload } from 'lucide-react';
import { TRADES, CASES, SAMPLE_PHOTOS } from './qualityData';

// 工程表カテゴリ → 品質工種の対応（品質事例があるのは躯体系のみ）
export const CATEGORY_TO_TRADES = {
  '地下・基礎': ['rebar', 'concrete'],
  '躯体・コンクリ': ['rebar', 'concrete'],
  '鉄骨・躯体': ['steel'],
};

export const qualityTradesForTasks = (tasks) => {
  const set = new Set();
  tasks.forEach((task) => (CATEGORY_TO_TRADES[task.category] || []).forEach((t) => set.add(t)));
  return set;
};

const assetUrl = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path}`;
};

const caseImageUrl = (item) => assetUrl(`quality-illust/${item.trade}-${item.illust}.png`);

const SEV_CLASS = { '重大': 'high', '中': 'mid', '軽微': 'low' };

export function QualityCaseCard({ item }) {
  const [zoom, setZoom] = useState(false);
  const trade = TRADES[item.trade];
  const src = caseImageUrl(item);
  return (
    <article className="incident-item quality-card">
      <div className="incident-images">
        <img src={src} alt={`${item.title} イラスト`} onClick={() => setZoom(true)} />
      </div>
      <div className="incident-text">
        <div className="meta">
          <span className="trade-chip">{trade.label}</span>
          <span className="case-id">#{item.id}</span>
        </div>
        <p className="type">
          {item.type}／発見：{item.foundAt}／部位：{item.part}
          <span className={`sev sev-${SEV_CLASS[item.severity] || 'low'}`}>重大度：{item.severity}</span>
        </p>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <p>
          <strong>原因：</strong>
          {item.cause}
        </p>
        <p>
          <strong>是正：</strong>
          {item.correction}
        </p>
        <div className="tags">
          {item.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
        <p className="countermeasure">再発防止：{item.countermeasure}</p>
      </div>
      {zoom && (
        <div className="image-modal" onClick={() => setZoom(false)}>
          <div className="image-modal-inner" onClick={(event) => event.stopPropagation()}>
            <div className="image-modal-toolbar">
              <span className="image-modal-page">{item.title}</span>
            </div>
            <button className="image-modal-close" onClick={() => setZoom(false)}>
              閉じる
            </button>
            <img src={src} alt={item.title} />
          </div>
        </div>
      )}
    </article>
  );
}

// 日付をシードにした決定的シャッフル（同じ日は同じ並び、翌日は違う並びになる）
const seededShuffle = (list, seedText) => {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const rand = () => {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822519);
    seed = Math.imul(seed ^ (seed >>> 13), 3266489917);
    seed ^= seed >>> 16;
    return (seed >>> 0) / 4294967296;
  };
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const DAILY_PICK_COUNT = 10;

// 同じ工事期間でも日ごとに違う事例が出るよう、その日の「重点事例」を選ぶ
export const dailyCases = (pool, dateStr, count = DAILY_PICK_COUNT) => {
  if (pool.length <= count) return pool;
  return seededShuffle(pool, `quality-${dateStr}`).slice(0, count);
};

// 工程表タブの右カラム：品質不具合事例パネル（日替わりローテーション）
export function QualityPanel({ activeTasks, dateStr }) {
  const tradeIds = useMemo(() => qualityTradesForTasks(activeTasks), [activeTasks]);
  const pool = useMemo(() => CASES.filter((item) => tradeIds.has(item.trade)), [tradeIds]);
  const cases = useMemo(() => dailyCases(pool, dateStr || ''), [pool, dateStr]);
  return (
    <section className="panel detail-list-panel">
      <h2>
        <AlertTriangle size={18} /> 品質不具合事例（右）
      </h2>
      <p className="list-summary">
        対象工種：
        {tradeIds.size > 0 ? [...tradeIds].map((t) => TRADES[t].label).join('、') : 'なし'}
        {pool.length > cases.length
          ? `／全${pool.length}件から本日の重点${cases.length}件（日付でローテーション）`
          : `／事例 ${cases.length} 件`}
      </p>
      {cases.length === 0 && (
        <div className="empty-block">
          この日の工程に対応する品質事例はありません。品質事例があるのは躯体系の工程（地下・基礎／躯体・コンクリ／鉄骨・躯体）で、対象は鉄筋・コンクリート・鉄骨の3工種です。他工種は準備中です。
        </div>
      )}
      <div className="incident-list">
        {cases.map((item) => (
          <QualityCaseCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

// 写真で判別タブ（判別はデモ用決め打ち）
export function PhotoPanel() {
  const [photoSrc, setPhotoSrc] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [chosenTrade, setChosenTrade] = useState(null);

  const currentSamplePhoto = useMemo(() => {
    if (photoSrc?.kind !== 'sample') return null;
    return SAMPLE_PHOTOS.find((p) => p.id === photoSrc.id) || null;
  }, [photoSrc]);

  const previewSrc =
    photoSrc?.kind === 'upload' ? photoSrc.url : currentSamplePhoto ? assetUrl(currentSamplePhoto.src) : null;

  const photoCases = useMemo(
    () => (chosenTrade ? CASES.filter((item) => item.trade === chosenTrade) : []),
    [chosenTrade],
  );

  const resetResult = () => {
    setCandidates(null);
    setChosenTrade(null);
    setAnalyzing(false);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoSrc({ kind: 'upload', url: URL.createObjectURL(file), name: file.name });
    resetResult();
  };

  const runAnalysis = () => {
    if (!photoSrc || analyzing) return;
    setAnalyzing(true);
    setCandidates(null);
    setChosenTrade(null);
    window.setTimeout(() => {
      let result;
      if (photoSrc.kind === 'sample' && currentSamplePhoto) {
        result = currentSamplePhoto.candidates;
      } else {
        const order = ['rebar', 'concrete', 'steel'];
        const seed = (photoSrc.name || '').length % 3;
        const rotated = [...order.slice(seed), ...order.slice(0, seed)];
        const scores = [64, 51, 40];
        const notes = {
          rebar: '鉄筋らしき格子パターンを検出（決め打ち）',
          concrete: 'コンクリート面らしき領域を検出（決め打ち）',
          steel: '鋼材らしき要素を検出（決め打ち）',
        };
        result = rotated.map((trade, i) => ({ trade, score: scores[i], note: notes[trade] }));
      }
      setCandidates(result);
      setChosenTrade(result[0].trade);
      setAnalyzing(false);
    }, 900);
  };

  return (
    <div className="photo-layout">
      <section className="panel photo-panel">
        <h2>
          <ScanSearch size={18} /> 現場写真から工種を判別（品質）
        </h2>
        <p className="panel-note">
          写真を選ぶ（またはアップロードする）と、写っている工種の候補を提示します。候補から工種を選ぶと、その工種の品質不具合事例が下に表示されます。
          <strong>デモ版では判別は決め打ちです</strong>（本番ではLLMの画像認識で判別する想定）。
        </p>

        <div className="photo-picker">
          {SAMPLE_PHOTOS.map((photo) => (
            <button
              key={photo.id}
              className={`photo-thumb ${photoSrc?.kind === 'sample' && photoSrc.id === photo.id ? 'is-selected' : ''}`}
              onClick={() => {
                setPhotoSrc({ kind: 'sample', id: photo.id });
                resetResult();
              }}
            >
              <img src={assetUrl(photo.src)} alt={photo.label} />
              <span>{photo.label}</span>
            </button>
          ))}
          <label className={`photo-thumb photo-upload ${photoSrc?.kind === 'upload' ? 'is-selected' : ''}`}>
            <Upload size={26} />
            <span>自分の写真をアップロード</span>
            <input type="file" accept="image/*" onChange={handleUpload} hidden />
          </label>
        </div>

        {previewSrc && (
          <div className="photo-preview">
            <img src={previewSrc} alt="判別対象の写真" />
          </div>
        )}

        <div className="photo-actions">
          <button className="primary-button" onClick={runAnalysis} disabled={!photoSrc || analyzing}>
            {analyzing ? (
              <>
                <Loader2 size={16} className="spin" /> 判別中…
              </>
            ) : (
              <>
                <ScanSearch size={16} /> 工種を判別する
              </>
            )}
          </button>
          {!photoSrc && <span className="photo-hint">まず写真を選んでください</span>}
        </div>

        {candidates && (
          <div className="candidate-block">
            <h3>判別候補（デモ用決め打ち）</h3>
            {candidates.map((cand) => (
              <button
                key={cand.trade}
                className={`candidate-row ${chosenTrade === cand.trade ? 'is-selected' : ''}`}
                onClick={() => setChosenTrade(cand.trade)}
              >
                <span className="candidate-name">{TRADES[cand.trade].label}</span>
                <span className="candidate-bar">
                  <i style={{ width: `${cand.score}%` }} />
                </span>
                <span className="candidate-score">{cand.score}%</span>
                <span className="candidate-note">{cand.note}</span>
              </button>
            ))}
            <p className="panel-note">候補をクリックで切り替えられます。下に選択中の工種の事例を表示しています。</p>
          </div>
        )}
      </section>

      {chosenTrade && candidates && (
        <section className="panel detail-list-panel">
          <h2>
            {TRADES[chosenTrade].label}の不具合事例（{photoCases.length}件）
          </h2>
          <div className="incident-list">
            {photoCases.map((item) => (
              <QualityCaseCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// 品質事例ライブラリタブ
export function QualityLibraryPanel() {
  const [trade, setTrade] = useState('all');
  const [selectedId, setSelectedId] = useState(CASES[0].id);
  const list = useMemo(() => (trade === 'all' ? CASES : CASES.filter((c) => c.trade === trade)), [trade]);
  const selected = CASES.find((c) => c.id === selectedId) || CASES[0];
  return (
    <div className="library-layout">
      <section className="panel library-panel">
        <h2>品質不具合事例ライブラリ</h2>
        <div className="filter-chips">
          <button className={trade === 'all' ? 'is-active' : ''} onClick={() => setTrade('all')}>
            全て（{CASES.length}）
          </button>
          {Object.values(TRADES).map((t) => (
            <button key={t.id} className={trade === t.id ? 'is-active' : ''} onClick={() => setTrade(t.id)}>
              {t.label}（{CASES.filter((c) => c.trade === t.id).length}）
            </button>
          ))}
        </div>
        <div className="library-grid">
          {list.map((item) => (
            <button
              key={item.id}
              className={`library-card ${selected.id === item.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="meta">
                <span>{TRADES[item.trade].label}</span>
                <span>#{item.id}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="panel detail-list-panel">
        <h2>選択中の事例詳細・資料</h2>
        <div className="incident-list">
          <QualityCaseCard item={selected} />
        </div>
      </section>
    </div>
  );
}
