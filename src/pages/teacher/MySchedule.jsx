import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = ['Thá»© 2','Thá»© 3','Thá»© 4','Thá»© 5','Thá»© 6','Thá»© 7','Chá»§ nháº­t'];
const DAY_MAP = [2,3,4,5,6,7,1];
const DAYS_OPT = [
  {value:2,label:'Thá»© 2'},{value:3,label:'Thá»© 3'},{value:4,label:'Thá»© 4'},
  {value:5,label:'Thá»© 5'},{value:6,label:'Thá»© 6'},{value:7,label:'Thá»© 7'},{value:1,label:'Chá»§ nháº­t'},
];
const START_HOUR = 6, END_HOUR = 23, SH = 60;
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

const t2m = t => { const[h,m]=String(t||'08:00').split(':').map(Number); return h*60+(m||0); };

const topPx = t => (t2m(t)-START_HOUR*60)/60*SH;
const hpx = (s,e) => (t2m(e)-t2m(s))/60*SH;
const dow = d => { const x=new Date(d).getDay(); return x===0?1:x+1; };
const dowToWeekIdx = d => d===1?6:d-2;

const getWeekStart = (offset=0) => {
  const today=new Date(); const day=today.getDay();
  const diff=day===0?-6:1-day;
  const monday=new Date(today);
  monday.setDate(today.getDate()+diff+offset*7);
  monday.setHours(0,0,0,0);
  return monday;
};
const getWeekDates = ws => Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;});
const getDIM = ym => {
  const[y,mo]=ym.split('-').map(Number); const d=[]; const dt=new Date(y,mo-1,1);
  while(dt.getMonth()===mo-1){d.push(new Date(dt).toISOString().split('T')[0]);dt.setDate(dt.getDate()+1);}
  return d;
};

const getLabel = s => {
  if(s.class_type==='1v1'&&s.student_name) return `${s.student_name}: ${s.instrument||s.class_name}`;
  if(s.class_type==='group') return `NhÃ³m (${s.student_count||0} HV): ${s.instrument||s.class_name}`;
  return s.class_name||'Lá»›p há»c';
};

