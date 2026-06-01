import React, { useEffect, useState, useRef, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAYS       = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const DAY_MAP    = [2,3,4,5,6,7,1];
const START_HOUR = 7;
const END_HOUR   = 21;
const SH         = 80;
const SNAP       = 30;

const COLORS = [
  {bg:'#1e3a5f',border:'#3b82f6',text:'#93c5fd'},
  {bg:'#14532d',border:'#22c55e',text:'#86efac'},
  {bg:'#3b0764',border:'#a855f7',text:'#d8b4fe'},
  {bg:'#7c2d12',border:'#f97316',text:'#fdba74'},
  {bg:'#831843',border:'#ec4899',text:'#f9a8d4'},
  {bg:'#134e4a',border:'#14b8a6',text:'#99f6e4'},
];
const CARD_COLORS = [
  'bg-blue-50 border-blue-200','bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200','bg-orange-50 border-orange-200','bg-pink-50 border-pink-200',
];
const DAYS_OPT = [
  {value:2,label:'Thứ 2'},{value:3,label:'Thứ 3'},{value:4,label:'Thứ 4'},
  {value:5,label:'Thứ 5'},{value:6,label:'Thứ 6'},{value:7,label:'Thứ 7'},{value:1,label:'Chủ nhật'},
];
const DAY_NAMES = {1:'Chủ nhật',2:'Thứ 2',3:'Thứ 3',4:'Thứ 4',5:'Thứ 5',6:'Thứ 6',7:'Thứ 7'};

const t2m = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const m2t = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00`;
const topPx = t => (t2m(t)-START_HOUR*60)/60*SH;
const hpx   = (s,e) => (t2m(e)-t2m(s))/60*SH;
const dow   = d => { const x=new Date(d).getDay(); return x===0?1:x+1; };
const snapY = (cy,grid) => {
  const rect=grid.getBoundingClientRect();
  const m=Math.round(((cy-rect.top+grid.scrollTop)/SH)*60/SNAP)*SNAP+START_HOUR*60;
  return Math.max(START_HOUR*60, Math.min(END_HOUR*60-30, m));
};
const getLabel = s => {
  if(s.class_type==='1v1'&&s.student_name) return `${s.student_name}: ${s.instrument||s.class_name}`;
  if(s.class_type==='group') return `Nhóm (${s.student_count||0} HV): ${s.instrument||s.class_name}`;
  return s.class_name||'Lớp học';
};
const getDIM = ym => {
  const[y,mo]=ym.split('-').map(Number); const d=[]; const dt=new Date(y,mo-1,1);
  while(dt.getMonth()===mo-1){d.push(new Date(dt).toISOString().split('T')[0]);dt.setDate(dt.getDate()+1);}
  return d;
};

// Lấy ngày đầu tuần (Thứ 2) từ offset tuần
const getWeekStart = (offsetWeeks = 0) => {
  const today = new Date();
  const day   = today.getDay(); // 0=CN
  const diff  = day === 0 ? -6 : 1 - day; // về Thứ 2
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offsetWeeks * 7);
  monday.setHours(0,0,0,0);
  return monday;
};

// Lấy mảng 7 ngày trong tuần từ weekStart
const getWeekDates = (weekStart) => {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
};

// Kiểm tra buổi học đã qua chưa
const isEventPast = (s, weekStart) => {
  const dowIndex = DAY_MAP.indexOf(Number(s.day_of_week)); // 0-6
  if (dowIndex === -1) return false;
  const classDate = new Date(weekStart);
  classDate.setDate(weekStart.getDate() + dowIndex);
  const [h,m] = (s.time_end || '00:00').split(':').map(Number);
  classDate.setHours(h, m, 0, 0);
  return classDate < new Date();
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

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({event, weekStart, onClose, onSave}) => {
  const [f, setF]     = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    if(event) setF({
      day_of_week: event.day_of_week,
      time_start:  event.time_start?.slice(0,5)||'08:00',
      time_end:    event.time_end?.slice(0,5)||'09:00',
    });
  },[event]);

  if(!event||!f) return null;
  const hc = e => setF({...f,[e.target.name]:e.target.value});

  const handleSave = async () => {
    if(t2m(f.time_end)<=t2m(f.time_start)){
      toast.error('Giờ kết thúc phải sau giờ bắt đầu!'); return;
    }
    setSaving(true);
    await onSave(event, f);
    setSaving(false);
    onClose();
  };

  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl"
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">{getLabel(event)}</h3>
            <p className="text-xs text-gray-400">{event.class_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl mb-4 text-sm text-gray-600">
          <p>📅 Hiện tại: <span className="font-medium">{DAY_NAMES[event.day_of_week]}</span> · {event.time_start?.slice(0,5)}–{event.time_end?.slice(0,5)}</p>
          {event.room_name&&<p>🚪 Phòng: <span className="font-medium">{event.room_name}</span></p>}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">📅 Đổi ngày dạy</label>
            <select name="day_of_week" value={f.day_of_week} onChange={hc} className="input-field">
              {DAYS_OPT.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">🕐 Giờ bắt đầu</label>
              <input type="time" name="time_start" value={f.time_start} onChange={hc} className="input-field"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">🕐 Giờ kết thúc</label>
              <input type="time" name="time_end" value={f.time_end} onChange={hc} className="input-field"/>
            </div>
          </div>
          <p className="text-xs text-orange-500 bg-orange-50 p-2 rounded-xl">
            ⚠️ Thay đổi sẽ được thông báo tới Admin để xác nhận
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving?'⏳ Đang lưu...':'💾 Lưu & Thông báo Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const MySchedule = () => {
  const { user }      = useAuth();
  const gridRef       = useRef(null);
  const gridWrapRef   = useRef(null);
  const indicatorRefs = useRef({});
  const dragData      = useRef(null);
  const rafRef        = useRef(null);

  const [schedules, setSchedules]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('week');
  const [editEv, setEditEv]         = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0); // ← navigation tuần
  const [selDate, setSelDate]       = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth]     = useState(new Date().toISOString().slice(0,7));

  // Tuần hiện tại đang xem
  const weekStart = getWeekStart(weekOffset);
  const weekDates = getWeekDates(weekStart);
  const weekEnd   = weekDates[6];

  const formatWeekLabel = () => {
    const s = weekStart.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric'});
    const e = weekEnd.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric',year:'numeric'});
    if (weekOffset === 0) return `Tuần này · ${s} – ${e}`;
    if (weekOffset === -1) return `Tuần trước · ${s} – ${e}`;
    if (weekOffset === 1) return `Tuần sau · ${s} – ${e}`;
    return `${s} – ${e}`;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const teacherData = await api.get(`/teachers/by-user/${user?.id}`);
      const teacher     = teacherData.row || teacherData;
      const teacherId   = teacher?.id;
      if (!teacherId) { setSchedules([]); return; }
      const d = await api.get(`/schedules?teacher_id=${teacherId}`);
      setSchedules(d.rows || []);
    } catch(e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(()=>{ if(user?.id) load(); },[load, user]);

  const showInd = useCallback((di,mins,dur)=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
    const el=indicatorRefs.current[di]; if(!el) return;
    el.style.top=`${topPx(m2t(mins))+1}px`;
    el.style.height=`${Math.max(hpx(m2t(mins),m2t(mins+dur))-4,20)}px`;
    el.style.display='block';
  },[]);
  const hideInd = useCallback(()=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
  },[]);

  const saveSchedule = useCallback(async(sched,f)=>{
    const ns=f.time_start.length===5?f.time_start+':00':f.time_start;
    const ne=f.time_end.length===5?f.time_end+':00':f.time_end;
    const newDow=Number(f.day_of_week);
    setSchedules(p=>p.map(s=>s.id===sched.id?{...s,day_of_week:newDow,time_start:ns,time_end:ne}:s));
    try{
      await api.put(`/schedules/${sched.id}`,{
        class_id:sched.class_id,teacher_id:sched.teacher_id,
        room_id:sched.room_id,day_of_week:newDow,
        time_start:ns,time_end:ne,type:sched.type,note:sched.note,
      });
      const dayLabel=DAYS_OPT.find(d=>d.value===newDow)?.label||'';
      await api.post('/notifications',{
        title:'📅 Giáo viên đổi lịch dạy',
        message:`${sched.teacher_name} đã đổi lịch "${getLabel(sched)}" sang ${dayLabel} ${f.time_start}–${f.time_end}`,
        type:'schedule_change',role:'admin',
      }).catch(()=>{});
      toast.success('Đã lưu và thông báo Admin!');
    }catch(e){ toast.error(e.message); load(); }
  },[load]);

  const applyDrop = useCallback(async(id,sched,newDow,newStart,newEnd)=>{
    setSchedules(p=>p.map(s=>s.id===id?{...s,day_of_week:newDow,time_start:newStart,time_end:newEnd}:s));
    try{
      await api.put(`/schedules/${id}`,{
        class_id:sched.class_id,teacher_id:sched.teacher_id,
        room_id:sched.room_id,day_of_week:newDow,
        time_start:newStart,time_end:newEnd,type:sched.type,note:sched.note,
      });
      const dayLabel=DAYS_OPT.find(d=>d.value===newDow)?.label||'';
      await api.post('/notifications',{
        title:'📅 Giáo viên đổi lịch dạy',
        message:`${sched.teacher_name} đã kéo lịch "${getLabel(sched)}" sang ${dayLabel} ${newStart.slice(0,5)}–${newEnd.slice(0,5)}`,
        type:'schedule_change',role:'admin',
      }).catch(()=>{});
      toast.success('Di chuyển lịch thành công!');
    }catch(e){ toast.error(e.message); load(); }
  },[load]);

  // Khi click vào event — chặn nếu đã qua
  const handleEventClick = useCallback((s) => {
    if (isEventPast(s, weekStart)) {
      toast.info('⏰ Không thể sửa lịch đã qua');
      return;
    }
    setEditEv(s);
  }, [weekStart]);

  const onDragStart = useCallback((e,s)=>{
    if (isEventPast(s, weekStart)) { e.preventDefault(); return; }
    dragData.current={id:s.id,dur:t2m(s.time_end)-t2m(s.time_start),sched:s};
    setDraggingId(s.id); e.dataTransfer.effectAllowed='move';
  },[weekStart]);
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

  const hours  = Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalH = hours.length*SH;
  const cmap   = {};
  schedules.forEach(s=>{if(!cmap[s.class_id])cmap[s.class_id]=COLORS[Object.keys(cmap).length%COLORS.length];});
  const byDay  = DAY_MAP.map(d=>layoutEvs(schedules.filter(s=>s.day_of_week===d)));
  const byDate = schedules.filter(s=>s.day_of_week===dow(selDate));

  return(
    <MainLayout title="Lịch dạy">
      <EditModal event={editEv} weekStart={weekStart} onClose={()=>setEditEv(null)} onSave={saveSchedule}/>

      <div className="mb-3">
        <p className="text-xs text-gray-400">✏️ Bấm vào lịch để sửa · 🖱️ Kéo thả trên máy tính · Không thể sửa lịch đã qua</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
        {[{key:'week',label:'📅 Lịch tuần'},{key:'date',label:'🗓️ Theo ngày'},{key:'month',label:'📆 Theo tháng'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all
              ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* ── Lịch tuần ── */}
          {tab==='week'&&(
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Navigation tuần */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <button onClick={()=>setWeekOffset(w=>w-1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Tuần trước
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{formatWeekLabel()}</p>
                  {weekOffset !== 0 && (
                    <button onClick={()=>setWeekOffset(0)}
                      className="text-xs text-primary-500 hover:text-primary-700 mt-0.5">
                      Về tuần này
                    </button>
                  )}
                </div>
                <button onClick={()=>setWeekOffset(w=>w+1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Tuần sau →
                </button>
              </div>

              <div ref={gridWrapRef} className="overflow-x-auto">
                <div style={{minWidth:500}}>
                  {/* Header ngày */}
                  <div className="grid border-b border-gray-100" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                    <div className="p-2 bg-gray-50"/>
                    {weekDates.map((date, di) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div key={di} className="py-2 bg-gray-50 border-l border-gray-100 text-center">
                          <p className={`text-xs font-semibold ${isToday?'text-primary-600':'text-gray-500'}`}>
                            {DAYS[di].replace('Thứ ','T').replace('Chủ nhật','CN')}
                          </p>
                          <p className={`text-sm font-bold mt-0.5 ${isToday?'text-primary-600':'text-gray-700'}`}>
                            {date.getDate()}
                          </p>
                          {isToday && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-0.5"/>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid */}
                  <div ref={gridRef} className="overflow-y-auto" style={{maxHeight:'70vh'}}>
                    <div className="grid" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                      {/* Cột giờ */}
                      <div className="relative" style={{height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full flex items-start justify-end pr-2"
                            style={{top:(h-START_HOUR)*SH,height:SH}}>
                            <span className="text-xs text-gray-400 -mt-2">{h}:00</span>
                          </div>
                        ))}
                      </div>

                      {/* Cột từng ngày */}
                      {weekDates.map((date, di) => {
                        const isToday   = date.toDateString() === new Date().toDateString();
                        const isPastDay = date < new Date(new Date().setHours(0,0,0,0));
                        return (
                          <div key={di}
                            className={`relative border-l border-gray-100 ${isPastDay?'bg-gray-900/5':''}`}
                            style={{height:totalH}}
                            onDragOver={e=>onDragOver(e,di)}
                            onDrop={e=>onDrop(e,di)}>
                            {/* Đường kẻ giờ */}
                            {hours.map(h=>(
                              <div key={h} className="absolute w-full border-t border-gray-50"
                                style={{top:(h-START_HOUR)*SH}}/>
                            ))}
                            {/* Highlight hôm nay */}
                            {isToday && (
                              <div className="absolute inset-0 bg-primary-500/5 pointer-events-none"/>
                            )}
                            {/* Drop indicator */}
                            <div ref={el=>indicatorRefs.current[di]=el}
                              className="absolute left-0 right-0 mx-0.5 rounded-lg border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-20"
                              style={{display:'none',opacity:0.6}}/>
                            {/* Events */}
                            {byDay[di].map(s=>{
                              const c       = cmap[s.class_id]||COLORS[0];
                              const t0      = topPx(s.time_start);
                              const h0      = Math.max(hpx(s.time_start,s.time_end),28);
                              const {lane=0,total=1} = s;
                              const pct     = 100/total;
                              const isPast  = isEventPast(s, weekStart);
                              return(
                                <div key={s.id}
                                  draggable={!isPast}
                                  onDragStart={e=>{e.stopPropagation();onDragStart(e,s);}}
                                  onDragEnd={onDragEnd}
                                  onClick={()=>handleEventClick(s)}
                                  className={`absolute rounded-xl border select-none overflow-hidden transition-all
                                    ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing hover:brightness-110'}`}
                                  style={{
                                    top:t0+1, height:h0-4,
                                    left:`calc(${lane*pct}%+2px)`,
                                    width:`calc(${pct}%-4px)`,
                                    backgroundColor:c.bg,
                                    borderColor:c.border,
                                    opacity:draggingId===s.id?0.35:isPast?0.45:1,
                                    zIndex:draggingId===s.id?1:5,
                                  }}>
                                  <div className="px-1.5 py-1 h-full flex flex-col">
                                    <p className="text-xs font-bold leading-tight truncate" style={{color:c.text}}>
                                      {isPast && '🔒 '}{getLabel(s)}
                                    </p>
                                    {h0>34&&<p className="text-xs" style={{color:c.text,opacity:0.8}}>
                                      {s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)}
                                    </p>}
                                    {h0>50&&<p className="text-xs truncate" style={{color:c.text,opacity:0.6}}>
                                      {s.room_name}
                                    </p>}
                                  </div>
                                  {draggingId===s.id&&(
                                    <div className="absolute inset-0 z-30" style={{background:'transparent'}}
                                      onDragOver={e=>onDragOver(e,di)} onDrop={e=>onDrop(e,di)}/>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {!schedules.length&&(
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-gray-400 text-sm">Chưa có lịch dạy</p>
                </div>
              )}
            </div>
          )}

          {/* ── Theo ngày ── */}
          {tab==='date'&&(
            <>
              <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)}
                className="input-field w-full mb-4"/>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selDate).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
                {!byDate.length?(
                  <p className="text-center text-gray-400 py-6">Không có lịch dạy ngày này</p>
                ):(
                  <div className="flex flex-col gap-3">
                    {[...byDate].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>{
                      const isPast = new Date(selDate) < new Date(new Date().setHours(0,0,0,0));
                      return(
                        <div key={s.id}
                          onClick={()=>{ if(isPast){toast.info('⏰ Không thể sửa lịch đã qua');return;} setEditEv(s); }}
                          className={`p-4 rounded-2xl border transition-transform ${CARD_COLORS[j%CARD_COLORS.length]}
                            ${isPast?'opacity-60 cursor-not-allowed':'cursor-pointer active:scale-95'}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-800">{getLabel(s)}</p>
                            <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-gray-600">
                              {isPast?'🔒 Đã qua':'✏️ Sửa'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">🕐 {s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}</p>
                          <p className="text-sm text-gray-500">🚪 {s.room_name}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Theo tháng ── */}
          {tab==='month'&&(
            <>
              <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)}
                className="input-field w-full mb-4"/>
              <div className="flex flex-col gap-3">
                {getDIM(selMonth).map(d=>{
                  const ds=schedules.filter(s=>s.day_of_week===dow(d));
                  if(!ds.length) return null;
                  const isPastDay = new Date(d) < new Date(new Date().setHours(0,0,0,0));
                  return(
                    <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
                        <p className={`text-sm font-semibold capitalize ${isPastDay?'text-gray-400':'text-gray-700'}`}>
                          {isPastDay&&'🔒 '}
                          {new Date(d).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}
                        </p>
                        <p className="text-xs text-gray-400">{ds.length} lớp</p>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {[...ds].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                          <div key={s.id}
                            onClick={()=>{ if(isPastDay){toast.info('⏰ Không thể sửa lịch đã qua');return;} setEditEv(s); }}
                            className={`p-3 rounded-xl border ${CARD_COLORS[j%CARD_COLORS.length]}
                              ${isPastDay?'opacity-60 cursor-not-allowed':'cursor-pointer active:scale-95'}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-gray-800">{getLabel(s)}</p>
                              <span className="text-xs text-gray-400">{isPastDay?'🔒':'✏️'}</span>
                            </div>
                            <p className="text-xs text-gray-600">{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)} · {s.room_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {getDIM(selMonth).every(d=>!schedules.filter(s=>s.day_of_week===dow(d)).length)&&(
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📆</p>
                    <p className="text-sm">Không có lịch dạy trong tháng này</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default MySchedule;