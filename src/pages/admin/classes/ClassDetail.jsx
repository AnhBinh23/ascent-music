import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import GroupSalaryRates from '../../../components/ui/GroupSalaryRates';
import GuestScheduler from '../../../components/ui/GuestScheduler';

const STATUS_VARIANT = { 'Đang học':'green', 'Tạm nghỉ':'orange', 'Đã kết thúc':'gray' };
const STATUS_TUITION = {
  'Đã thanh toán':     { label:'Đã thanh toán',     bg:'bg-green-100',  text:'text-green-700' },
  'Thanh toán 1 phần': { label:'Thanh toán 1 phần', bg:'bg-yellow-100', text:'text-yellow-700' },
  'Chưa thanh toán':   { label:'Chưa thanh toán',   bg:'bg-red-100',    text:'text-red-700' },
};
const DAY = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };
const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const ClassDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const basePath     = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [cls, setCls]                 = useState(null);
  const [students, setStudents]       = useState([]);
  const [classSchedules, setClassSchedules] = useState([]);
  const [histories, setHistories]     = useState({});
  const [expandedId, setExpandedId]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState(null);
  const [guestTarget, setGuestTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [clsRes, stuRes, schedRes] = await Promise.all([
        api.get(`/classes/${id}`),
        api.get(`/classes/${id}/students`),
        api.get('/schedules'),
      ]);
      setCls(clsRes.row || clsRes.rows?.[0] || {});
      setStudents(stuRes.rows || []);
      setClassSchedules((schedRes.rows || []).filter(s => s.class_id === id));
    } catch (e) {
      toast.error('Không tải được dữ liệu!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const loadHistory = async (studentId) => {
    if (histories[studentId]) {
      setExpandedId(expandedId === studentId ? null : studentId);
      return;
    }
    try {
      const res = await api.get(`/classes/${id}/students/${studentId}/course-history`);
      setHistories(prev => ({ ...prev, [studentId]: res.rows || [] }));
      setExpandedId(studentId);
    } catch (e) {
      toast.error('Không tải được lịch sử!');
    }
  };

  const updateCourse = async (studentId, newCourse) => {
    if (newCourse < 1) return;
    setUpdating(studentId);
    try {
      await api.patch(`/classes/${id}/students/${studentId}/course`, { course_number: newCourse });
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, course_number: newCourse } : s));
      setHistories(prev => { const n = { ...prev }; delete n[studentId]; return n; });
      toast.success(`Chuyển sang Khóa ${newCourse}!`);
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <MainLayout title="Chi tiết lớp học"><div className="text-center py-20 text-gray-400">Đang tải...</div></MainLayout>;
  if (!cls) return <MainLayout title="Chi tiết lớp học"><div className="text-center py-20 text-gray-400">Không tìm thấy lớp học</div></MainLayout>;

  const isGroup = cls.type === 'group';
  const scheduleText = classSchedules.length
    ? classSchedules.sort((a,b) => a.day_of_week - b.day_of_week).map(s =>
        `${DAY[s.day_of_week]} ${String(s.time_start||'').slice(0,5)}-${String(s.time_end||'').slice(0,5)}`
      ).join(', ')
    : cls.schedule || '—';

  return (
    <MainLayout title="Chi tiết lớp học">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🎵</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-800 truncate">{cls.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge label={cls.instrument} variant="blue" />
            <Badge label={isGroup ? 'Nhóm' : '1 kèm 1'} variant={isGroup ? 'green' : 'purple'} />
            <Badge label={cls.status} variant={STATUS_VARIANT[cls.status] || 'gray'} dot />
          </div>
        </div>
        <Button variant="secondary" size="sm" icon="✏️" onClick={() => navigate(`${basePath}/classes/edit/${id}`)}>
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">📚 Thông tin lớp</p>
          {[
            ['Giáo viên',      cls.teacher_name || '—'],
            ['Nhạc cụ',        cls.instrument],
            ['Lịch học',       scheduleText],
            ['Trình độ',       cls.level || '—'],
            ['Gói khóa học',   cls.total_sessions ? `${cls.total_sessions} buổi` : '—'],
            ['Ngày bắt đầu',   fmtDate(cls.start_date)],
            ['Ngày kết thúc',  fmtDate(cls.end_date)],
            ['Học phí cả khóa', fmt(cls.tuition_fee)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">💰 Lương giáo viên</p>
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-green-50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{isGroup ? 'Lương/buổi (đủ HV)' : 'Lương/buổi dạy'}</p>
                <p className="text-lg font-bold text-green-700">{fmt(cls.teacher_salary)}<span className="text-xs font-normal text-gray-400 ml-1">/buổi</span></p>
              </div>
              <span className="text-2xl">💵</span>
            </div>
            {isGroup && cls.teacher_salary_partial > 0 && (
              <div className="p-3 bg-orange-50 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Lương khi có HV vắng</p>
                  <p className="text-lg font-bold text-orange-600">{fmt(cls.teacher_salary_partial)}<span className="text-xs font-normal text-gray-400 ml-1">/buổi</span></p>
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
            )}
            {cls.teacher_salary > 0 && cls.total_sessions > 0 && (
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Dự tính lương cả khóa</p>
                <p className="text-sm font-semibold text-blue-700">
                  {cls.total_sessions} buổi × {fmt(cls.teacher_salary)} = <strong>{fmt(cls.teacher_salary * cls.total_sessions)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {classSchedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">📅 Lịch dạy ({classSchedules.length} buổi/tuần)</p>
          <div className="flex flex-col gap-2">
            {classSchedules.sort((a,b) => a.day_of_week - b.day_of_week).map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-bold text-primary-700">{DAY[s.day_of_week]}</span>
                  <span className="text-sm text-gray-700">{String(s.time_start||'').slice(0,5)} – {String(s.time_end||'').slice(0,5)}</span>
                </div>
                <span className="text-xs text-gray-500">{s.room_name || 'Chưa xếp phòng'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isGroup && (
        <GroupSalaryRates classId={cls.id} totalStudents={students?.length || 3} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-700">👨‍🎓 Học viên ({students.length}{cls.max_students > 1 ? `/${cls.max_students}` : ''})</p>
          <p className="text-xs text-gray-400">Nhấn vào học viên để xem lịch sử khóa học</p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-400 text-sm">Chưa có học viên</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {students.map(s => {
              const courseNum  = s.course_number || 1;
              const isUpdating = updating === s.id;
              const isExpanded = expandedId === s.id;
              const history    = histories[s.id] || [];

              return (
                <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => loadHistory(s.id)}>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {s.instrument && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{s.instrument}</span>}
                        {s.attendance_rate > 0 && <span className="text-xs text-gray-400">Điểm danh: {s.attendance_rate}%</span>}
                        <Badge label={s.status === 'active' ? 'Đang học' : s.status === 'paused' ? 'Tạm nghỉ' : 'Nghỉ'} variant={s.status === 'active' ? 'green' : 'gray'} dot />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-bold">Khóa {courseNum}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); updateCourse(s.id, courseNum + 1); }}
                        disabled={isUpdating}
                        className="w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 text-xs font-bold flex items-center justify-center disabled:opacity-40" title="Nâng khóa">
                        {isUpdating ? '⏳' : '▲'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); updateCourse(s.id, courseNum - 1); }}
                        disabled={isUpdating || courseNum <= 1}
                        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold flex items-center justify-center disabled:opacity-40" title="Giảm khóa">
                        ▼
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 border-t border-gray-100 bg-white">
                      <p className="text-xs font-semibold text-gray-500 mb-2">📋 Lịch sử khóa học</p>
                      {history.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Chưa có dữ liệu học phí</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {history.map((h, i) => {
                            const st = STATUS_TUITION[h.status] || STATUS_TUITION['Chưa thanh toán'];
                            const isCurrent = h.course_number === courseNum;
                            return (
                              <div key={i} className={`flex items-center justify-between p-2 rounded-xl border ${isCurrent ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCurrent ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    Khóa {h.course_number}{isCurrent && ' ◄'}
                                  </span>
                                  <div>
                                    <p className="text-xs text-gray-600">{h.sessions} buổi · {fmt(h.amount)}</p>
                                    {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">Đã trả: {fmt(h.paid)}</p>
                                    {(h.amount - h.paid) > 0 && <p className="text-xs text-red-500">Còn: {fmt(h.amount - h.paid)}</p>}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
          <p className="text-xs text-yellow-700">
            💡 Nhấn <strong>▲</strong> để nâng học viên lên khóa tiếp theo. Nhấn vào tên học viên để xem lịch sử các khóa đã học.
          </p>
        </div>
      </div>

      {isGroup && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
          <p className="text-sm font-bold text-gray-700 mb-3">👥 Xếp lịch vãng lai cho HV</p>
          <select onChange={e => setGuestTarget(e.target.value)} value={guestTarget || ''} className="input-field mb-3">
            <option value="">Chọn học viên...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.nickname ? ` (${s.nickname})` : ''}</option>)}
          </select>
          {guestTarget && <GuestScheduler studentId={guestTarget} studentName={students.find(s => s.id === guestTarget)?.name} />}
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>← Quay lại</Button>
      </div>
    </MainLayout>
  );
};

export default ClassDetail;