import React, { useEffect, useState, useRef, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAYS       = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const DAY_MAP    = [2,3,4,5,6,7,1];
const START_HOUR = 7;
const END_HOUR   = 21;
const SH         = 80;
const SNAP       = 30;

const COLORS = [
  {bg:'#dbeafe',border:'#93c5fd',text:'#1e40af'},
  {bg:'#dcfce7',border:'#86efac',text:'#166534'},
  {bg:'#f3e8ff',border:'#d8b4fe',text:'#6b21a8'},
  {bg:'#ffedd5',border:'#fdba74',text:'#9a3412'},
  {bg:'#fce7f3',border:'#f9a8d4',text:'#9d174d'},
];
const CARD_COLORS = [
  'bg-blue-50 border-blue-200','bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200','bg-orange-50 border-orange-200','bg-pink-50 border-pink-200',
];
const DAY_NAMES = {1:'Chủ nhật',2:'Thứ 2',3:'Thứ 3',4:'Thứ 4',5:'Thứ 5',6:'Thứ 6',7:'Thứ 7'};

const t2m = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const m2t = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00`;
const top  = t => (t2m(t)-START_HOUR*60)/60*SH;
const hpx  = (s,e) => (t2m(e)-t2m(s))/60*SH;
const dow  = d => { const x=new Date(d).getDay(); return x===0?1:x+1; };
const snapY = (cy,grid) => {
  const rect=grid.getBoundingClientRect();
  const m=Math.round(((cy-rect.top+grid.scrollTop)/SH)*60/SNAP)*SNAP+START_HOUR*60;
  return Math.max(START_HOUR*60, Math.min(END_HOUR*60-30, m));
};
const snapDayIdx = (cx, wrap) => {
  const rect=wrap.getBoundingClientRect();
  return Math.max(0,Math.min(6,Math.floor((cx-rect.left-56+wrap.scrollLeft)/((rect.width-56)/7))));
};
const getLabel = s => {
  if(s.class_type==='1v1'&&s.student_name) return `${s.student_name}: ${s.instrument||s.class_name}`;
  if(s.class_type==='group') return `Nhóm (${s.student_count||0} HV): ${s.instrument||s.class_name}`;
  return s.class_name||'Lớp học';
};
const getDIM = ym=>{
  const[y,mo]=ym.split('-').map(Number); const d=[]; const dt=new Date(y,mo-1,1);
  while(dt.getMonth()===mo-1){d.push(new Date(dt).toISOString().split('T')[0]);dt.setDate(dt.getDate()+1);}
  return d;
};

const layoutEvs = evs => {
  if(!evs.length) return [];
  const s=[...evs].sort((a,b)=>t2m(a.time_start)-t2m(b.time_start));
  const groups=[]; const seen=new Set();
  s.forEach(ev=>{
    if(seen.has(ev.id)) return;
    const g=[ev]; seen.add(ev.id); let i=0;
    while(i<g.length){
      const c=g[i]; const cs=t2m(c.time_start),ce=t2m(c.time_end);
      s.forEach(o=>{if(seen.has(o.id))return;if(cs<t2m(o.time_end)&&ce>t2m(o.time_start)){g.push(o);seen.add(o.id);}});
      i++;
    }
    groups.push(g);
  });
  const map={};
  groups.forEach(g=>{
    const gs=[...g].sort((a,b)=>t2m(a.time_start)-t2m(b.time_start));
    const lanes=[];
    gs.forEach(ev=>{
      const st=t2m(ev.time_start); let lane=-1;
      for(let i=0;i<lanes.length;i++){if(t2m(lanes[i][lanes[i].length-1].time_end)<=st){lane=i;break;}}
      if(lane===-1){lane=lanes.length;lanes.push([]);}
      lanes[lane].push(ev); map[ev.id]={lane,total:lanes.length};
    });
    g.forEach(ev=>{map[ev.id].total=lanes.length;});
  });
  return s.map(ev=>({...ev,...map[ev.id]}));
};

// Detail Modal
const DetailModal = ({event, onClose}) => {
  if(!event) return null;
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div><h3 className="text-base font-bold text-gray-800">{getLabel(event)}</h3><p className="text-xs text-gray-400">{event.class_name}</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="flex flex-col gap-2">
          {[
            {icon:'📅', label:'Ngày học',  value:DAY_NAMES[event.day_of_week]},
            {icon:'🕐', label:'Giờ học',   value:`${event.time_start?.slice(0,5)} – ${event.time_end?.slice(0,5)}`},
            {icon:'🚪', label:'Phòng học', value:event.room_name},
          ].map(r=>(
            <div key={r.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{r.icon}</span>
              <div><p className="text-xs text-gray-400">{r.label}</p><p className="text-sm font-medium text-gray-800">{r.value||'—'}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const MySchedule = () => {
  const gridRef       = useRef(null);
  const gridWrapRef   = useRef(null);
  const indicatorRefs = useRef({});
  const dragData      = useRef(null);
  const rafRef        = useRef(null);
  // Touch refs — no React state during drag to avoid re-render
  const touchState    = useRef({active:false,schedule:null,ghost:null,timer:null,startX:0,startY:0,cardEl:null});

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('week');
  const [detailEv, setDetailEv]   = useState(null);
  const [draggingId, setDraggingId] = useState(null); // mouse only
  const [selDate, setSelDate]     = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth]   = useState(new Date().toISOString().slice(0,7));

  const load = useCallback(async()=>{
    try{
      setLoading(true);
      const d=await api.get('/schedules');
      setSchedules(d.rows||[]);
    }catch(e){toast.error(e.message);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  // Indicator helpers
  const showInd = useCallback((di,mins,dur)=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
    const el=indicatorRefs.current[di]; if(!el) return;
    el.style.top=`${top(m2t(mins))+1}px`;
    el.style.height=`${Math.max(hpx(m2t(mins),m2t(mins+dur))-4,20)}px`;
    el.style.display='block';
  },[]);
  const hideInd = useCallback(()=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
  },[]);

  const applyDrop = useCallback(async(id,sched,newDow,newStart,newEnd)=>{
    setSchedules(p=>p.map(s=>s.id===id?{...s,day_of_week:newDow,time_start:newStart,time_end:newEnd}:s));
    try{
      await api.put(`/schedules/${id}`,{class_id:sched.class_id,teacher_id:sched.teacher_id,room_id:sched.room_id,day_of_week:newDow,time_start:newStart,time_end:newEnd,type:sched.type,note:sched.note});
      toast.success('Di chuyển lịch thành công!');
    }catch(e){toast.error(e.message);load();}
  },[load]);

  // ── Mouse DnD ───────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e,s)=>{
    dragData.current={id:s.id,dur:t2m(s.time_end)-t2m(s.time_start),sched:s};
    setDraggingId(s.id); e.dataTransfer.effectAllowed='move';
  },[]);
  const onDragEnd = useCallback(()=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideInd(); setDraggingId(null); dragData.current=null;
  },[hideInd]);
  const onDragOver = useCallback((e,di)=>{
    e.preventDefault();
    const cy=e.clientY;
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(()=>{
      if(!gridRef.current||!dragData.current)return;
      showInd(di,snapY(cy,gridRef.current),dragData.current.dur);
    });
  },[showInd]);
  const onDrop = useCallback(async(e,di)=>{
    e.preventDefault();
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideInd();
    if(!dragData.current)return;
    const{id,dur,sched}=dragData.current;
    const mins=snapY(e.clientY,gridRef.current);
    if(mins+dur>END_HOUR*60){toast.error('Vượt quá giờ kết thúc!');return;}
    setDraggingId(null); dragData.current=null;
    await applyDrop(id,sched,DAY_MAP[di],m2t(mins),m2t(mins+dur));
  },[hideInd,applyDrop]);

  // ── Touch DnD — native listeners, NO React state during drag ────────────────
  useEffect(()=>{
    const grid=gridRef.current;
    const wrap=gridWrapRef.current;
    if(!grid||!wrap) return;

    const cleanup=()=>{
      clearTimeout(touchState.current.timer);
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      // Remove ghost
      if(touchState.current.ghost){
        try{document.body.removeChild(touchState.current.ghost);}catch(_){}
        touchState.current.ghost=null;
      }
      // Restore card opacity via DOM
      if(touchState.current.cardEl){
        touchState.current.cardEl.style.opacity='';
        touchState.current.cardEl.style.transform='';
        touchState.current.cardEl=null;
      }
      hideInd();
      touchState.current.active=false;
      touchState.current.schedule=null;
    };

    const onMove=(e)=>{
      const ts=touchState.current;
      if(!ts.schedule) return;
      const t0=e.touches[0];
      const dx=Math.abs(t0.clientX-ts.startX);
      const dy=Math.abs(t0.clientY-ts.startY);
      if(!ts.active){
        if(dx>10||dy>10) clearTimeout(ts.timer);
        return;
      }
      e.preventDefault(); // works because passive:false
      // Move ghost
      if(ts.ghost){
        ts.ghost.style.left=`${t0.clientX-80}px`;
        ts.ghost.style.top=`${t0.clientY-30}px`;
      }
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      const cx=t0.clientX, cy=t0.clientY;
      rafRef.current=requestAnimationFrame(()=>{
        if(!ts.schedule) return;
        const di=snapDayIdx(cx,wrap);
        const dur=t2m(ts.schedule.time_end)-t2m(ts.schedule.time_start);
        showInd(di, snapY(cy,grid), dur);
      });
    };

    const onEnd=async(e)=>{
      const ts=touchState.current;
      if(!ts.schedule) return;
      const wasActive=ts.active;
      const sched=ts.schedule;
      const t0=e.changedTouches[0];
      const cx=t0.clientX, cy=t0.clientY;
      cleanup();
      if(wasActive&&sched){
        const di=snapDayIdx(cx,wrap);
        const mins=snapY(cy,grid);
        const dur=t2m(sched.time_end)-t2m(sched.time_start);
        if(mins+dur<=END_HOUR*60)
          await applyDrop(sched.id,sched,DAY_MAP[di],m2t(mins),m2t(mins+dur));
      } else if(sched){
        setDetailEv(sched);
      }
    };

    grid.addEventListener('touchmove', onMove, {passive:false});
    grid.addEventListener('touchend',  onEnd);
    grid.addEventListener('touchcancel', cleanup);
    return()=>{
      grid.removeEventListener('touchmove', onMove);
      grid.removeEventListener('touchend',  onEnd);
      grid.removeEventListener('touchcancel', cleanup);
    };
  },[hideInd,showInd,applyDrop]);

  // onTouchStart on card only — stores ref, NO setDraggingId
  const onTouchStart = useCallback((e,s)=>{
    const t0=e.touches[0];
    const cardEl=e.currentTarget;
    touchState.current={...touchState.current, schedule:s, active:false,
      startX:t0.clientX, startY:t0.clientY, cardEl};
    touchState.current.timer=setTimeout(()=>{
      touchState.current.active=true;
      // DOM feedback — no React state = no re-render = touch stays alive!
      if(touchState.current.cardEl){
        touchState.current.cardEl.style.opacity='0.4';
        touchState.current.cardEl.style.transform='scale(0.95)';
      }
      const ghost=document.createElement('div');
      ghost.style.cssText=`position:fixed;z-index:9999;pointer-events:none;background:#ea580c;color:white;border-radius:12px;padding:8px 12px;font-size:12px;font-weight:700;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 8px 24px rgba(0,0,0,.35);left:${t0.clientX-90}px;top:${t0.clientY-35}px;`;
      ghost.textContent=getLabel(s);
      document.body.appendChild(ghost);
      touchState.current.ghost=ghost;
    }, 350);
  },[]);

  // Computed
  const hours=Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalH=hours.length*SH;
  const cmap={}; schedules.forEach(s=>{if(!cmap[s.class_id])cmap[s.class_id]=COLORS[Object.keys(cmap).length%COLORS.length];});
  const byDay=DAY_MAP.map(d=>layoutEvs(schedules.filter(s=>s.day_of_week===d)));
  const byDate=schedules.filter(s=>s.day_of_week===dow(selDate));

  return(
    <MainLayout title="Lịch dạy">
      <DetailModal event={detailEv} onClose={()=>setDetailEv(null)}/>

      <div className="mb-4">
        <p className="text-xs text-gray-400">
          📱 Giữ 0.35s để kéo · ✏️ Bấm để xem chi tiết
        </p>
      </div>

      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[{key:'week',label:'📅 Tuần'},{key:'date',label:'🗓️ Ngày'},{key:'month',label:'📆 Tháng'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading?<div className="text-center py-20 text-gray-400">Đang tải...</div>:(
        <>
          {tab==='week'&&(
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div ref={gridWrapRef} className="overflow-x-auto">
                <div style={{minWidth:460}}>
                  <div className="grid border-b border-gray-100" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                    <div className="p-2 bg-gray-50"/>
                    {DAYS.map(d=>(
                      <div key={d} className="py-2 bg-gray-50 border-l border-gray-100 text-center">
                        <p className="text-xs font-semibold text-gray-700">{d.replace('Thứ ','T')}</p>
                      </div>
                    ))}
                  </div>
                  <div ref={gridRef} className="overflow-y-auto" style={{maxHeight:'72vh'}}>
                    <div className="grid" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                      <div className="relative" style={{height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full flex items-start justify-end pr-1" style={{top:(h-START_HOUR)*SH,height:SH}}>
                            <span className="text-xs text-gray-400 -mt-2">{h}</span>
                          </div>
                        ))}
                      </div>
                      {DAYS.map((d,di)=>(
                        <div key={d} className="relative border-l border-gray-100" style={{height:totalH}}
                          onDragOver={e=>onDragOver(e,di)} onDrop={e=>onDrop(e,di)}>
                          {hours.map(h=><div key={h} className="absolute w-full border-t border-gray-50" style={{top:(h-START_HOUR)*SH}}/>)}
                          <div ref={el=>indicatorRefs.current[di]=el}
                            className="absolute left-0 right-0 mx-0.5 rounded-lg border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-20"
                            style={{display:'none',opacity:0.6}}/>
                          {byDay[di].map(s=>{
                            const c=cmap[s.class_id]||COLORS[0];
                            const t0=top(s.time_start);
                            const h0=Math.max(hpx(s.time_start,s.time_end),28);
                            const{lane=0,total=1}=s;
                            const pct=100/total;
                            return(
                              <div key={s.id}
                                draggable
                                onDragStart={e=>{e.stopPropagation();onDragStart(e,s);}}
                                onDragEnd={onDragEnd}
                                onTouchStart={e=>onTouchStart(e,s)}
                                onClick={()=>setDetailEv(s)}
                                className="absolute rounded-lg border cursor-pointer select-none overflow-hidden"
                                style={{
                                  top:t0+1, height:h0-4,
                                  left:`calc(${lane*pct}% + 1px)`,
                                  width:`calc(${pct}% - 2px)`,
                                  backgroundColor:c.bg, borderColor:c.border,
                                  opacity:draggingId===s.id?0.35:1,
                                  zIndex:draggingId===s.id?1:5,
                                  touchAction:'none',
                                }}>
                                <div className="px-1 py-0.5 h-full flex flex-col">
                                  <p className="text-xs font-bold leading-tight truncate" style={{color:c.text,fontSize:10}}>{getLabel(s)}</p>
                                  {h0>32&&<p className="leading-tight" style={{color:c.text,opacity:0.8,fontSize:9}}>{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)}</p>}
                                </div>
                                {draggingId===s.id&&(
                                  <div className="absolute inset-0 z-30" style={{background:'transparent'}}
                                    onDragOver={e=>onDragOver(e,di)} onDrop={e=>onDrop(e,di)}/>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {!schedules.length&&<div className="text-center py-12"><p className="text-3xl mb-2">📅</p><p className="text-gray-400 text-sm">Chưa có lịch dạy</p></div>}
            </div>
          )}

          {tab==='date'&&(
            <>
              <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="input-field w-full mb-4"/>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selDate).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
                {!byDate.length?<p className="text-center text-gray-400 py-6">Không có lịch dạy ngày này</p>:(
                  <div className="flex flex-col gap-3">
                    {byDate.sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                      <div key={s.id} onClick={()=>setDetailEv(s)}
                        className={`p-4 rounded-2xl border cursor-pointer active:scale-95 transition-transform ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                        <p className="font-bold text-gray-800">{getLabel(s)}</p>
                        <p className="text-sm text-gray-600 mt-1">🕐 {s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}</p>
                        <p className="text-sm text-gray-500">🚪 {s.room_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab==='month'&&(
            <>
              <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)} className="input-field w-full mb-4"/>
              <div className="flex flex-col gap-3">
                {getDIM(selMonth).map(d=>{
                  const ds=schedules.filter(s=>s.day_of_week===dow(d));
                  if(!ds.length) return null;
                  return(
                    <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {new Date(d).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}
                        </p>
                        <p className="text-xs text-gray-400">{ds.length} lớp</p>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {ds.sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                          <div key={s.id} onClick={()=>setDetailEv(s)}
                            className={`p-3 rounded-xl border cursor-pointer active:scale-95 ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                            <p className="text-sm font-bold text-gray-800">{getLabel(s)}</p>
                            <p className="text-xs text-gray-600">{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)} · {s.room_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};
export default MySchedule;