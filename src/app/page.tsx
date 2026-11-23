'use client';

import { useMemo, useState } from 'react';

type Candidate = { name:string; team:string; rating:number; initials:string };
type Slot = { key:string; label:string; candidates:Candidate[] };

const teams = ['Франция','Реал Мадрид','Барселона'];
const slots: Slot[] = [
 {key:'GK',label:'Вратарь',candidates:[{name:'Фабьен Бартез',team:teams[0],rating:91,initials:'FB'},{name:'Икер Касильяс',team:teams[1],rating:94,initials:'IK'},{name:'Виктор Вальдес',team:teams[2],rating:90,initials:'VV'}]},
 {key:'LB',label:'Левый защитник',candidates:[{name:'Биксант Лизаразю',team:teams[0],rating:88,initials:'BL'},{name:'Роберто Карлос',team:teams[1],rating:94,initials:'RC'},{name:'Эрик Абидаль',team:teams[2],rating:90,initials:'EA'}]},
 {key:'CB1',label:'Центральный защитник',candidates:[{name:'Марсель Десайи',team:teams[0],rating:92,initials:'MD'},{name:'Серхио Рамос',team:teams[1],rating:96,initials:'SR'},{name:'Карлес Пуйоль',team:teams[2],rating:93,initials:'CP'}]},
 {key:'CB2',label:'Центральный защитник',candidates:[{name:'Лоран Блан',team:teams[0],rating:91,initials:'LB'},{name:'Пепе',team:teams[1],rating:93,initials:'P'},{name:'Жерар Пике',team:teams[2],rating:92,initials:'GP'}]},
 {key:'RB',label:'Правый защитник',candidates:[{name:'Лилиан Тюрам',team:teams[0],rating:92,initials:'LT'},{name:'Дани Карвахаль',team:teams[1],rating:91,initials:'DK'},{name:'Дани Алвес',team:teams[2],rating:95,initials:'DA'}]},
 {key:'CM1',label:'Центральный полузащитник',candidates:[{name:'Патрик Виейра',team:teams[0],rating:93,initials:'PV'},{name:'Лука Модрич',team:teams[1],rating:96,initials:'LM'},{name:'Хави',team:teams[2],rating:95,initials:'X'}]},
 {key:'CM2',label:'Центральный полузащитник',candidates:[{name:'Зинедин Зидан',team:teams[0],rating:96,initials:'ZZ'},{name:'Тони Кроос',team:teams[1],rating:95,initials:'TK'},{name:'Андрес Иньеста',team:teams[2],rating:96,initials:'AI'}]},
 {key:'CM3',label:'Опорный полузащитник',candidates:[{name:'Клод Макелеле',team:teams[0],rating:90,initials:'CM'},{name:'Каземиро',team:teams[1],rating:91,initials:'C'},{name:'Серхио Бускетс',team:teams[2],rating:92,initials:'SB'}]},
 {key:'LW',label:'Левый вингер',candidates:[{name:'Франк Рибери',team:teams[0],rating:92,initials:'FR'},{name:'Криштиану Роналду',team:teams[1],rating:98,initials:'CR'},{name:'Роналдиньо',team:teams[2],rating:96,initials:'R'}]},
 {key:'ST',label:'Нападающий',candidates:[{name:'Оливье Жиру',team:teams[0],rating:88,initials:'OJ'},{name:'Рауль',team:teams[1],rating:94,initials:'R'},{name:'Луис Суарес',team:teams[2],rating:96,initials:'LS'}]},
 {key:'RW',label:'Правый вингер',candidates:[{name:'Килиан Мбаппе',team:teams[0],rating:97,initials:'KM'},{name:'Гарет Бейл',team:teams[1],rating:94,initials:'GB'},{name:'Лионель Месси',team:teams[2],rating:98,initials:'LM'}]},
];

export default function Home() {
 const [step,setStep]=useState(0);
 const [picked,setPicked]=useState<Record<string,Candidate>>({});
 const [started,setStarted]=useState(false);
 const average=useMemo(()=>{const values=Object.values(picked);return values.length?Math.round(values.reduce((s,p)=>s+p.rating,0)/values.length):0},[picked]);
 const current=slots[step];
 const complete=Object.keys(picked).length===slots.length;
 function choose(player:Candidate){setPicked(p=>({...p,[current.key]:player}));if(step<slots.length-1)setStep(s=>s+1);}
 function reset(){setStep(0);setPicked({});setStarted(false);}
 return <main className="shell">
  <header className="top"><div className="brand"><span className="ball">⚽</span><span>RANDOM <b>FOOTBALL</b></span></div><span className="tag">WEB MVP · 0.1</span></header>
  <section className="hero"><p className="eyebrow">ТВОЯ ИСТОРИЯ. ТВОЯ КОМАНДА.</p><h1>Собери состав<br/><em>легенд футбола.</em></h1><p className="sub">Три команды. Одиннадцать позиций. Твой выбор.</p></section>
  {!started ? <section className="draft">
   <div className="draftHead"><div><p className="eyebrow">ШАГ {step+1} / 11</p><h2>{current.label}</h2></div><div className="counter">{Object.keys(picked).length}<span> / 11</span></div></div>
   <div className="progress"><div style={{width:`${Object.keys(picked).length/11*100}%`}}/></div>
   <div className="teamline">{teams.map(t=><span key={t}>{t}</span>)}</div>
   <div className="cards">{current.candidates.map((p,i)=><button className="player" key={p.name} onClick={()=>choose(p)}><div className="playerTop"><span className="rating">{p.rating}</span><span className="index">0{i+1}</span></div><div className="avatar">{p.initials}</div><h3>{p.name}</h3><p>{p.team}</p><span className="pick">ВЫБРАТЬ <b>↗</b></span></button>)}</div>
   <div className="bottomActions"><button className="ghost" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>← Назад</button><span>Выбери одного из трёх игроков</span><button className="ghost" onClick={()=>setStarted(true)} disabled={!complete}>Мой состав →</button></div>
  </section> : <section className="draft">
   <div className="draftHead"><div><p className="eyebrow">ТВОЯ КОМАНДА</p><h2>Состав собран</h2></div><div className="score">{average}<small>AVG</small></div></div>
   <div className="squad">{slots.map(s=>{const p=picked[s.key];return <div className="squadRow" key={s.key}><span>{s.label}</span><b>{p?.name}</b><strong>{p?.rating}</strong></div>})}</div>
   <div className="bottomActions"><button className="ghost" onClick={()=>setStarted(false)}>← К драфту</button><button className="primary" onClick={reset}>Новый драфт ↗</button></div>
  </section>}
  <footer><span>RANDOM FOOTBALL © 2026</span><span>Демо-данные · Рейтинги не подтверждены FIFA</span></footer>
 </main>;
}
