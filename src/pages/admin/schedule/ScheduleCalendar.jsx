import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
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
const top  = t => (t2m(t)-START_HOUR*60)/60*SH;
const hpx  = (s,e) => (t2m(e)-t2m(s))/60*SH;
const dow  = d => { const x=new Date(d).getDay(); return x===0?1:x+1; };
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
const getDIM = ym=>{
  const[y,mo]=ym.split('-').map(Number); const d=[]; const dt=new Date(y,mo-1,1);
  while(dt.getMonth()===mo-1){d.push(new Date(dt).toISOString().split('T')[0]);dt.setDate(dt.getDate()+1);}
  return d;
};

// Overlap layout
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

// Edit Modal
const EditModal = React.memo(({event,teachers,rooms,onClose,onSave,onDelete})=>{
  const [f,setF]=useState(null);
  useEffect(()=>{ if(event) setF({day_of_week:event.day_of_week,time_start:event.time_start?.slice(0,5)||'08:00',time_end:event.time_end?.slice(0,5)||'09:00',teacher_id:event.teacher_id||'',room_id:event.room_id||''}); },[event]);
  if(!event||!f) return null;
  const hc=e=>setF({...f,[e.target.name]:e.target.value});
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div><h3 className="text-base font-bold text-gray-800">{getLabel(event)}</h3><p className="text-xs text-gray-400">{event.class_name}</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">📅 Thứ</label>
            <select name="day_of_week" value={f.day_of_week} onChange={hc} className="input-field text-sm">
              {DAYS_OPT.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">🕐 Bắt đầu</label><input type="time" name="time_start" value={f.time_start} onChange={hc} className="input-field text-sm"/></div>
            <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">🕐 Kết thúc</label><input type="time" name="time_end" value={f.time_end} onChange={hc} className="input-field text-sm"/></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">👨‍🏫 Giáo viên</label>
            <select name="teacher_id" value={f.teacher_id} onChange={hc} className="input-field text-sm">
              <option value="">-- Chọn --</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">🚪 Phòng</label>
            <select name="room_id" value={f.room_id} onChange={hc} className="input-field text-sm">
              <option value="">-- Chọn --</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={()=>{onDelete(event.id);onClose();}} className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 font-medium text-sm">🗑️ Xóa</button>
          <button onClick={()=>{onSave(event.id,event,f);onClose();}} className="flex-grow py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm">💾 Lưu</button>
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

  const [schedules, setSchedules]   = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('week');
  const [editEvent, setEditEvent]   = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [selDate, setSelDate]       = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth]     = useState(new Date().toISOString().slice(0,7));

  const load = useCallback(async()=>{
    try{
      setLoading(true);
      const[s,t,r]=await Promise.all([api.get('/schedules'),api.get('/teachers'),api.get('/rooms')]);
      setSchedules(s.rows||[]); setTeachers(t.rows||[]); setRooms(r.rows||[]);
    }catch(e){toast.error(e.message);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const showInd = useCallback((dayIdx,mins,dur)=>{
    Object.values(indicatorRefs.current).forEach(el=>{if(el)el.style.display='none';});
    const el=indicatorRefs.current[dayIdx]; if(!el) return;
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

  const handleSave = useCallback(async(id,sched,f)=>{
    const ns=f.time_start.length===5?f.time_start+':00':f.time_start;
    const ne=f.time_end.length===5?f.time_end+':00':f.time_end;
    setSchedules(p=>p.map(s=>s.id===id?{...s,day_of_week:Number(f.day_of_week),time_start:ns,time_end:ne,teacher_id:f.teacher_id,room_id:f.room_id}:s));
    try{
      await api.put(`/schedules/${id}`,{class_id:sched.class_id,teacher_id:f.teacher_id,room_id:f.room_id,day_of_week:Number(f.day_of_week),time_start:ns,time_end:ne,type:sched.type,note:sched.note});
      toast.success('Cập nhật thành công!'); load();
    }catch(e){toast.error(e.message);load();}
  },[load]);

  const handleDelete = async id=>{
    if(!window.confirm('Xóa lịch học này?')) return;
    try{await api.delete(`/schedules/${id}`);setSchedules(p=>p.filter(s=>s.id!==id));toast.success('Đã xóa!');}
    catch(e){toast.error(e.message);}
  };

  // Mouse DnD
  const onDragStart = useCallback((e,s)=>{
    dragData.current={id:s.id,dur:t2m(s.time_end)-t2m(s.time_start),sched:s};
    setDraggingId(s.id); e.dataTransfer.effectAllowed='move';
  },[]);
  const onDragEnd = useCallback(()=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideInd(); setDraggingId(null); dragData.current=null;
  },[hideInd]);
  const onDragOver = useCallback((e,dayIdx)=>{
    e.preventDefault();
    const cy=e.clientY;
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(()=>{
      if(!gridRef.current||!dragData.current)return;
      showInd(dayIdx,snapY(cy,gridRef.current),dragData.current.dur);
    });
  },[showInd]);
  const onDrop = useCallback(async(e,dayIdx)=>{
    e.preventDefault();
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    hideInd();
    if(!dragData.current)return;
    const{id,dur,sched}=dragData.current;
    const mins=snapY(e.clientY,gridRef.current);
    if(mins+dur>END_HOUR*60){toast.error('Vượt quá giờ kết thúc!');return;}
    setDraggingId(null); dragData.current=null;
    await applyDrop(id,sched,DAY_MAP[dayIdx],m2t(mins),m2t(mins+dur));
  },[hideInd,applyDrop]);

  // Computed
  const hours=Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalH=hours.length*SH;
  const cmap={}; schedules.forEach(s=>{if(!cmap[s.class_id])cmap[s.class_id]=COLORS[Object.keys(cmap).length%COLORS.length];});
  const byDay=DAY_MAP.map(d=>layoutEvs(schedules.filter(s=>s.day_of_week===d)));
  const byDate=schedules.filter(s=>s.day_of_week===dow(selDate));

  return(
    <MainLayout title="Lịch học">
      <EditModal event={editEvent} teachers={teachers} rooms={rooms}
        onClose={()=>setEditEvent(null)} onSave={handleSave} onDelete={handleDelete}/>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400 hidden sm:block">✏️ Bấm để sửa · 🖱️ Kéo thả để di chuyển</p>
        <Button icon="➕" onClick={()=>navigate('/admin/schedule/new')}>Thêm lịch học</Button>
      </div>

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
                    {DAYS.map(d=>(
                      <div key={d} className="p-2 bg-gray-50 border-l border-gray-100 text-center">
                        <p className="text-xs font-semibold text-gray-700">{d}</p>
                      </div>
                    ))}
                  </div>
                  <div ref={gridRef} className="overflow-y-auto" style={{maxHeight:'70vh'}}>
                    <div className="grid" style={{gridTemplateColumns:'56px repeat(7,1fr)'}}>
                      <div className="relative" style={{height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full flex items-start justify-end pr-2" style={{top:(h-START_HOUR)*SH,height:SH}}>
                            <span className="text-xs text-gray-400 -mt-2">{h}:00</span>
                          </div>
                        ))}
                      </div>
                      {DAYS.map((d,di)=>(
                        <div key={d} className="relative border-l border-gray-100" style={{height:totalH}}
                          onDragOver={e=>onDragOver(e,di)} onDrop={e=>onDrop(e,di)}>
                          {hours.map(h=><div key={h} className="absolute w-full border-t border-gray-50" style={{top:(h-START_HOUR)*SH}}/>)}
                          <div ref={el=>indicatorRefs.current[di]=el}
                            className="absolute left-0 right-0 mx-1 rounded-xl border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-20"
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
                                onClick={()=>setEditEvent(s)}
                                className="absolute rounded-xl border cursor-grab active:cursor-grabbing select-none overflow-hidden"
                                style={{
                                  top:t0+1,height:h0-4,
                                  left:`calc(${lane*pct}% + 2px)`,width:`calc(${pct}% - 4px)`,
                                  backgroundColor:c.bg,borderColor:c.border,
                                  opacity:draggingId===s.id?0.35:1,
                                  zIndex:draggingId===s.id?1:5,
                                }}>
                                <div className="px-1.5 py-1 h-full flex flex-col">
                                  <p className="text-xs font-bold leading-tight truncate" style={{color:c.text}}>{getLabel(s)}</p>
                                  {h0>34&&<p className="text-xs" style={{color:c.text,opacity:0.8}}>{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)}</p>}
                                  {h0>50&&<p className="text-xs truncate" style={{color:c.text,opacity:0.7}}>{s.teacher_name}</p>}
                                  {h0>66&&<p className="text-xs truncate" style={{color:c.text,opacity:0.6}}>{s.room_name}</p>}
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
              {!schedules.length&&<div className="text-center py-16"><p className="text-4xl mb-3">📅</p><p className="text-gray-400">Chưa có lịch học nào</p></div>}
            </div>
          )}

          {tab==='date'&&(
            <>
              <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="input-field w-full mb-4"/>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selDate).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
                {!byDate.length?<p className="text-center text-gray-400 py-8">Không có lịch học ngày này</p>:(
                  <div className="flex flex-col gap-3">
                    {byDate.sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                      <div key={s.id} onClick={()=>setEditEvent(s)}
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
                          <div key={s.id} onClick={()=>setEditEvent(s)}
                            className={`p-3 rounded-xl border cursor-pointer active:scale-95 ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                            <p className="text-sm font-bold text-gray-800">{getLabel(s)}</p>
                            <p className="text-xs text-gray-600">{s.time_start?.slice(0,5)}–{s.time_end?.slice(0,5)} · {s.teacher_name} · {s.room_name}</p>
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
export default ScheduleCalendar;