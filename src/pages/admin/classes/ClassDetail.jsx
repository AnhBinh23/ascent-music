import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';

const STATUS_VARIANT = {
  'Đang tuyển sinh': 'blue',
  'Đang học':        'green',
  'Đã kết thúc':     'gray',
};

const STATUS_TUITION = {
  'Đã thanh toán':    { label: 'Đã thanh toán',    bg: 'bg-green-100',  text: 'text-green-700' },
  'Thanh toán 1 phần':{ label: 'Thanh toán 1 phần', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Chưa thanh toán':  { label: 'Chưa thanh toán',   bg: 'bg-red-100',    text: 'text-red-700' },
};

const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const ClassDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const basePath     = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [cls, setCls]                 = useState(null);
  const [students, setStudents]       = useState([]);
  const [histories, setHistories]     = useState({}); // { studentId: [...tuition rows] }
  const [expandedId, setExpandedId]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [clsRes, stuRes] = await Promise.all([
        api.get(`/classes/${id}`),
        api.get(`/classes/${id}/students`),
      ]);
      setCls(clsRes.row || clsRes.rows?.[0] || {});
      setStudents(stuRes.rows || []);
    } catch (e) {
      toast.error('Không tải được dữ liệu!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Load lịch sử khóa học của 1 học viên
  const loadHistory = async (studentId) => {
    if (histories[studentId]) {
      // Toggle
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

  // Nâng/giảm khóa
  const updateCourse = async (studentId, newCourse) => {
    if (newCourse < 1) return;
    setUpdating(studentId);
    try {
      await api.patch(`/classes/${id}/students/${studentId}/course`, {
        course_number: newCourse,
      });
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, course_number: newCourse } : s
      ));
      // Reset history cache để load lại
      setHistories(prev => { const n = { ...prev }; delete n[studentId]; return n; });
      toast.success(`✅ Chuyển sang Khóa ${newCourse}!`);
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <MainLayout title="Chi tiết lớp học">
      <div className="text-center py-20 text-gray-400">Đang tải...</div>
    </MainLayout>
  );

  if (!cls) return (
    <MainLayout title="Chi tiết lớp học">
      <div className="text-center py-20 text-gray-400">Không tìm thấy lớp học</div>
    </MainLayout>
  );

  const isGroup = cls.type === 'group';

  return (
    <MainLayout title="Chi tiết lớp học">
      {/* ── Header ── */}
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
        {/* ✅ Fix: dùng basePath + classes/edit/:id */}
        <Button variant="secondary" size="sm" icon="✏️"
          onClick={() => navigate(`${basePath}/classes/edit/${id}`)}>
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* ── Thông tin lớp ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">📚 Thông tin lớp</p>
          {[
            ['Giáo viên',      cls.teacher_name || '—'],
            ['Nhạc cụ',        cls.instrument],
            ['Lịch học',       cls.schedule || '—'],
            ['Trình độ',       cls.level || '—'],
            ['Gói khóa học',   cls.total_sessions ? `${cls.total_sessions} buổi` : '—'],
            ['Ngày bắt đầu',   cls.start_date?.slice(0,10) || '—'],
            ['Ngày kết thúc',  cls.end_date?.slice(0,10) || '—'],
            ['Học phí cả khóa', fmt(cls.tuition_fee)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Lương giáo viên ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">💰 Lương giáo viên</p>
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-green-50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {isGroup ? 'Lương khi đủ học viên' : 'Lương/buổi dạy'}
                </p>
                <p className="text-lg font-bold text-green-700">
                  {fmt(cls.teacher_salary)}
                  <span className="text-xs font-normal text-gray-400 ml-1">/buổi</span>
                </p>
              </div>
              <span className="text-2xl">💵</span>
            </div>

            {isGroup && (
              <div className="p-3 bg-orange-50 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Lương khi có HV vắng</p>
                  <p className="text-lg font-bold text-orange-600">
                    {fmt(cls.teacher_salary_partial)}
                    <span className="text-xs font-normal text-gray-400 ml-1">/buổi</span>
                  </p>
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
            )}

            {cls.teacher_salary > 0 && cls.total_sessions > 0 && (
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Dự tính lương cả khóa</p>
                <p className="text-sm font-semibold text-blue-700">
                  {cls.total_sessions} buổi × {fmt(cls.teacher_salary)} = {' '}
                  <strong>{fmt(cls.teacher_salary * cls.total_sessions)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Danh sách học viên + Khóa học ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-700">
            👨‍🎓 Học viên ({students.length}{cls.max_students > 1 ? `/${cls.max_students}` : ''})
          </p>
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
                  {/* Row chính */}
                  <div
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => loadHistory(s.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {s.instrument && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {s.instrument}
                          </span>
                        )}
                        {s.attendance_rate > 0 && (
                          <span className="text-xs text-gray-400">
                            Điểm danh: {s.attendance_rate}%
                          </span>
                        )}
                        <span className="text-xs text-gray-300">
                          {isExpanded ? '▲ Ẩn lịch sử' : '▼ Xem lịch sử'}
                        </span>
                      </div>
                    </div>

                    {/* Khóa hiện tại + nút nâng/giảm */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Đang học</p>
                        <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-bold">
                          Khóa {courseNum}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateCourse(s.id, courseNum + 1)}
                          disabled={isUpdating}
                          className="w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 text-xs font-bold flex items-center justify-center disabled:opacity-40"
                          title="Nâng lên khóa tiếp theo"
                        >
                          {isUpdating ? '⏳' : '▲'}
                        </button>
                        <button
                          onClick={() => updateCourse(s.id, courseNum - 1)}
                          disabled={isUpdating || courseNum <= 1}
                          className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold flex items-center justify-center disabled:opacity-40"
                          title="Giảm về khóa trước"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử khóa học (collapsible) */}
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
                              <div key={i}
                                className={`flex items-center justify-between p-2 rounded-xl border
                                  ${isCurrent ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                    ${isCurrent ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    Khóa {h.course_number}
                                    {isCurrent && ' ●'}
                                  </span>
                                  <div>
                                    <p className="text-xs text-gray-600">
                                      {h.sessions} buổi · {fmt(h.amount)}
                                    </p>
                                    {h.note && (
                                      <p className="text-xs text-gray-400">{h.note}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">Đã trả: {fmt(h.paid)}</p>
                                    {(h.amount - h.paid) > 0 && (
                                      <p className="text-xs text-red-500">Còn: {fmt(h.amount - h.paid)}</p>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                                    {st.label}
                                  </span>
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
            💡 Nhấn <strong>▲</strong> để nâng học viên lên khóa tiếp theo khi hoàn thành khóa hiện tại.
            Nhấn vào tên học viên để xem lịch sử các khóa đã học.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`${basePath}/classes`)}>← Quay lại</Button>
      </div>
    </MainLayout>
  );
};

export default ClassDetail;