import React, { useState, useEffect } from 'react';
import 'nes.css/css/nes.min.css';
import './App.css'; // custom grid-container & button sizing

// Import your JSON question sets
import questions1 from './questionsTema1.json';
import questions2 from './questionsTema2.json';
import questions3 from './questionsTema3.json';
import questions4 from './questionsTema4.json';
import questions5 from './questionsTema5.json';
import questionsExam from './questionsExam.json';
import questionsCode from './questionsCode.json';

const temas = [
  { id: 1, questions: questions1 },
  { id: 2, questions: questions2 },
  { id: 3, questions: questions3 },
  { id: 4, questions: questions4 },
  { id: 5, questions: questions5 }
];

export default function App() {
  const [page, setPage] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showImmediate, setShowImmediate] = useState(true);

  useEffect(() => {
    if (!questions.length) return;
    const arr = [...questions];
    // Shuffle questions
    for (let i = arr.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Shuffle options
    const sq = arr.map(q=>{
      const order = q.options.map((_,i)=>i);
      for (let k=order.length-1;k>0;k--) {
        const j = Math.floor(Math.random()*(k+1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      const opts = order.map(i=>q.options[i]);
      const corr = order.findIndex(i=>i===q.correct);
      return {...q, options: opts, correct: corr};
    });
    setShuffled(sq);
    setIdx(0);
    setAnswers(Array(sq.length).fill(null));
  },[questions]);

  const startTopic = id=>{ setQuestions(temas.find(t=>t.id===id).questions); setPage('quiz'); };
  const startAll = ()=>{ setQuestions(temas.flatMap(t=>t.questions)); setPage('quiz'); };
  const startExam = ()=>{ setQuestions(questionsExam); setPage('quiz'); };
  const startCode = ()=>{ setQuestions(questionsCode); setPage('quiz'); };

  const selectAnswer = i=>{
    if (answers[idx]!=null) return;
    setAnswers(a=>{const c=[...a]; c[idx]=i; return c;});
  };
  const next = ()=> idx<shuffled.length-1? setIdx(idx+1): setPage('start');
  const prev = ()=> idx>0 && setIdx(idx-1);

  if(page==='start'){
    return(
      <div className="nes-container with-title is-centered" style={{minHeight:'100vh',padding:'2rem'}}>
        <p className="title">Elige un tema o modo</p>
        <div className="grid-container">
          {temas.map(t=>(
            <button key={t.id} className="nes-btn is-primary is-large custom-big-btn" onClick={()=>startTopic(t.id)}>{t.id}</button>
          ))}
          <button className="nes-btn is-error is-large custom-big-btn1" onClick={startAll}>todo</button>
          <button className="nes-btn is-dark is-large custom-big-btn1" onClick={startCode}>code</button>
          <button className="nes-btn is-warning is-large custom-big-btn1" onClick={startExam}>exam</button>
        </div>
      </div>
    );
  }

  // QUIZ PAGE
  const q = shuffled[idx]||{question:'',options:[],correct:0,explanation:''};
  const total = shuffled.length;

  return(
    <div className="nes-container is-rounded" style={{minHeight:'100vh',padding:'1rem'}}>
      <div className="row between-xs middle-xs" style={{marginBottom:'5rem'}}>
        <button className="nes-btn" onClick={()=>setPage('start')}>Menú</button>
        <label>
          <input type="checkbox" className="nes-checkbox is-light" checked={showImmediate} onChange={e=>setShowImmediate(e.target.checked)}/>
          <span>Mostrar inmediato</span>
        </label>
      </div>

      <section className="nes-container is-rounded" style={{margin:'4rem 1',backgroundColor: 'yellow'}}>
        <p className="title">Pregunta {idx+1} / {total}</p>
        <p style={{fontSize:'2rem',lineHeight:1.4,fontStyle:'italic'}}>{q.question}</p>
      </section>

      <div className="row" style={{gap:'1rem'}}>
        {q.options.map((opt,i)=>{
          const answered = answers[idx]!=null;
          const corr = i===q.correct;
          const sel = i===answers[idx];
          let cls='nes-btn';
          if(!answered) cls+=' is-primary';
          else if(corr) cls+=' is-success';
          else if(sel) cls+=' is-error';
          else cls+=' is-disabled';
          return(
            <div key={i} className="col-xs-6">
              <button className={cls} style={{width:'100%',height:'6rem',fontSize:'1.5rem'}} onClick={()=>selectAnswer(i)}>{opt}</button>
            </div>
          );
        })}
      </div>

      {showImmediate && answers[idx]!=null && (
        <div>
          <div className="nes-balloon from-left is-dark" style={{margin:'1rem 0'}}>
            {answers[idx]===q.correct? '✔️ ¡Que suerte!': `❌ Que malo eres. Obvio que era: ${q.options[q.correct]}`}
          </div>
          { q.explanation && <p className="nes-text is-primary" style={{margin:'1rem 0',fontSize:'2rem'}}>{q.explanation}</p> }
        </div>
      )}

      <div className="row between-xs middle-xs" style={{marginTop:'2rem',fontSize:'2rem'}}>
        <button className="nes-btn" onClick={prev} disabled={idx===0}>&lt;</button>
        <button className="nes-btn is-primary" onClick={next}>{idx<total-1? 'Siguiente':'Finalizar'}</button>
      </div>
    </div>
  );
}

