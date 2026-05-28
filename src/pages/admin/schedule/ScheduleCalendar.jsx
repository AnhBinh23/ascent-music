import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const DAYS        = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const DAY_MAP     = [2, 3, 4, 5, 6, 7, 1];
const START_HOUR  = 7;
const END_HOUR    = 21;
const SLOT_HEIGHT = 80;
const SNAP_MINS   = 30;

const COLORS = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
  { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { bg: '#ccfbf1', border: '#5eead4', text: '#134e4a' },
];

const CARD_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200',
  'bg-pink-50 border-pink-200',
];

const timeToMins = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const minsToTime = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00`;
const timeToTop  = (t) => (timeToMins(t) - START_HOUR*60) / 60 * SLOT_HEIGHT;
const timeToPx   = (s,e) => (timeToMins(e) - timeToMins(s)) / 60 * SLOT_HEIGHT;

const getDayOfWeek = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 ? 1 : day + 1;
};

const getDaysInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const getLabel = (s) => {
  if (s.class_type === '1v1' && s.student_name)
    return `${s.student_name}: ${s.instrument || s.class_name}`;
  if (s.class_type === 'group')
    return `Nhóm (${s.student_count || 0} HV): ${s.instrument || s.class_name}`;
  return s.class_name || 'Lớp học';
};

const ScheduleCalendar = () => {
  const navigate  = useNavigate();
  const gridRef   = useRef(null);
  const dragData  = useRef(null);

  const [schedules, setSchedules]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('week');
  const [draggingId, setDraggingId]       = useState(null);
  const [dropTarget, setDropTarget]       = useState(null);
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/schedules');
      setSchedules(data.rows || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch học này?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success('Đã xóa lịch học!');
    } catch (err) { toast.error(err.message); }
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragStart = (e, schedule) => {
    const duration = timeToMins(schedule.time_end) - timeToMins(schedule.time_start);
    dragData.current = { id: schedule.id, duration, schedule };
    setDraggingId(schedule.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
    dragData.current = null;
  };

  const calcDropPos = (e, dayIdx) => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const relY = e.clientY - rect.top + grid.scrollTop;
    let mins   = Math.round((relY / SLOT_HEIGHT) * 60 / SNAP_MINS) * SNAP_MINS + START_HOUR * 60;
    mins       = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 30, mins));
    return { dayIdx, mins };
  };

  const onDragOver = (e, dayIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const pos = calcDropPos(e, dayIdx);
    if (pos) setDropTarget(pos);
  };

  const onDrop = async (e, dayIdx) => {
    e.preventDefault();
    if (!dragData.current) return;
    const { id, duration, schedule } = dragData.current;
    const pos = calcDropPos(e, dayIdx);
    if (!pos) return;

    const newDow   = DAY_MAP[dayIdx];
    const newStart = minsToTime(pos.mins);
    const newEnd   = minsToTime(pos.mins + duration);

    if (pos.mins + duration > END_HOUR * 60) {
      toast.error('Vượt quá giờ kết thúc (21:00)!');
      return;
    }

    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, day_of_week: newDow, time_start: newStart, time_end: newEnd } : s
    ));
    setDraggingId(null);
    setDropTarget(null);

    try {
      await api.put(`/schedules/${id}`, {
        class_id: schedule.class_id, teacher_id: schedule.teacher_id,
        room_id: schedule.room_id, day_of_week: newDow,
        time_start: newStart, time_end: newEnd,
        type: schedule.type, note: schedule.note,
      });
      toast.success('Cập nhật lịch thành công!');
    } catch (err) {
      toast.error(err.message);
      load();
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const hours       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = hours.length * SLOT_HEIGHT;
  const byDay       = DAY_MAP.map(dow => schedules.filter(s => s.day_of_week === dow));
  const colorMap    = {};
  schedules.forEach(s => {
    if (!colorMap[s.class_id]) colorMap[s.class_id] = COLORS[Object.keys(colorMap).length % COLORS.length];
  });

  const schedulesByDate = schedules.filter(s => s.day_of_week === getDayOfWeek(selectedDate));
  const daysInMonth     = getDaysInMonth(selectedMonth);

  return (
    <MainLayout title="Lịch học">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {tab === 'week' ? 'Kéo thả để thay đổi lịch' : ''}
        </p>
        <Button icon="➕" onClick={() => navigate('/admin/schedule/new')}>Thêm lịch học</Button>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[
          { key: 'week',  label: '📅 Lịch tuần'   },
          { key: 'date',  label: '🗓️ Theo ngày'   },
          { key: 'month', label: '📆 Theo tháng'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
              ${tab === t.key ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* ── TAB TUẦN: Time Grid + DnD ── */}
          {tab === 'week' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                <div className="p-2 bg-gray-50" />
                {DAYS.map(day => (
                  <div key={day} className="p-2 bg-gray-50 border-l border-gray-100 text-center">
                    <p className="text-xs font-semibold text-gray-700">{day}</p>
                  </div>
                ))}
              </div>
              <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: '75vh' }}>
                <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                  <div className="relative" style={{ height: totalHeight }}>
                    {hours.map(h => (
                      <div key={h} className="absolute w-full flex items-start justify-end pr-2"
                        style={{ top: (h - START_HOUR) * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                        <span className="text-xs text-gray-400 -mt-2">{h}:00</span>
                      </div>
                    ))}
                  </div>
                  {DAYS.map((day, dayIdx) => (
                    <div key={day} className="relative border-l border-gray-100"
                      style={{ height: totalHeight }}
                      onDragOver={e => onDragOver(e, dayIdx)}
                      onDrop={e => onDrop(e, dayIdx)}>
                      {hours.map(h => (
                        <div key={h} className="absolute w-full border-t border-gray-50"
                          style={{ top: (h - START_HOUR) * SLOT_HEIGHT }} />
                      ))}
                      {dropTarget?.dayIdx === dayIdx && dragData.current && (
                        <div className="absolute left-0 right-0 mx-1 rounded-xl opacity-40 border-2 border-dashed border-primary-400 bg-primary-100 pointer-events-none z-10"
                          style={{
                            top:    timeToTop(minsToTime(dropTarget.mins)) + 1,
                            height: timeToPx(minsToTime(dropTarget.mins), minsToTime(dropTarget.mins + dragData.current.duration)) - 4,
                          }} />
                      )}
                      {byDay[dayIdx].map(s => {
                        const color    = colorMap[s.class_id] || COLORS[0];
                        const top      = timeToTop(s.time_start);
                        const height   = Math.max(timeToPx(s.time_start, s.time_end), 28);
                        const isDragging = draggingId === s.id;
                        return (
                          <div key={s.id} draggable
                            onDragStart={e => onDragStart(e, s)}
                            onDragEnd={onDragEnd}
                            className="absolute left-0 right-0 mx-1 rounded-xl border cursor-grab active:cursor-grabbing select-none overflow-hidden"
                            style={{
                              top: top + 1, height: height - 4,
                              backgroundColor: color.bg, borderColor: color.border,
                              opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 1 : 5,
                            }}>
                            <div className="px-1.5 py-1 h-full flex flex-col justify-between">
                              <div>
                                <p className="text-xs font-bold leading-tight truncate" style={{ color: color.text }}>
                                  {getLabel(s)}
                                </p>
                                {height > 36 && (
                                  <p className="text-xs leading-tight" style={{ color: color.text, opacity: 0.8 }}>
                                    {s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)}
                                  </p>
                                )}
                                {height > 52 && (
                                  <p className="text-xs truncate" style={{ color: color.text, opacity: 0.7 }}>
                                    {s.teacher_name}
                                  </p>
                                )}
                                {height > 68 && (
                                  <p className="text-xs truncate" style={{ color: color.text, opacity: 0.6 }}>
                                    {s.room_name}
                                  </p>
                                )}
                              </div>
                              {height > 56 && (
                                <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                                  className="text-xs text-red-400 hover:text-red-600 text-left"
                                  onDragStart={e => e.stopPropagation()}>🗑️</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB NGÀY ── */}
          {tab === 'date' && (
            <>
              <div className="mb-4">
                <input type="date" value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="input-field w-full" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                {schedulesByDate.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Không có lịch học ngày này</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {schedulesByDate
                      .sort((a, b) => a.time_start?.localeCompare(b.time_start))
                      .map((s, j) => (
                        <div key={s.id} className={`p-3 rounded-xl border text-xs ${CARD_COLORS[j % CARD_COLORS.length]}`}>
                          <p className="font-semibold text-gray-800 text-sm">{getLabel(s)}</p>
                          <p className="text-gray-600 mt-0.5">🕐 {s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)}</p>
                          <p className="text-gray-500">👨‍🏫 {s.teacher_name}</p>
                          <p className="text-gray-400">🚪 {s.room_name}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TAB THÁNG ── */}
          {tab === 'month' && (
            <>
              <div className="mb-4">
                <input type="month" value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="input-field w-full" />
              </div>
              <div className="flex flex-col gap-3">
                {daysInMonth.map(d => {
                  const dow          = getDayOfWeek(d);
                  const daySchedules = schedules.filter(s => s.day_of_week === dow);
                  if (daySchedules.length === 0) return null;
                  return (
                    <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">{daySchedules.length} lớp</p>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {daySchedules
                          .sort((a, b) => a.time_start?.localeCompare(b.time_start))
                          .map((s, j) => (
                            <div key={s.id} className={`p-2 rounded-xl border text-xs ${CARD_COLORS[j % CARD_COLORS.length]}`}>
                              <p className="font-semibold text-gray-800">{getLabel(s)}</p>
                              <p className="text-gray-600">
                                {s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)} · {s.teacher_name} · {s.room_name}
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
        </>
      )}
    </MainLayout>
  );
};

export default ScheduleCalendar;