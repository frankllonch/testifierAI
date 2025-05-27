import React, { useState, useEffect, useRef } from 'react';
import 'nes.css/css/nes.min.css';
import './App.css'; // custom grid-container & button sizing

// Retro click and finish sounds in src/assets/
import clickSfx   from './click.mp3';
import finishSfx  from './finish.mp3';

// Import your JSON question sets
import questions1    from './questionsTema1.json';
import questions2    from './questionsTema2.json';
import questions3    from './questionsTema3.json';
import questions4    from './questionsTema4.json';
import questions0    from './questionsTema0.json';
import questionsExam from './questionsExam.json';
import questionsCode from './questionsCode.json';

const temas = [
  { id: 0, questions: questions0 },
  { id: 1, questions: questions1 },
  { id: 2, questions: questions2 },
  { id: 3, questions: questions3 },
  { id: 4, questions: questions4 },
];

export default function App() {
  const [page,         setPage]         = useState('start');
  const [questions,    setQuestions]    = useState([]);
  const [shuffled,     setShuffled]     = useState([]);
  const [idx,          setIdx]          = useState(0);
  const [answers,      setAnswers]      = useState([]);
  const [showImmediate,setShowImmediate]= useState(true);

  // Audio refs
  const clickAudio  = useRef(new Audio(clickSfx));
  const finishAudio = useRef(new Audio(finishSfx));
  clickAudio.current.volume  = 0.8;
  finishAudio.current.volume = 0.7;

  // Shuffle logic on questions change
  useEffect(() => {
    if (!questions.length) return;
    const arr = [...questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const sq = arr.map(q => {
      const order = q.options.map((_,i)=>i);
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      const opts = order.map(i=>q.options[i]);
      const corr = order.findIndex(i=>i===q.correct);
      return { ...q, options: opts, correct: corr };
    });
    setShuffled(sq);
    setIdx(0);
    setAnswers(Array(sq.length).fill(null));
  }, [questions]);

  // Handlers with click sound
  const playClick  = () => { clickAudio.current.currentTime = 0;  clickAudio.current.play().catch(()=>{}); };
  const playFinish = () => { finishAudio.current.currentTime = 0; finishAudio.current.play().catch(()=>{}); };

  // Navigation
  const startTopic = id => { playClick(); setQuestions(temas.find(t=>t.id===id).questions); setPage('quiz'); };
  const startAll   = () => { playClick(); setQuestions(temas.flatMap(t=>t.questions)); setPage('quiz'); };
  const startExam  = () => { playClick(); setQuestions(questionsExam); setPage('quiz'); };
  const startCode  = () => { playClick(); setQuestions(questionsCode); setPage('quiz'); };

  const selectAnswer = i => {
    if (answers[idx] != null) return;
    playClick();
    setAnswers(a=>{ const c=[...a]; c[idx]=i; return c; });
  };

  const goMenu = () => { playClick(); setPage('start'); };

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
      // Finish quiz
      playFinish();
      setTimeout(() => setPage('start'), 400);
    }
  };

  const toggleImmediate = (e) => {
    playClick();
    setShowImmediate(e.target.checked);
  };

  // START PAGE
  if (page === 'start') {
    return (
      <div className="nes-container with-title is-centered" style={{ minHeight:'100vh', padding:'2rem' }}>
        <p className="title">Elige un tema o modo</p>
        <div className="grid-container">
          {temas.map(t=>(
            <button
              key={t.id}
              className="nes-btn is-primary is-large custom-big-btn"
              onClick={()=>startTopic(t.id)}
            >{t.id}</button>
          ))}
          <button className="nes-btn is-error is-large custom-big-btn1" onClick={startAll}>todo</button>
          <button className="nes-btn is-dark is-large custom-big-btn1" onClick={startCode}>code</button>
          <button className="nes-btn is-warning is-large custom-big-btn1" onClick={startExam}>exam</button>
        </div>
      </div>
    );
  }

  // QUIZ PAGE
  const q = shuffled[idx] || { question:'', options:[], correct:0, explanation:'' };
  const total = shuffled.length;

  return (
    <div className="nes-container is-rounded" style={{ minHeight:'100vh', padding:'1rem' }}>
      {/* Header */}
      <div className="row between-xs middle-xs" style={{ marginBottom:'5rem' }}>
        <button className="nes-btn" onClick={goMenu}>Menú</button>
        <label>
          <input
            type="checkbox"
            className="nes-checkbox is-light"
            checked={showImmediate}
            onChange={toggleImmediate}
          />
          <span>Mostrar inmediato</span>
        </label>
      </div>

      {/* Question */}
      <section className="nes-container is-rounded" style={{ margin:'4rem 1', backgroundColor:'yellow' }}>
        <p className="title">Pregunta {idx+1} / {total}</p>
        <p style={{
          fontSize:'2rem', lineHeight:1.4,
          fontStyle:'normal', whiteSpace:'pre-wrap', wordBreak:'break-word'
        }}>{q.question}</p>
      </section>

      {/* Options */}
      <div className="row" style={{ gap:'1rem' }}>
        {q.options.map((opt,i)=>{
          const answered = answers[idx] != null;
          const corr     = i === q.correct;
          const sel      = i === answers[idx];
          let cls = 'nes-btn';
          if (!answered)    cls += ' is-primary';
          else if (corr)    cls += ' is-success';
          else if (sel)     cls += ' is-error';
          else               cls += ' is-disabled';
          return (
            <div key={i} className="col-xs-6">
              <button
                className={cls}
                style={{ width:'100%', height:'6rem', fontSize:'1.5rem' }}
                onClick={()=>selectAnswer(i)}
              >{opt}</button>
            </div>
          );
        })}
      </div>

      {/* Immediate feedback */}
      {showImmediate && answers[idx] != null && (
        <div>
          <div className="nes-balloon from-left is-dark" style={{ margin:'1rem 0' }}>
            {answers[idx] === q.correct
              ? '✔️ ¡Que suerte!'
              : `❌ Que malo eres. Obvio que era: ${q.options[q.correct]}`}
          </div>
          {q.explanation && (
            <p className="nes-text is-primary" style={{ margin:'1rem 0', fontSize:'2rem' }}>
              {q.explanation}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="row between-xs middle-xs" style={{ marginTop:'2rem', fontSize:'2rem' }}>
        <button className="nes-btn" onClick={prev} disabled={idx===0}>&lt;</button>
        <button className="nes-btn is-primary" onClick={next}>
          {idx < total - 1 ? 'Siguiente' : 'Finalizar'}
        </button>
      </div>
    </div>
  );
}