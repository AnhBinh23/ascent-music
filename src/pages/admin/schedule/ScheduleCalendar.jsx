import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const DAYS       = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const DAY_MAP    = [2,3,4,5,6,7,1];
const START_HOUR = 6;
const END_HOUR   = 23;
const SH         = 60;
const SNAP       = 30;

const COLORS = [
  {bg:'#dbeafe',border:'#93c5fd',text:'#1e40af'},
  {bg:'#dcfce7',border:'#86efac',text:'#166534'},
  {bg:'#f3e8ff',border:'#d8b4fe',text:'#6b21a8'},
  {bg:'#ffedd5',border:'#fdba74',text:'#9a3412'},
  {bg:'#fce7f3',border:'#f9a8d4',text:'#9d174d'},
  {bg:'#ccfbf1',border:'#5eead4',text:'#134e4a'},
];
const CARD_COLORS = [
  'bg-blue-50 border-blue-200','bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200','bg-orange-50 border-orange-200','bg-pink-50 border-pink-200',
];
const DAYS_OPT = [
  {value:2,label:'Thứ 2'},{value:3,label:'Thứ 3'},{value:4,label:'Thứ 4'},
  {value:5,label:'Thứ 5'},{value:6,label:'Thứ 6'},{value:7,label:'Thứ 7'},{value:1,label:'Chủ nhật'},
];

