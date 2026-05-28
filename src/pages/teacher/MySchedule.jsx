import React, { useEffect, useState, useRef, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const DAYS        = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const DAY_MAP     = [2,3,4,5,6,7,1];
const START_HOUR  = 7;
const END_HOUR    = 21;
const SLOT_HEIGHT = 80;
const SNAP_MINS   = 30;

const COLORS = [
  { bg:'#dbeafe', border:'#93c5fd', text:'#1e40af' },
  { bg:'#dcfce7', border:'#86efac', text:'#166534' },
  { bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8' },
  { bg:'#ffedd5', border:'#fdba74', text:'#9a3412' },
  { bg:'#fce7f3', border:'#f9a8d4', text:'#9d174d' },
];
const CARD_COLORS = [
  'bg-blue-50 border-blue-200','bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200','bg-orange-50 border-orange-200','bg-pink-50 border-pink-200',
];
const DAY_NAMES = {1:'Chủ nhật',2:'Thứ 2',3:'Thứ 3',4:'Thứ 4',5:'Thứ 5',6:'Thứ 6',7:'Thứ 7'};

const timeToMins   = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const minsToTime   = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00`;
const timeToTop    = t => (timeToMins(t)-START_HOUR*60)/60*SLOT_HEIGHT;
const timeToPx     = (s,e) => (timeToMins(e)-timeToMins(s))/60*SLOT_HEIGHT;
const getDayOfWeek = d => { const day=new Date(d).getDay(); return day===0?1:day+1; };
const getDaysInMonth = ym => {
  const [y,m]=ym.split('-').map(Number); const days=[]; const date=new Date(y,m-1,1);
  while(date.getMonth()===m-1){days.push(new Date(date).toISOString().split('T')[0]);date.setDate(date.getDate()+1);}
  return days;
};
const snap = (clientY, grid) => {
  const rect=grid.getBoundingClientRect();
  const relY=clientY-rect.top+grid.scrollTop;
  let mins=Math.round((relY/SLOT_HEIGHT)*60/SNAP_MINS)*SNAP_MINS+START_HOUR*60;
  return Math.max(START_HOUR*60, Math.min(END_HOUR*60-30, mins));
};
const getLabel = s => {
  if(s.class_type==='1v1'&&s.student_name) return `${s.student_name}: ${s.instrument||s.class_name}`;
  if(s.class_type==='group') return `Nhóm (${s.student_count||0} HV): ${s.instrument||s.class_name}`;
  return s.class_name||'Lớp học';
};

const layoutEvents = events => {
  if(!events.length) return [];
  const sorted=[...events].sort((a,b)=>timeToMins(a.time_start)-timeToMins(b.time_start));
  const groups=[]; const seen=new Set();
  sorted.forEach(ev=>{
    if(seen.has(ev.id)) return;
    const g=[ev]; seen.add(ev.id); let i=0;
    while(i<g.length){
      const cur=g[i]; const cs=timeToMins(cur.time_start),ce=timeToMins(cur.time_end);
      sorted.forEach(o=>{if(seen.has(o.id))return;if(cs<timeToMins(o.time_end)&&ce>timeToMins(o.time_start)){g.push(o);seen.add(o.id);}});
      i++;
    }
    groups.push(g);
  });
  const layout={};
  groups.forEach(g=>{
    const gs=[...g].sort((a,b)=>timeToMins(a.time_start)-timeToMins(b.time_start));
    const lanes=[];
    gs.forEach(ev=>{
      const start=timeToMins(ev.time_start); let lane=-1;
      for(let i=0;i<lanes.length;i++){if(timeToMins(lanes[i][lanes[i].length-1].time_end)<=start){lane=i;break;}}
      if(lane===-1){lane=lanes.length;lanes.push([]);}
      lanes[lane].push(ev); layout[ev.id]={lane,totalLanes:lanes.length};
    });
    g.forEach(ev=>{layout[ev.id].totalLanes=lanes.length;});
  });
  return sorted.map(ev=>({...ev,...layout[ev.id]}));
};

// ── Detail Modal ───────────────────────────────────────────────────────────────
const DetailModal = ({ event, onClose }) => {
  if(!event) return null;
  return (
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
            ...(event.class_type==='group'?[{icon:'👥', label:'Sĩ số', value:`${event.student_count} học viên`}]:[]),
          ].map(row=>(
            <div key={row.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{row.icon}</span>
              <div><p className="text-xs text-gray-400">{row.label}</p><p className="text-sm font-medium text-gray-800">{row.value||'—'}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const MySchedule = () => {
  const { user } = useAuth();
  const gridRef     = useRef(null);
  const gridWrapRef = useRef(null);
  const dragData    = useRef(null);
  const rafRef      = useRef(null);
  const indicatorRefs = useRef({});
  const touchRef    = useRef({ active:false, schedule:null, ghost:null, timer:null, startX:0, startY:0 });

  const [schedules, setSchedules]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('week');
  const [draggingId, setDraggingId] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/schedules');
      const all  = data.rows || [];
      // Filter by teacher
      if(user?.role === 'teacher') {
        const teacherRes = await api.get(`/teachers/by-user/${user.id}`).catch(()=>({row:null}));
        const teacherId  = teacherRes.row?.id;
        setSchedules(teacherId ? all.filter(s=>s.teacher_id===teacherId) : all);
      } else {
        setSchedules(all);
      }
    } catch(err){ toast.error(err.message); }
    finally{ setLoading(false); }
  },[user]);

  useEffect(()=>{ load(); },[load]);

  const applyDrop = useCallback(async (id, schedule, newDow, newStart, newEnd) => {
    setSchedules(p=>p.map(s=>s.id===id?{...s,day_of_week:newDow,time_start:newStart,time_end:newEnd}:s));
    try {
      await api.put(`/schedules/${id}`,{
        class_id:schedule.class_id, teacher_id:schedule.teacher_id,
        room_id:schedule.room_id, day_of_week:newDow,
        time_start:newStart, time_end:newEnd, type:schedule.type, note:schedule.note,
      });
      toast.success('Di chuyển lịch thành công!');
    } catch(err){ toast.error(err.message); load(); }
  },[load]);

  // DOM indicator helpers
  const showIndicator = useCallback((dayIdx, mins, dur) => {
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
    const el=indicatorRefs.current[dayIdx];
    if(!el) return;
    el.style.top=`${timeToTop(minsToTime(mins))+1}px`;
    el.style.height=`${Math.max(timeToPx(minsToTime(mins),minsToTime(mins+dur))-4,20)}px`;
    el.style.display='block';
  },[]);

  const hideAll = useCallback(()=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
  },[]);

  // Mouse DnD
  const onDragStart = useCallback((e,s)=>{
    dragData.current={id:s.id,duration:timeToMins(s.time_end)-timeToMins(s.time_start),schedule:s};
    setDraggingId(s.id); e.dataTransfer.effectAllowed='move';
  },[]);
  const onDragEnd = useCallback(()=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideAll(); setDraggingId(null); dragData.current=null;
  },[hideAll]);
  const onDragOver = useCallback((e,dayIdx)=>{
    e.preventDefault();
    const cy=e.clientY;
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(()=>{
      if(!gridRef.current||!dragData.current)return;
      const mins=snap(cy,gridRef.current);
      showIndicator(dayIdx,mins,dragData.current.duration);
    });
  },[showIndicator]);
  const onDrop = useCallback(async(e,dayIdx)=>{
    e.preventDefault();
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideAll();
    if(!dragData.current)return;
    const{id,duration,schedule}=dragData.current;
    const mins=snap(e.clientY,gridRef.current);
    if(mins+duration>END_HOUR*60){toast.error('Vượt quá giờ kết thúc!');return;}
    setDraggingId(null); dragData.current=null;
    await applyDrop(id,schedule,DAY_MAP[dayIdx],minsToTime(mins),minsToTime(mins+duration));
  },[hideAll,applyDrop]);

  // Touch DnD
  const getTouchDayIdx = useCallback((cx)=>{
    const wrap=gridWrapRef.current; if(!wrap)return 0;
    const rect=wrap.getBoundingClientRect();
    return Math.max(0,Math.min(6,Math.floor((cx-rect.left-56+wrap.scrollLeft)/((rect.width-56)/7))));
  },[]);
  const onTouchStart = useCallback((e,s)=>{
    const t=e.touches[0];
    touchRef.current={...touchRef.current,schedule:s,active:false,startX:t.clientX,startY:t.clientY};
    touchRef.current.timer=setTimeout(()=>{
      touchRef.current.active=true; setDraggingId(s.id);
      const ghost=document.createElement('div');
      ghost.style.cssText=`position:fixed;z-index:9999;pointer-events:none;background:#ea580c;color:white;border-radius:12px;padding:8px 12px;font-size:12px;font-weight:600;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 4px 20px rgba(0,0,0,.3);left:${t.clientX-80}px;top:${t.clientY-30}px;`;
      ghost.textContent=getLabel(s); document.body.appendChild(ghost); touchRef.current.ghost=ghost;
    },400);
  },[]);
  const onTouchMove = useCallback((e)=>{
    const t=e.touches[0];
    if(!touchRef.current.active){
      if(Math.abs(t.clientX-touchRef.current.startX)>8||Math.abs(t.clientY-touchRef.current.startY)>8)
        clearTimeout(touchRef.current.timer);
      return;
    }
    e.preventDefault();
    if(touchRef.current.ghost){touchRef.current.ghost.style.left=`${t.clientX-80}px`;touchRef.current.ghost.style.top=`${t.clientY-30}px`;}
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    const cx=t.clientX,cy=t.clientY;
    rafRef.current=requestAnimationFrame(()=>{
      if(!gridRef.current||!touchRef.current.schedule)return;
      const dayIdx=getTouchDayIdx(cx); const mins=snap(cy,gridRef.current);
      const dur=timeToMins(touchRef.current.schedule.time_end)-timeToMins(touchRef.current.schedule.time_start);
      showIndicator(dayIdx,mins,dur);
    });
  },[getTouchDayIdx,showIndicator]);
  const onTouchEnd = useCallback(async(e)=>{
    clearTimeout(touchRef.current.timer);
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideAll();
    if(touchRef.current.ghost){document.body.removeChild(touchRef.current.ghost);touchRef.current.ghost=null;}
    if(touchRef.current.active&&touchRef.current.schedule){
      const t=e.changedTouches[0];
      const dayIdx=getTouchDayIdx(t.clientX); const mins=snap(t.clientY,gridRef.current);
      const s=touchRef.current.schedule; const dur=timeToMins(s.time_end)-timeToMins(s.time_start);
      setDraggingId(null);
      if(mins+dur<=END_HOUR*60) await applyDrop(s.id,s,DAY_MAP[dayIdx],minsToTime(mins),minsToTime(mins+dur));
    } else if(touchRef.current.schedule){ setDetailEvent(touchRef.current.schedule); }
    touchRef.current.active=false; touchRef.current.schedule=null;
  },[hideAll,getTouchDayIdx,applyDrop]);

  const hours       = Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalHeight = hours.length*SLOT_HEIGHT;
  const colorMap    = {};
  schedules.forEach(s=>{if(!colorMap[s.class_id])colorMap[s.class_id]=COLORS[Object.keys(colorMap).length%COLORS.length];});
  const byDay           = DAY_MAP.map(dow=>layoutEvents(schedules.filter(s=>s.day_of_week===dow)));
  const schedulesByDate = schedules.filter(s=>s.day_of_week===getDayOfWeek(selectedDate));


  const GridEvent = useCallback(({s})=>{
    const color=colorMap[s.class_id]||COLORS[0];
    const top=timeToTop(s.time_start); const height=Math.max(timeToPx(s.time_start,s.time_end),28);
    const isDrag=draggingId===s.id; const {lane=0,totalLanes=1}=s; const pct=100/totalLanes;
    return (
      <div draggable
        onDragStart={e=>{e.stopPropagation();onDragStart(e,s);}}
        onDragEnd={onDragEnd}
        onTouchStart={e=>onTouchStart(e,s)}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={()=>setDetailEvent(s)}
        className="absolute rounded-xl border cursor-pointer select-none overflow-hidden"
        style={{top:top+1,height:height-4,left:`calc(${lane*pct}%+2px)`,width:`calc(${pct}%-4px)`,
          backgroundColor:color.bg,borderColor:color.border,opacity:isDrag?0.35:1,zIndex:isDrag?1:5,touchAction:'none',willChange:'transform'}}>
        <div className="px-1.5 py-1 h-full flex flex-col">
          <p className="text-xs font-bold leading-tight truncate" style={{color:color.text}}>{getLabel(s)}</p>
          {height>34&&<p className="text-xs" style={{color:color.text,opacity:0.8}}>{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)}</p>}
          {height>50&&<p className="text-xs truncate" style={{color:color.text,opacity:0.7}}>{s.room_name}</p>}
        </div>
      </div>
    );
  // eslint-disable-next-line
  },[draggingId,onDragStart,onDragEnd,onTouchStart,onTouchMove,onTouchEnd]);

  return (
    <MainLayout title="Lịch dạy">
      <DetailModal event={detailEvent} onClose={()=>setDetailEvent(null)}/>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">
          {schedules.length} lịch dạy · ✏️ Bấm xem chi tiết · 🖱️ Kéo thả di chuyển
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[{key:'week',label:'📅 Lịch tuần'},{key:'date',label:'🗓️ Theo ngày'},{key:'month',label:'📆 Theo tháng'}].map(t=>(
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
                <div style={{minWidth:560}}>
                  <div className="grid border-b border-gray-100" style={{gridTemplateColumns:'56px repeat(7,1fr)'}}>
                    <div className="p-2 bg-gray-50"/>
                    {DAYS.map(day=>(
                      <div key={day} className="p-2 bg-gray-50 border-l border-gray-100 text-center">
                        <p className="text-xs font-semibold text-gray-700">{day}</p>
                      </div>
                    ))}
                  </div>
                  <div ref={gridRef} className="overflow-y-auto" style={{maxHeight:'70vh'}}>
                    <div className="grid" style={{gridTemplateColumns:'56px repeat(7,1fr)'}}>
                      <div className="relative" style={{height:totalHeight}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full flex items-start justify-end pr-2" style={{top:(h-START_HOUR)*SLOT_HEIGHT,height:SLOT_HEIGHT}}>
                            <span className="text-xs text-gray-400 -mt-2">{h}:00</span>
                          </div>
                        ))}
                      </div>
                      {DAYS.map((day,dayIdx)=>(
                        <div key={day} className="relative border-l border-gray-100" style={{height:totalHeight}}>
                          {hours.map(h=><div key={h} className="absolute w-full border-t border-gray-50" style={{top:(h-START_HOUR)*SLOT_HEIGHT}}/>)}
                          <div ref={el=>indicatorRefs.current[dayIdx]=el}
                            className="absolute left-0 right-0 mx-1 rounded-xl border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-20"
                            style={{display:'none',opacity:0.55}}/>
                          {byDay[dayIdx].map(s=><GridEvent key={s.id} s={s}/>)}
                          {draggingId && (
                            <div className="absolute inset-0 z-30"
                              style={{background:'transparent'}}
                              onDragOver={e=>onDragOver(e,dayIdx)}
                              onDrop={e=>onDrop(e,dayIdx)}/>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {schedules.length===0&&<div className="text-center py-16"><p className="text-4xl mb-3">📅</p><p className="text-gray-400">Chưa có lịch dạy nào</p></div>}
            </div>
          )}

          {tab==='date'&&(
            <>
              <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="input-field w-full mb-4"/>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selectedDate).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
                {schedulesByDate.length===0?<p className="text-center text-gray-400 py-8">Không có lịch dạy ngày này</p>:(
                  <div className="flex flex-col gap-3">
                    {schedulesByDate.sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                      <div key={s.id} onClick={()=>setDetailEvent(s)}
                        className={`p-4 rounded-2xl border cursor-pointer ${CARD_COLORS[j%CARD_COLORS.length]}`}>
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
              <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="input-field w-full mb-4"/>
              <div className="flex flex-col gap-3">
                {getDaysInMonth(selectedMonth).map(d=>{
                  const dow=getDayOfWeek(d); const ds=schedules.filter(s=>s.day_of_week===dow);
                  if(!ds.length)return null;
                  return (
                    <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {new Date(d).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}
                        </p>
                        <p className="text-xs text-gray-400">{ds.length} lớp</p>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {ds.sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                          <div key={s.id} onClick={()=>setDetailEvent(s)}
                            className={`p-3 rounded-xl border cursor-pointer ${CARD_COLORS[j%CARD_COLORS.length]}`}>
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