const mergeWithOverrides = (baseSchedules, overrides, weekDates) => {
  const result = [];
  for (const sched of baseSchedules) {
    const wIdx = dowToWeekIdx(sched.day_of_week);
    const actualDate = weekDates[wIdx]?.toISOString().split('T')[0];
    const override = overrides.find(o =>
      String(o.schedule_id)===String(sched.id) && o.original_date?.slice(0,10)===actualDate
    );
    if (override?.status==='cancelled') continue;
    if (override) {
      result.push({
        ...sched,
        day_of_week: override.new_day_of_week||sched.day_of_week,
        time_start: override.new_time_start||sched.time_start,
        time_end: override.new_time_end||sched.time_end,
        override_id: override.id, is_override: true, actual_date: actualDate,
      });
    } else {
      result.push({...sched, is_override: false, actual_date: actualDate});
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

const EditModal = React.memo(({event,rooms,onClose,onSave,onDelete})=>{
  const [f,setF] = useState(null);
  const [applyTo,setApplyTo] = useState('permanent');
  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    if(event){
      setF({
        day_of_week: event.day_of_week,
        time_start: event.time_start?.slice(0,5)||'08:00',
        time_end: event.time_end?.slice(0,5)||'09:00',
        room_id: event.room_id||'',
      });
      setApplyTo('permanent');
    }
  },[event]);

  if(!event||!f) return null;
  const hc = e => setF({...f,[e.target.name]:e.target.value});

  const handleSave = async () => {
    setSaving(true);
    await onSave(event,f,applyTo);
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
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">âš¡ Lá»‹ch ngoáº¡i lá»‡ tuáº§n nÃ y</span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">âœ•</button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 mb-2">Ãp dá»¥ng thay Ä‘á»•i cho:</p>
          <div className="flex gap-2">
            <button onClick={()=>setApplyTo('week')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                ${applyTo==='week'?'bg-orange-500 text-white border-orange-500':'bg-white text-gray-600 border-gray-200'}`}>
              ðŸ“† Tuáº§n nÃ y thÃ´i
            </button>
            <button onClick={()=>setApplyTo('permanent')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                ${applyTo==='permanent'?'bg-primary-600 text-white border-primary-600':'bg-white text-gray-600 border-gray-200'}`}>
              ðŸ” Táº¥t cáº£ cÃ¡c tuáº§n
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {applyTo==='week'
              ? `âš¡ Chá»‰ Ä‘á»•i lá»‹ch ngÃ y ${new Date(event.actual_date||'').toLocaleDateString('vi-VN')}, tuáº§n sau trá»Ÿ vá» bÃ¬nh thÆ°á»ng`
              : 'ðŸ” Thay Ä‘á»•i lá»‹ch cá»‘ Ä‘á»‹nh cho táº¥t cáº£ cÃ¡c tuáº§n'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Thá»©</label>
            <select name="day_of_week" value={f.day_of_week} onChange={hc} className="input-field text-sm">
              {DAYS_OPT.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Báº¯t Ä‘áº§u</label>
              <input type="time" name="time_start" value={f.time_start} onChange={hc} className="input-field text-sm"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Káº¿t thÃºc</label>
              <input type="time" name="time_end" value={f.time_end} onChange={hc} className="input-field text-sm"/>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">PhÃ²ng</label>
            <select name="room_id" value={f.room_id} onChange={hc} className="input-field text-sm">
              <option value="">-- Chá»n --</option>
              {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {event.is_override && (
            <button onClick={()=>{onDelete(event,'override');onClose();}}
              className="px-3 py-2.5 rounded-xl bg-orange-50 text-orange-500 font-medium text-sm">
              â†©ï¸ Vá» lá»‹ch gá»‘c
            </button>
          )}
          {applyTo==='permanent'&&(
            <button onClick={()=>{onDelete(event,'permanent');onClose();}}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 font-medium text-sm">ðŸ—‘ï¸ XÃ³a</button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-grow py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm disabled:opacity-50">
            {saving?'â³...':'ðŸ’¾ LÆ°u'}
          </button>
        </div>
      </div>
    </div>
  );
});

const MySchedule = () => {
  const { user } = useAuth();
  const gridRef = useRef(null);

  const [teacherId, setTeacherId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editEvent, setEditEvent] = useState(null);
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth] = useState(new Date().toISOString().slice(0,7));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({class_id:'',day_of_week:2,time_start:'08:00',time_end:'09:00',room_id:''});
  const [makeups, setMakeups] = useState([]);
  const [students, setStudents] = useState([]);
  const [showMakeup, setShowMakeup] = useState(false);
  const [savingMakeup, setSavingMakeup] = useState(false);
  const [makeupForm, setMakeupForm] = useState({
    student_id:'',class_id:'',original_date:'',makeup_date:'',
    makeup_time_start:'08:00',makeup_time_end:'09:00',room_id:'',note:'',
  });

  const weekStart = getWeekStart(weekOffset);
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];

  const formatWeekLabel = () => {
    const s=weekStart.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric'});
    const e=weekEnd.toLocaleDateString('vi-VN',{day:'numeric',month:'numeric',year:'numeric'});
    if(weekOffset===0) return `Tuáº§n nÃ y Â· ${s} â€“ ${e}`;
    if(weekOffset===-1) return `Tuáº§n trÆ°á»›c Â· ${s} â€“ ${e}`;
    if(weekOffset===1) return `Tuáº§n sau Â· ${s} â€“ ${e}`;
    return `${s} â€“ ${e}`;
  };

  const loadData = useCallback(async () => {
    try {
      const tRes = await api.get(`/teachers/by-user/${user?.id}`);
      const tid = tRes?.row?.id;
      if (!tid) return;
      setTeacherId(tid);
      const [schedRes, classRes, roomRes, mkRes] = await Promise.all([
  api.get(`/schedules/teacher/${tid}`),
  api.get(`/classes?teacher_id=${tid}`),
  api.get('/rooms'),
  api.get('/makeup').catch(() => ({ rows: [] })),
]);
      setSchedules(schedRes.rows||[]);
      setMyClasses((classRes.rows||[]).filter(c=>c.status==='Äang há»c'));
      setRooms(roomRes.rows||[]);
      setMakeups(mkRes.rows||[]);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  },[user]);

  const loadOverrides = useCallback(async () => {
    if(!teacherId) return;
    const wStart = getWeekStart(weekOffset);
    const wDates = getWeekDates(wStart);
    try {
      const start = wDates[0].toISOString().split('T')[0];
      const end = wDates[6].toISOString().split('T')[0];
      const res = await api.get(`/schedule-overrides?start_date=${start}&end_date=${end}&teacher_id=${teacherId}`);
      setOverrides(res.rows||[]);
    } catch(e) { console.error(e.message); }
  },[weekOffset,teacherId]);

  useEffect(()=>{if(user?.id) loadData();},[user,loadData]);
  useEffect(()=>{loadOverrides();},[loadOverrides]);

  const handleSave = useCallback(async (event,f,applyTo) => {
    const ns = f.time_start.length===5?f.time_start+':00':f.time_start;
    const ne = f.time_end.length===5?f.time_end+':00':f.time_end;

    if(applyTo==='week'){
      try{
        await api.post('/schedule-overrides',{
          schedule_id: event.id,
          original_date: event.actual_date,
          new_day_of_week: Number(f.day_of_week),
          new_time_start: ns, new_time_end: ne,
          room_id: f.room_id||null,
          status: 'rescheduled',
        });
        toast.success('ÄÃ£ Ä‘á»•i lá»‹ch tuáº§n nÃ y!');
        await loadOverrides();
      }catch(e){ toast.error(e.message); }
    } else {
      try{
        await api.put(`/schedules/${event.id}`,{
          class_id:event.class_id, teacher_id:event.teacher_id, room_id:f.room_id,
          day_of_week:Number(f.day_of_week), time_start:ns, time_end:ne,
          type:event.type, note:event.note,
        });
        toast.success('Cáº­p nháº­t lá»‹ch thÃ nh cÃ´ng!');
        await loadData();
      }catch(e){ toast.error(e.message); }
    }
  },[loadData,loadOverrides]);

  const handleDelete = useCallback(async (event,type) => {
    if(type==='override'){
      try{
        await api.delete(`/schedule-overrides/${event.id}/${event.actual_date}`);
        toast.success('ÄÃ£ vá» lá»‹ch bÃ¬nh thÆ°á»ng!');
        await loadOverrides();
      }catch(e){ toast.error(e.message); }
    } else {
      if(!window.confirm('XÃ³a lá»‹ch nÃ y vÄ©nh viá»…n?')) return;
      try{
        await api.delete(`/schedules/${event.id}`);
        toast.success('ÄÃ£ xÃ³a!');
        await loadData();
      }catch(e){ toast.error(e.message); }
    }
  },[loadData,loadOverrides]);

  const handleTimeStartChange = (e) => {
    const start = e.target.value;
    const [h,m] = start.split(':').map(Number);
    setForm(p=>({...p, time_start:start, time_end:`${String(Math.min(h+1,23)).padStart(2,'0')}:${String(m).padStart(2,'0')}`}));
  };

  const handleAdd = async () => {
    if(!form.class_id||!form.time_start||!form.time_end){toast.error('Chá»n lá»›p vÃ  giá»!');return;}
    setSaving(true);
    try{
      await api.post('/schedules',form);
      toast.success('ÄÃ£ thÃªm lá»‹ch dáº¡y!');
      setShowForm(false);
      setForm({class_id:'',day_of_week:2,time_start:'08:00',time_end:'09:00',room_id:''});
      await loadData();
    }catch(e){toast.error(e.message);}
    finally{setSaving(false);}
  };

  const handleMakeupClassChange = async (classId) => {
    setMakeupForm(p=>({...p,class_id:classId,student_id:''}));
    if(classId){
      try{const res=await api.get(`/classes/${classId}/students`);setStudents(res.rows||[]);}
      catch{setStudents([]);}
    } else setStudents([]);
  };

  const handleCreateMakeup = async () => {
    if(!makeupForm.student_id||!makeupForm.class_id||!makeupForm.makeup_date){toast.error('Chá»n HV, lá»›p vÃ  ngÃ y bÃ¹!');return;}
    setSavingMakeup(true);
    try{
      await api.post('/makeup',makeupForm);
      toast.success('ÄÃ£ táº¡o lá»‹ch bÃ¹!');
      setShowMakeup(false);
      setMakeupForm({student_id:'',class_id:'',original_date:'',makeup_date:'',makeup_time_start:'08:00',makeup_time_end:'09:00',room_id:'',note:''});
      await loadData();
    }catch(e){toast.error(e.message);}
    finally{setSavingMakeup(false);}
  };

  const handleDeleteMakeup = async (id) => {
    if(!window.confirm('XÃ³a lá»‹ch bÃ¹ nÃ y?')) return;
    try{await api.delete(`/makeup/${id}`);toast.success('ÄÃ£ xÃ³a!');await loadData();}
    catch(e){toast.error(e.message);}
  };

  const weekSchedules = mergeWithOverrides(schedules,overrides,weekDates);
  const hours = Array.from({length:END_HOUR-START_HOUR},(_,i)=>START_HOUR+i);
  const totalH = hours.length*SH;
  const cmap = {};
  schedules.forEach(s=>{if(!cmap[s.class_id])cmap[s.class_id]=COLORS[Object.keys(cmap).length%COLORS.length];});
  const byDay = DAY_MAP.map(d=>layoutEvs(weekSchedules.filter(s=>s.day_of_week===d)));
  const byDate = schedules.filter(s=>s.day_of_week===dow(selDate));

  if(loading) return <MainLayout title="Lá»‹ch dáº¡y"><p className="text-center text-gray-400 py-20">Äang táº£i...</p></MainLayout>;

  return(
    <MainLayout title="Lá»‹ch dáº¡y">
      <EditModal event={editEvent} rooms={rooms}
        onClose={()=>setEditEvent(null)} onSave={handleSave} onDelete={handleDelete}/>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs text-gray-400 hidden sm:block">âœï¸ Báº¥m vÃ o lá»‹ch Ä‘á»ƒ sá»­a</p>
        <div className="flex items-center gap-2">
          {tab==='makeup'?(
            <Button icon="ðŸ”„" onClick={()=>setShowMakeup(!showMakeup)}>{showMakeup?'ÄÃ³ng':'Táº¡o lá»‹ch bÃ¹'}</Button>
          ):(
            <Button icon="âž•" onClick={()=>setShowForm(!showForm)}>{showForm?'ÄÃ³ng':'ThÃªm lá»‹ch'}</Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
        {[
          {key:'week',label:'ðŸ“… Lá»‹ch tuáº§n'},
          {key:'date',label:'ðŸ—“ï¸ Theo ngÃ y'},
          {key:'month',label:'ðŸ“† Theo thÃ¡ng'},
          {key:'makeup',label:`ðŸ”„ Há»c bÃ¹ (${makeups.length})`},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all
              ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && tab!=='makeup' && (
        <div className="card mb-5">
          <p className="text-sm font-bold text-gray-700 mb-3">ThÃªm lá»‹ch dáº¡y má»›i</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Lá»›p há»c *</label>
              <select value={form.class_id} onChange={e=>setForm(p=>({...p,class_id:e.target.value}))} className="input-field">
                <option value="">Chá»n lá»›p...</option>
                {myClasses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Thá»© *</label>
              <select value={form.day_of_week} onChange={e=>setForm(p=>({...p,day_of_week:Number(e.target.value)}))} className="input-field">
                {DAYS_OPT.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giá» báº¯t Ä‘áº§u *</label>
              <input type="time" value={form.time_start} onChange={handleTimeStartChange} className="input-field"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giá» káº¿t thÃºc *</label>
              <input type="time" value={form.time_end} onChange={e=>setForm(p=>({...p,time_end:e.target.value}))} className="input-field"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">PhÃ²ng</label>
              <select value={form.room_id} onChange={e=>setForm(p=>({...p,room_id:e.target.value}))} className="input-field">
                <option value="">ChÆ°a xáº¿p phÃ²ng</option>
                {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={()=>setShowForm(false)}>Há»§y</Button>
            <Button onClick={handleAdd} loading={saving}>LÆ°u lá»‹ch</Button>
          </div>
        </div>
      )}

      {tab==='week'&&(
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <button onClick={()=>setWeekOffset(w=>w-1)}
              className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              â† Tuáº§n trÆ°á»›c
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">{formatWeekLabel()}</p>
              {weekOffset!==0&&(
                <button onClick={()=>setWeekOffset(0)} className="text-xs text-primary-500 hover:text-primary-700 mt-0.5">
                  Vá» tuáº§n nÃ y
                </button>
              )}
            </div>
            <button onClick={()=>setWeekOffset(w=>w+1)}
              className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Tuáº§n sau â†’
            </button>
          </div>

          <div className="overflow-x-auto">
            <div style={{minWidth:560}}>
              <div className="grid border-b border-gray-100" style={{gridTemplateColumns:'48px repeat(7,1fr)'}}>
                <div className="p-2 bg-gray-50"/>
                {weekDates.map((date,di)=>{
                  const isToday=date.toDateString()===new Date().toDateString();
                  const dateStr=date.toISOString().split('T')[0];
                  const hasOverride=overrides.some(o=>o.original_date?.slice(0,10)===dateStr);
                  return(
                    <div key={di} className="py-2 bg-gray-50 border-l border-gray-100 text-center">
                      <p className={`text-xs font-semibold ${isToday?'text-primary-600':'text-gray-500'}`}>{DAYS[di]}</p>
                      <p className={`text-sm font-bold mt-0.5 ${isToday?'text-primary-600':'text-gray-700'}`}>
                        {date.getDate()}/{date.getMonth()+1}
                      </p>
                      {isToday&&<div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-0.5"/>}
                      {hasOverride&&<div className="w-1.5 h-1.5 bg-orange-400 rounded-full mx-auto mt-0.5" title="CÃ³ lá»‹ch ngoáº¡i lá»‡"/>}
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
                    const isPast=date<new Date(new Date().setHours(0,0,0,0));
                    return(
                      <div key={di} className={`relative border-l border-gray-100 ${isPast?'bg-black/[0.02]':''}`}
                        style={{height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} className="absolute w-full border-t border-gray-50" style={{top:(h-START_HOUR)*SH}}/>
                        ))}
                        {isToday&&<div className="absolute inset-0 bg-primary-500/5 pointer-events-none"/>}
                        {byDay[di].map(s=>{
                          const c=cmap[s.class_id]||COLORS[0];
                          const t0=topPx(s.time_start);
                          const h0=Math.max(hpx(s.time_start,s.time_end),28);
                          const{lane=0,total=1}=s;
                          const pct=100/total;
                          return(
                            <div key={s.id} onClick={()=>setEditEvent(s)}
                              className="absolute rounded-xl border cursor-pointer select-none overflow-hidden hover:brightness-95 transition-all"
                              style={{
                                top:t0+1, height:h0-4,
                                left:`calc(${lane*pct}% + 1px)`, width:`calc(${pct}% - 2px)`,
                                backgroundColor: s.is_override?'#fff7ed':c.bg,
                                borderColor: s.is_override?'#f97316':c.border,
                                borderStyle: s.is_override?'dashed':'solid',
                                zIndex:5,
                              }}>
                              <div className="px-1.5 py-0.5 h-full flex flex-col overflow-hidden">
                                <p className="text-[11px] font-bold leading-tight truncate"
                                  style={{color: s.is_override ? '#c2410c' : c.text}}>
                                  {s.is_override && 'âš¡'}{getLabel(s)}
                                </p>
                                {h0>26&&<p className="text-[10px] truncate"
                                  style={{color: s.is_override ? '#ea580c' : c.text, opacity:0.7}}>
                                  {s.room_name||'ChÆ°a xáº¿p phÃ²ng'}
                                </p>}
                              </div>
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
              <p className="text-4xl mb-3">ðŸ“…</p>
              <p className="text-gray-400">ChÆ°a cÃ³ lá»‹ch dáº¡y nÃ o</p>
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
              <p className="text-center text-gray-400 py-8">KhÃ´ng cÃ³ lá»‹ch dáº¡y ngÃ y nÃ y</p>
            ):(
              <div className="flex flex-col gap-3">
                {[...byDate].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                  <div key={s.id} onClick={()=>setEditEvent({...s,actual_date:selDate})}
                    className={`p-4 rounded-2xl border cursor-pointer active:scale-95 transition-transform ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                    <p className="font-bold text-gray-800">{getLabel(s)}</p>
                    <p className="text-sm text-gray-600 mt-1">ðŸ• {s.time_start?.slice(0,5)} â€“ {s.time_end?.slice(0,5)}</p>
                    <p className="text-sm text-gray-500">ðŸšª {s.room_name||'ChÆ°a xáº¿p phÃ²ng'} Â· {s.instrument||''}</p>
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
                    <p className="text-xs text-gray-400">{ds.length} lá»›p</p>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {[...ds].sort((a,b)=>a.time_start?.localeCompare(b.time_start)).map((s,j)=>(
                      <div key={s.id} onClick={()=>setEditEvent({...s,actual_date:d})}
                        className={`p-3 rounded-xl border cursor-pointer active:scale-95 ${CARD_COLORS[j%CARD_COLORS.length]}`}>
                        <p className="text-sm font-bold text-gray-800">{getLabel(s)}</p>
                        <p className="text-xs text-gray-600">
                          {s.time_start?.slice(0,5)}â€“{s.time_end?.slice(0,5)} Â· ðŸšª {s.room_name||'ChÆ°a xáº¿p phÃ²ng'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab==='makeup'&&(
        <>
          {showMakeup&&(
            <div className="card mb-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Táº¡o lá»‹ch há»c bÃ¹</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Lá»›p há»c *</label>
                  <select value={makeupForm.class_id} onChange={e=>handleMakeupClassChange(e.target.value)} className="input-field">
                    <option value="">Chá»n lá»›p...</option>
                    {myClasses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Há»c viÃªn *</label>
                  <select value={makeupForm.student_id} onChange={e=>setMakeupForm(p=>({...p,student_id:e.target.value}))} className="input-field">
                    <option value="">Chá»n HV...</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.name}{s.nickname?` (${s.nickname})`:''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">NgÃ y váº¯ng</label>
                  <input type="date" value={makeupForm.original_date} onChange={e=>setMakeupForm(p=>({...p,original_date:e.target.value}))} className="input-field"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">NgÃ y bÃ¹ *</label>
                  <input type="date" value={makeupForm.makeup_date} onChange={e=>setMakeupForm(p=>({...p,makeup_date:e.target.value}))} className="input-field"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Giá» báº¯t Ä‘áº§u *</label>
                  <input type="time" value={makeupForm.makeup_time_start} onChange={e=>{
                    const start=e.target.value;const[h,m]=start.split(':').map(Number);
                    setMakeupForm(p=>({...p,makeup_time_start:start,makeup_time_end:`${String(Math.min(h+1,23)).padStart(2,'0')}:${String(m).padStart(2,'0')}`}));
                  }} className="input-field"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Giá» káº¿t thÃºc</label>
                  <input type="time" value={makeupForm.makeup_time_end} onChange={e=>setMakeupForm(p=>({...p,makeup_time_end:e.target.value}))} className="input-field"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">PhÃ²ng</label>
                  <select value={makeupForm.room_id} onChange={e=>setMakeupForm(p=>({...p,room_id:e.target.value}))} className="input-field">
                    <option value="">ChÆ°a xáº¿p</option>
                    {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ghi chÃº</label>
                  <input type="text" value={makeupForm.note} onChange={e=>setMakeupForm(p=>({...p,note:e.target.value}))} className="input-field" placeholder="LÃ½ do..."/>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={()=>setShowMakeup(false)}>Há»§y</Button>
                <Button onClick={handleCreateMakeup} loading={savingMakeup}>Gá»­i yÃªu cáº§u bÃ¹</Button>
              </div>
            </div>
          )}
          {makeups.length===0?(
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">ðŸ”„</p>
              <p className="text-gray-400">ChÆ°a cÃ³ lá»‹ch há»c bÃ¹</p>
            </div>
          ):(
            <div className="flex flex-col gap-3">
              {makeups.map(m=>{
                const cfg={
                  pending:{label:'Chá» duyá»‡t',color:'bg-yellow-100 text-yellow-700 border-yellow-200'},
                  confirmed:{label:'ÄÃ£ duyá»‡t',color:'bg-green-100 text-green-700 border-green-200'},
                  completed:{label:'HoÃ n thÃ nh',color:'bg-blue-100 text-blue-700 border-blue-200'},
                  cancelled:{label:'ÄÃ£ tá»« chá»‘i',color:'bg-red-100 text-red-700 border-red-200'},
                }[m.status]||{label:'Chá» duyá»‡t',color:'bg-yellow-100 text-yellow-700 border-yellow-200'};
                return(
                  <div key={m.id} className={`p-4 rounded-2xl border ${cfg.color}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{m.student_name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-white/50">{cfg.label}</span>
                        </div>
                        <p className="text-xs opacity-70">{m.class_name}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                          {m.original_date&&<span>Váº¯ng: {new Date(m.original_date).toLocaleDateString('vi-VN')}</span>}
                          <span>BÃ¹: {new Date(m.makeup_date).toLocaleDateString('vi-VN')} lÃºc {String(m.makeup_time_start||'').slice(0,5)}</span>
                          {m.room_name&&<span>{m.room_name}</span>}
                        </div>
                        {m.note&&<p className="text-xs italic mt-1 opacity-60">{m.note}</p>}
                      </div>
                      {m.status==='pending'&&(
                        <button onClick={()=>handleDeleteMakeup(m.id)} className="text-red-400 hover:text-red-600 text-sm p-1">ðŸ—‘ï¸</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default MySchedule;