const t2m = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const m2t = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00`;
const topPx = t => (t2m(t)-START_HOUR*60)/60*SH;
const hpx   = (s,e) => (t2m(e)-t2m(s))/60*SH;
const dow   = d => { const x=new Date(d).getDay(); return x===0?1:x+1; };
const snapY = (cy,grid) => {
  const rect=grid.getBoundingClientRect();
  const y=cy-rect.top+grid.scrollTop;
  const m=Math.round((y/SH)*60/SNAP)*SNAP+START_HOUR*60;
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
const getWeekStart = (offsetWeeks=0) => {
  const today=new Date(); const day=today.getDay();
  const diff=day===0?-6:1-day;
  const monday=new Date(today);
  monday.setDate(today.getDate()+diff+offsetWeeks*7);
  monday.setHours(0,0,0,0);
  return monday;
};
const getWeekDates = weekStart =>
  Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });

const dowToWeekIdx = dow => dow===1 ? 6 : dow-2;

const mergeWithOverrides = (baseSchedules, overrides, weekDates) => {
  const result = [];
  for (const sched of baseSchedules) {
    const wIdx       = dowToWeekIdx(sched.day_of_week);
    const actualDate = weekDates[wIdx]?.toISOString().split('T')[0];
    const override   = overrides.find(o =>
      String(o.schedule_id) === String(sched.id) && o.original_date?.slice(0,10) === actualDate
    );
    if (override?.status === 'cancelled') continue;
    if (override) {
      result.push({
        ...sched,
        day_of_week: override.new_day_of_week || sched.day_of_week,
        time_start:    override.new_time_start || sched.time_start,
        time_end:      override.new_time_end   || sched.time_end,
        override_id:   override.id,
        is_override:   true,
        actual_date:   actualDate,
      });
    } else {
      result.push({ ...sched, is_override: false, actual_date: actualDate });
    }
  }
  return result;
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
const EditModal = React.memo(({event,teachers,rooms,onClose,onSave,onDelete})=>{
  const [f, setF]       = useState(null);
  const [applyTo, setApplyTo] = useState('permanent');
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{
    if(event){
      setF({
        day_of_week: event.day_of_week,
        time_start:  event.time_start?.slice(0,5)||'08:00',
        time_end:    event.time_end?.slice(0,5)||'09:00',
        teacher_id:  event.teacher_id||'',
        room_id:     event.room_id||'',
      });
      setApplyTo('permanent');
    }
  },[event]);

  if(!event||!f) return null;
  const hc = e => setF({...f,[e.target.name]:e.target.value});

  const handleSave = async () => {
    setSaving(true);
    await onSave(event, f, applyTo);
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
            {event.is_override && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⚡ Lịch ngoại lệ tuần này</span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>

        {/* Áp dụng cho */}
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 mb-2">📅 Áp dụng thay đổi cho:</p>
          <div className="flex gap-2">
            <button onClick={()=>setApplyTo('week')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                ${applyTo==='week'?'bg-orange-500 text-white border-orange-500':'bg-white text-gray-600 border-gray-200'}`}>
              📆 Tuần này thôi
            </button>
            <button onClick={()=>setApplyTo('permanent')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                ${applyTo==='permanent'?'bg-primary-600 text-white border-primary-600':'bg-white text-gray-600 border-gray-200'}`}>
              🔁 Tất cả các tuần
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {applyTo==='week'
              ? '⚡ Chỉ đổi lịch ngày '+new Date(event.actual_date||'').toLocaleDateString('vi-VN')+', tuần sau trở về bình thường'
              : '🔁 Thay đổi lịch cố định cho tất cả các tuần'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">📅 Thứ</label>
            <select name="day_of_week" value={f.day_of_week} onChange={hc} className="input-field text-sm">
              {DAYS_OPT.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {applyTo==='week' && (
              <p className="text-xs text-orange-500">⚡ Đổi ngày/giờ tuần này thôi, tuần sau về lịch gốc</p>
            )}
          </div>
          {applyTo === 'week' && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              📅 Ngày dạy: <span className="font-semibold">{DAYS_OPT.find(d=>d.value===Number(f.day_of_week))?.label}</span>
              <p className="text-xs text-gray-400 mt-0.5">⚡ Chỉ đổi giờ, không đổi ngày</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">🕐 Bắt đầu</label>
              <input type="time" name="time_start" value={f.time_start} onChange={hc} className="input-field text-sm"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">🕐 Kết thúc</label>
              <input type="time" name="time_end" value={f.time_end} onChange={hc} className="input-field text-sm"/>
            </div>
          </div>
          {applyTo==='permanent'&&(
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">👨‍🏫 Giáo viên</label>
                <select name="teacher_id" value={f.teacher_id} onChange={hc} className="input-field text-sm">
                  <option value="">-- Chọn --</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">🚪 Phòng</label>
                <select name="room_id" value={f.room_id} onChange={hc} className="input-field text-sm">
                  <option value="">-- Chọn --</option>
                  {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {event.is_override && (
            <button onClick={()=>{ onDelete(event, 'override'); onClose(); }}
              className="px-3 py-2.5 rounded-xl bg-orange-50 text-orange-500 font-medium text-sm">
              ↩️ Về lịch gốc
            </button>
          )}
          {applyTo==='permanent'&&(
            <button onClick={()=>{ onDelete(event, 'permanent'); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 font-medium text-sm">🗑️ Xóa</button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-grow py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm disabled:opacity-50">
            {saving?'⏳...':'💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Main ──────────────────────────────────────────────────────────────────────
const ScheduleCalendar = () => {
  const navigate      = useNavigate();
  const gridRef       = useRef(null);
  const gridWrapRef   = useRef(null);
  const indicatorRefs = useRef({});
  const dragData      = useRef(null);
  const rafRef        = useRef(null);

  const [schedules, setSchedules]     = useState([]);
  const [overrides, setOverrides]     = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [rooms, setRooms]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('week');
  const [editEvent, setEditEvent]     = useState(null);
  const [draggingId, setDraggingId]   = useState(null);
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selDate, setSelDate]         = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth]       = useState(new Date().toISOString().slice(0,7));
  const [filterTeacher, setFilterTeacher] = useState('');

  const weekStart = getWeekStart(weekOffset);
  const weekDates = getWeekDates(weekStart);
  const weekEnd   = weekDates[6];

  const formatWeekLabel = () => {
    const s=weekStart.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric'});
    const e=weekEnd.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric',year:'numeric'});
    if(weekOffset===0) return `Tuần này · ${s} – ${e}`;
    if(weekOffset===-1) return `Tuần trước · ${s} – ${e}`;
    if(weekOffset===1) return `Tuần sau · ${s} – ${e}`;
    return `${s} – ${e}`;
  };

  const loadBase = useCallback(async()=>{
    try{
      setLoading(true);
      const[s,t,r]=await Promise.all([api.get('/schedules'),api.get('/teachers'),api.get('/rooms')]);
      setSchedules(s.rows||[]); setTeachers(t.rows||[]); setRooms(r.rows||[]);
    }catch(e){ toast.error(e.message); }
    finally{ setLoading(false); }
  },[]);

  const loadOverrides = useCallback(async()=>{
    const wStart = getWeekStart(weekOffset);
    const wDates = getWeekDates(wStart);
    try{
      const start = wDates[0].toISOString().split('T')[0];
      const end   = wDates[6].toISOString().split('T')[0];
      const res   = await api.get(`/schedule-overrides?start_date=${start}&end_date=${end}`);
      setOverrides(res.rows||[]);
    }catch(e){ console.error(e.message); }
  },[weekOffset]);

  useEffect(()=>{ loadBase(); },[loadBase]);
  useEffect(()=>{ loadOverrides(); },[loadOverrides]);

  const showInd = useCallback((dayIdx,mins,dur)=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
    const el=indicatorRefs.current[dayIdx]; if(!el) return;
    el.style.top=`${topPx(m2t(mins))+1}px`;
    el.style.height=`${Math.max(hpx(m2t(mins),m2t(mins+dur))-4,20)}px`;
    el.style.display='block';
  },[]);
  const hideInd = useCallback(()=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
  },[]);

  const applyDrop = useCallback(async(id,sched,newDow,newStart,newEnd)=>{
    setSchedules(p=>p.map(s=>s.id===id?{...s,day_of_week:newDow,time_start:newStart,time_end:newEnd}:s));
    try{
      await api.put(`/schedules/${id}`,{
        class_id:sched.class_id,teacher_id:sched.teacher_id,room_id:sched.room_id,
        day_of_week:newDow,time_start:newStart,time_end:newEnd,type:sched.type,note:sched.note,
      });
      toast.success('Di chuyển lịch thành công!');
    }catch(e){ toast.error(e.message); loadBase(); }
  },[loadBase]);

  const handleSave = useCallback(async(event, f, applyTo)=>{
    const ns=f.time_start.length===5?f.time_start+':00':f.time_start;
    const ne=f.time_end.length===5?f.time_end+':00':f.time_end;

    if(applyTo==='week'){
      try{
        await api.post('/schedule-overrides',{
          schedule_id:  event.id,
          original_date: event.actual_date,
          new_day_of_week: Number(f.day_of_week),
          new_time_start: ns,
          new_time_end:   ne,
          room_id:        f.room_id||null,
          status:         'rescheduled',
          note:           `Đổi lịch tuần ${event.actual_date}`,
        });
        toast.success('✅ Đã đổi lịch tuần này! Tuần sau sẽ trở về bình thường.');
        await loadOverrides();
      }catch(e){ toast.error(e.message); }
    } else {
      setSchedules(p=>p.map(s=>s.id===event.id?{...s,day_of_week:Number(f.day_of_week),time_start:ns,time_end:ne,teacher_id:f.teacher_id,room_id:f.room_id}:s));
      try{
        await api.put(`/schedules/${event.id}`,{
          class_id:event.class_id,teacher_id:f.teacher_id,room_id:f.room_id,
          day_of_week:Number(f.day_of_week),time_start:ns,time_end:ne,type:event.type,note:event.note,
        });
        toast.success('✅ Cập nhật lịch cố định thành công!');
        loadBase();
      }catch(e){ toast.error(e.message); loadBase(); }
    }
  },[loadBase, loadOverrides]);

  const handleDelete = useCallback(async(event, type)=>{
    if(type==='override'){
      try{
        await api.delete(`/schedule-overrides/${event.id}/${event.actual_date}`);
        toast.success('↩️ Đã về lịch bình thường!');
        await loadOverrides();
      }catch(e){ toast.error(e.message); }
    } else {
      if(!window.confirm('Xóa lịch học này vĩnh viễn?')) return;
      try{
        await api.delete(`/schedules/${event.id}`);
        setSchedules(p=>p.filter(s=>s.id!==event.id));
        toast.success('Đã xóa!');
      }catch(e){ toast.error(e.message); }
    }
  },[loadOverrides]);

  const onDragStart = useCallback((e,s)=>{
    dragData.current={id:s.id,dur:t2m(s.time_end)-t2m(s.time_start),sched:s};
    setDraggingId(s.id); e.dataTransfer.effectAllowed='move';
  },[]);
  const onDragEnd = useCallback(()=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideInd(); setDraggingId(null); dragData.current=null;
  },[hideInd]);
  const onDragOver = useCallback((e,di)=>{
    e.preventDefault(); const cy=e.clientY;
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

  const filtered = filterTeacher ? schedules.filter(s=>s.teacher_id===filterTeacher) : schedules;
  const weekSchedules = mergeWithOverrides(filtered, overrides, weekDates);
  const hours  = Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalH = hours.length*SH;
  const cmap   = {};
  filtered.forEach(s=>{if(!cmap[s.class_id])cmap[s.class_id]=COLORS[Object.keys(cmap).length%COLORS.length];});
  const byDay  = DAY_MAP.map(d=>layoutEvs(weekSchedules.filter(s=>s.day_of_week===d)));
  const byDate = filtered.filter(s=>s.day_of_week===dow(selDate));

  return(
    <MainLayout title="Lịch học">
      <EditModal event={editEvent} teachers={teachers} rooms={rooms}
        onClose={()=>setEditEvent(null)} onSave={handleSave} onDelete={handleDelete}/>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs text-gray-400 hidden sm:block">✏️ Bấm để sửa · 🖱️ Kéo thả = đổi cố định</p>
        <div className="flex items-center gap-2">
          <select value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}
            className="input-field text-sm w-auto">
            <option value="">Tất cả giáo viên</option>
            {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Button icon="➕" onClick={()=>navigate('/admin/schedule/new')}>Thêm lịch</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
        {[{key:'week',label:'📅 Lịch tuần'},{key:'date',label:'🗓️ Theo ngày'},{key:'month',label:'📆 Theo tháng'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all
              ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading?<div className="text-center py-20 text-gray-400">Đang tải...</div>:(
        <>
          {tab==='week'&&(
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Navigation tuần */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <button onClick={()=>setWeekOffset(w=>w-1)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ← Tuần trước
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{formatWeekLabel()}</p>
                  {weekOffset!==0&&(
                    <button onClick={()=>setWeekOffset(0)}
                      className="text-xs text-primary-500 hover:text-primary-700 mt-0.5">
                      Về tuần này
                    </button>
                  )}
                </div>
                <button onClick={()=>setWeekOffset(w=>w+1)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Tuần sau →
                </button>
              </div>

              <div ref={gridWrapRef} className="overflow-x-auto">
                <div style={{minWidth:560}}>
                  <div className="grid border-b border-gray-100" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                    <div className="p-2 bg-gray-50"/>
                    {weekDates.map((date,di)=>{
                      const isToday=date.toDateString()===new Date().toDateString();
                      const dateStr=date.toISOString().split('T')[0];
                      const hasOverride=overrides.some(o=>o.original_date?.slice(0,10)===dateStr);
                      return(
                        <div key={di} className="py-2 bg-gray-50 border-l border-gray-100 text-center">
                          <p className={`text-xs font-semibold ${isToday?'text-primary-600':'text-gray-500'}`}>
                            {DAYS[di]}
                          </p>
                          <p className={`text-sm font-bold mt-0.5 ${isToday?'text-primary-600':'text-gray-700'}`}>
                            {date.getDate()}/{date.getMonth()+1}
                          </p>
                          {isToday&&<div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-0.5"/>}
                          {hasOverride&&<div className="w-1.5 h-1.5 bg-orange-400 rounded-full mx-auto mt-0.5" title="Có lịch ngoại lệ"/>}
                        </div>
                      );
                    })}
                  </div>

                  <div ref={gridRef} className="overflow-y-auto" style={{maxHeight:'70vh'}}>
                    <div className="grid" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                      <div className="relative" style={{height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full flex items-start justify-end pr-1"
                            style={{top:(h-START_HOUR)*SH,height:SH}}>
                            <span className="text-xs text-gray-400 -mt-2">{String(h).padStart(2,'0')}:00</span>
                          </div>
                        ))}
                      </div>
                      {weekDates.map((date,di)=>{
                        const isToday=date.toDateString()===new Date().toDateString();
                        const isPastDay=date<new Date(new Date().setHours(0,0,0,0));
                        return(
                          <div key={di}
                            className={`relative border-l border-gray-100 ${isPastDay?'bg-black/[0.02]':''}`}
                            style={{height:totalH}}
                            onDragOver={e=>onDragOver(e,di)} onDrop={e=>onDrop(e,di)}>
                            {hours.map(h=>(
                              <div key={h} className="absolute w-full border-t border-gray-50"
                                style={{top:(h-START_HOUR)*SH}}/>
                            ))}
                            {isToday&&<div className="absolute inset-0 bg-primary-500/5 pointer-events-none"/>}
                            <div ref={el=>indicatorRefs.current[di]=el}
                              className="absolute left-0 right-0 mx-1 rounded-xl border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-20"
                              style={{display:'none',opacity:0.6}}/>
                            {byDay[di].map(s=>{
                              const c=cmap[s.class_id]||COLORS[0];
                              const t0=topPx(s.time_start);
                              const h0=Math.max(hpx(s.time_start,s.time_end),28);
                              const{lane=0,total=1}=s;
                              const pct=100/total;
                              return(
                                <div key={s.id}
                                  draggable
                                  onDragStart={e=>{e.stopPropagation();onDragStart(e,s);}}
                                  onDragEnd={onDragEnd}
                                  onClick={()=>setEditEvent(s)}
                                  className="absolute rounded-xl border cursor-grab active:cursor-grabbing select-none overflow-hidden hover:brightness-95 transition-all"
                                  style={{
                                    top:t0+1, height:h0-4,
                                    left:`calc(${lane * pct}% + 1px)`,
                                    width:`calc(${pct}% - 2px)`,
                                    backgroundColor: s.is_override ? '#fff7ed' : c.bg,
                                    borderColor:     s.is_override ? '#f97316' : c.border,
                                    borderStyle:     s.is_override ? 'dashed' : 'solid',
                                    opacity:draggingId===s.id?0.35:1,
                                    zIndex:draggingId===s.id?1:5,
                                  }}>
                                  <div className="px-1.5 py-0.5 h-full flex flex-col overflow-hidden">
                                    <p className="text-[11px] font-bold leading-tight truncate"
                                      style={{color: s.is_override ? '#c2410c' : c.text}}>
                                      {s.is_override && '⚡'}{getLabel(s)}
                                    </p>
                                    {h0>26&&<p className="text-[10px] truncate"
                                      style={{color: s.is_override ? '#ea580c' : c.text, opacity:0.8}}>
                                      {s.teacher_name}
                                    </p>}
                                    {h0>36&&<p className="text-[10px] truncate"
                                      style={{color: s.is_override ? '#ea580c' : c.text, opacity:0.7}}>
                                      {s.room_name||'Chưa xếp phòng'}
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
              {!weekSchedules.length&&(
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="text-gray-400">Chưa có lịch học nào</p>
                </div>
              )}
            </div>
          )}

          {tab==='date'&&(
            <>
              <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="input-field w-full mb-4"/>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selDate).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
                {!byDate.length?(
                  <p className="text-center text-gray-400 py-8">Không có lịch học ngày này</p>
                ):(
                  <div className="flex flex-col gap-3">
                    {[...byDate].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                      <div key={s.id} onClick={()=>setEditEvent({...s,actual_date:selDate})}
                        className={`p-4 rounded-2xl border cursor-pointer active:scale-95 transition-transform ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                        <p className="font-bold text-gray-800">{getLabel(s)}</p>
                        <p className="text-sm text-gray-600 mt-1">🕐 {s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}</p>
                        <p className="text-sm text-gray-500">👨‍🏫 {s.teacher_name} · 🚪 {s.room_name}</p>
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
                  const ds=filtered.filter(s=>s.day_of_week===dow(d));
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
                        {[...ds].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                          <div key={s.id} onClick={()=>setEditEvent({...s,actual_date:d})}
                            className={`p-3 rounded-xl border cursor-pointer active:scale-95 ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                            <p className="text-sm font-bold text-gray-800">{getLabel(s)}</p>
                            <p className="text-xs text-gray-600">
                              {s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)} · {s.teacher_name} · {s.room_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {getDIM(selMonth).every(d=>!filtered.filter(s=>s.day_of_week===dow(d)).length)&&(
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📆</p>
                    <p className="text-sm">Không có lịch học trong tháng này</p>
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
export default ScheduleCalendar;