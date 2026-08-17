import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const fmt = n => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const FlexibleAttendance = () => {
  const { user } = useAuth();
  const [classes, setClasses]     = useState([]);
  const [selectedCls, setSelectedCls] = useState(null);
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/classes');
        const flexClasses = (res.rows || []).filter(c =>
          c.type === 'flexible' || c.is_flexible === 1
        );
        setClasses(flexClasses);
      } catch {}
    };
    load();
  }, []);

  const loadStudents = async (cls, d) => {
    if (!cls || !d) return;
    setLoading(true);
    try {
      const res = await api.get(`/flexible-sessions/by-class/${cls.id}/date/${d}`);
      setStudents(res.rows || []);
    } catch {
      toast.error('Không tải được danh sách!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedCls(cls);
    loadStudents(cls, date);
  };

  const handleDateChange = (d) => {
    setDate(d);
    if (selectedCls) loadStudents(selectedCls, d);
  };

  const handleCheckin = async (session, status) => {
    setSaving(prev => ({ ...prev, [session.id]: true }));
    try {
      const res = await api.patch(`/flexible-sessions/${session.id}/checkin`, { status });
      toast.success(
        status === 'present'
          ? `✅ Điểm danh ${session.student_name} — ${res.present_count}/${res.total_count} HV có mặt — Lương: ${fmt(res.salary)}`
          : `❌ Đã ghi vắng ${session.student_name}`
      );
      loadStudents(selectedCls, date);
    } catch (err) {
      toast.error(err.message || 'Lỗi!');
    } finally {
      setSaving(prev => ({ ...prev, [session.id]: false }));
    }
  };

  const presentCount = students.filter(s => s.status === 'attended').length;
  const totalCount   = students.filter(s => s.status !== 'cancelled').length;

  return (
    <MainLayout title="🔄 Điểm danh lớp linh hoạt">
      <div className="flex flex-col gap-4">

        {/* Chọn lớp + ngày */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">🏫 Chọn lớp & ngày</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="input-field flex-1"
              value={selectedCls?.id || ''}
              onChange={e => {
                const cls = classes.find(c => c.id === e.target.value);
                if (cls) handleSelectClass(cls);
              }}>
              <option value="">-- Chọn lớp linh hoạt --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.teacher_name}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
              className="input-field sm:w-48"
            />
          </div>
        </div>

        {/* Danh sách HV đã đăng ký */}
        {selectedCls && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-700">
                  👨‍🎓 HV đã đăng ký — {date}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {presentCount}/{totalCount} đã điểm danh có mặt
                </p>
              </div>
              {totalCount > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Lương tạm tính</p>
                  <p className="text-sm font-bold text-orange-600">
                    theo bảng {presentCount}/{totalCount} HV
                  </p>
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-400">Đang tải...</p>
            ) : students.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400 text-sm">Chưa có HV nào đăng ký buổi này</p>
                <p className="text-xs text-gray-300 mt-1">Ngày {date} — {selectedCls.name}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {students.map(s => (
                  <div key={s.id}
                    className={`flex items-center justify-between p-3 rounded-xl border
                      ${s.status === 'attended' ? 'bg-green-50 border-green-200'
                      : s.status === 'absent'   ? 'bg-red-50 border-red-100'
                      : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                        {s.student_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.student_name}</p>
                        {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === 'attended' ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                          ✅ Có mặt
                        </span>
                      ) : s.status === 'absent' ? (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg font-medium">
                          ❌ Vắng
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCheckin(s, 'present')}
                            disabled={saving[s.id]}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50">
                            ✅ Có mặt
                          </button>
                          <button
                            onClick={() => handleCheckin(s, 'absent')}
                            disabled={saving[s.id]}
                            className="px-3 py-1.5 bg-red-100 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-200 disabled:opacity-50">
                            ❌ Vắng
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default FlexibleAttendance;