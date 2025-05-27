import React, { useState, useEffect, useRef } from 'react';
import 'nes.css/css/nes.min.css';
import './App.css'; // your grid-container + custom-big-btn styles

// sounds in src/
import clickSfx  from './click.mp3';
import finishSfx from './finish.mp3';

// question pools
import questions0    from './questionsTema0.json';
import questions1    from './questionsTema1.json';
import questions2    from './questionsTema2.json';
import questions3    from './questionsTema3.json';
import questions4    from './questionsTema4.json';
import questionsExam from './questionsExam.json';
import questionsCode from './questionsCode.json';

const temas = [
  { id: 0, questions: questions0, label: 'Tema 0' },
  { id: 1, questions: questions1, label: 'Tema 1' },
  { id: 2, questions: questions2, label: 'Tema 2' },
  { id: 3, questions: questions3, label: 'Tema 3' },
  { id: 4, questions: questions4, label: 'Tema 4' },
];

// build an initial results object *once* on first render
const makeEmptyResults = () => {
  const allTotal = temas.reduce((sum, t) => sum + t.questions.length, 0);
  const acc = { all: { correct: 0, total: allTotal } };
  temas.forEach(t => (acc[t.id] = { correct: 0, total: t.questions.length }));
  return acc;
};

export default function App() {
  const [page,      setPage]      = useState('start');
  const [questions, setQuestions] = useState([]);
  const [shuffled,  setShuffled]  = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [showImmed, setShowImmed] = useState(true);

  // **only** initialize results *once*
  const [results, setResults] = useState(makeEmptyResults);

  // audio setup
  const clickAudio  = useRef(new Audio(clickSfx));
  const finishAudio = useRef(new Audio(finishSfx));
  clickAudio.current.volume  = 0.5;
  finishAudio.current.volume = 0.7;
  const playClick  = () => { clickAudio.current.currentTime = 0;  clickAudio.current.play().catch(()=>{}); };
  const playFinish = () => { finishAudio.current.currentTime = 0; finishAudio.current.play().catch(()=>{}); };

  // when your question‐pool changes, reshuffle
  useEffect(() => {
    if (!questions.length) return;
    const pool = [...questions];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const sq = pool.map(q => {
      const order = q.options.map((_, i) => i);
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      const opts = order.map(i => q.options[i]);
      const corr = order.findIndex(i => i === q.correct);
      return { ...q, options: opts, correct: corr };
    });
    setShuffled(sq);
    setIdx(0);
    setAnswers(Array(sq.length).fill(null));
  }, [questions]);

  // ── MODE SWITCH ───────────────────────────────────────────────
  const startTopic = id => {
    playClick();
    setQuestions(temas.find(t => t.id === id).questions);
    setPage('quiz');
  };
  const startAll = () => {
    playClick();
    setQuestions(temas.flatMap(t => t.questions));
    setPage('quiz');
  };
  const startExam = () => {
    playClick();
    setQuestions(questionsExam);
    setPage('quiz');
  };
  const startCode = () => {
    playClick();
    setQuestions(questionsCode);
    setPage('quiz');
  };
  const goMenu = () => {
    playClick();
    setPage('start');
  };

  // ── SELECT ANSWER ─────────────────────────────────────────────
  const selectAnswer = i => {
    if (answers[idx] != null) return;     // only once
    playClick();
    setAnswers(a => {
      const c = [...a];
      c[idx] = i;
      return c;
    });
    // figure out which tema bucket we’re in
    let temaId = 'all';
    const single = temas.find(t => t.questions === questions);
    if (single) temaId = single.id;

    // **only** increment once per correct answer
    if (i === shuffled[idx].correct) {
      setResults(r => {
        const copy = { ...r };
        if (temaId !== 'all') {
          copy[temaId].correct += 0.5;
          copy.all.correct     += 0.5;
        } else {
          // “all” mode: only bump the overall once
          copy.all.correct += 1;
        }
        return copy;
      });
    }
  };

  // ── NAVIGATION ────────────────────────────────────────────────
  const prev = () => {
    if (idx > 0) {
      playClick();
      setIdx(idx - 1);
    }
  };
  const next = () => {
    if (idx < shuffled.length - 1) {
      playClick();
      setIdx(idx + 1);
    } else {
      playFinish();
      setTimeout(() => setPage('start'), 400);
    }
  };
  const toggleImmed = e => {
    playClick();
    setShowImmed(e.target.checked);
  };

  // ── START PAGE ───────────────────────────────────────────────
  if (page === 'start') {
    const themeStats = temas.map(t => {
      const { correct, total } = results[t.id];
      const pct = total ? Math.round((correct / total) * 100) : 0;
      return (
        <div key={t.id} style={{ textAlign: 'center' }}>
          <p className="nes-text is-primary">{t.label}</p>
          <p className="nes-text">{correct}/{total} ({pct}%)</p>
        </div>
      );
    });
    const { correct: cAll, total: tAll } = results.all;
    const pctAll = tAll ? Math.round((cAll / tAll) * 100) : 0;

    return (
      <div className="nes-container with-title is-centered" style={{ minHeight: '100vh', padding: '2rem' }}>
        <p className="title">Elige un tema o modo</p>

        <div className="grid-container">
          {temas.map(t => (
            <button key={t.id}
              className="nes-btn is-primary is-large custom-big-btn"
              onClick={() => startTopic(t.id)}
            >{t.id}</button>
          ))}
          <button className="nes-btn is-error is-large custom-big-btn1" onClick={startAll}>todo</button>
          <button className="nes-btn is-dark is-large custom-big-btn1" onClick={startCode}>code</button>
          <button className="nes-btn is-warning is-large custom-big-btn1" onClick={startExam}>exam</button>
        </div>

        <div style={{ marginTop: '2rem', width: '100%' }}>
          <p className="nes-text is-success">General: {cAll}/{tAll} ({pctAll}%)</p>
          <div className="grid-container" style={{ gap: '2rem', marginTop: '1rem' }}>
            {themeStats}
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ PAGE ────────────────────────────────────────────────
  const qItem = shuffled[idx] || { question: '', options: [], correct: 0, explanation: '' };
  const totalCount = shuffled.length;

  return (
    <div className="nes-container is-rounded" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="row between-xs middle-xs" style={{ marginBottom: '3rem' }}>
        <button className="nes-btn" onClick={goMenu}>Menú</button>
        <label>
          <input type="checkbox"
                 className="nes-checkbox is-light"
                 checked={showImmed}
                 onChange={toggleImmed} />
          <span>Mostrar inmediato</span>
        </label>
      </div>

      <section className="nes-container is-rounded" style={{ margin: '2rem 0', backgroundColor: '#ffeb3b' }}>
        <p className="title">Pregunta {idx + 1} / {totalCount}</p>
        <p style={{
          fontSize: '1.75rem',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>{qItem.question}</p>
      </section>

      <div className="row" style={{ gap: '1rem' }}>
        {qItem.options.map((opt, i) => {
          const answered = answers[idx] != null;
          const correct  = i === qItem.correct;
          const selected = i === answers[idx];
          let cls = 'nes-btn';
          if (!answered)    cls += ' is-primary';
          else if (correct) cls += ' is-success';
          else if (selected)cls += ' is-error';
          else               cls += ' is-disabled';
          return (
            <div key={i} className="col-xs-6">
              <button
                className={cls}
                style={{ width: '100%', height: '5rem', fontSize: '1.25rem' }}
                onClick={() => selectAnswer(i)}
              >{opt}</button>
            </div>
          );
        })}
      </div>

      {showImmed && answers[idx] != null && (
        <div style={{ margin: '1rem 0' }}>
          <div className="nes-balloon from-left is-dark">
            {answers[idx] === qItem.correct
              ? '✔️ ¡Correcto!'
              : `❌ Incorrecto. Respuesta: ${qItem.options[qItem.correct]}`}
          </div>
          {qItem.explanation && (
            <p className="nes-text is-primary" style={{ marginTop: '0.5rem', fontSize: '1.25rem' }}>
              {qItem.explanation}
            </p>
          )}
        </div>
      )}

      <div className="row between-xs middle-xs" style={{ marginTop: '2rem' }}>
        <button className="nes-btn" onClick={prev} disabled={idx === 0}>&lt;</button>
        <button className="nes-btn is-primary" onClick={next}>
          {idx < totalCount - 1 ? 'Siguiente' : 'Finalizar'}
        </button>
      </div>
    </div>
  );
}