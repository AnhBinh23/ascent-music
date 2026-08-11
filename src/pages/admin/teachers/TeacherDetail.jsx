import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const INSTRUMENT_VARIANT = { Piano:'blue', Guitar:'green', Violin:'purple', 'Thanh nhạc':'orange' };
const DAY = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };
const fmt = n => Number(n||0).toLocaleString('vi-VN') + 'đ';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher]     = useState(null);
  const [classes, setClasses]     = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes, sRes] = await Promise.all([
          api.get(`/teachers/${id}`),
          api.get(`/classes?teacher_id=${id}`),
          api.get('/schedules'),
        ]);
        setTeacher(tRes.row);
        setClasses((cRes.rows || []).filter(c => c.teacher_id === id));
        setSchedules((sRes.rows || []).filter(s => s.teacher_id === id));
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Xác nhận xóa giáo viên này?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Đã xóa!');
      navigate('/admin/teachers');
    } catch (err) { toast.error('Không thể xóa!'); }
  };

  if (loading) return <MainLayout title="Chi tiết giáo viên"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;
  if (!teacher) return <MainLayout title="Chi tiết giáo viên"><p className="text-center text-gray-400 py-20">Không tìm thấy</p></MainLayout>;

  const activeClasses = classes.filter(c => c.status === 'Đang học');
  const instruments = (teacher.instrument || '').split(', ').filter(Boolean);

  return (
    <MainLayout title="Chi tiết giáo viên">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-700">
            {teacher.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{teacher.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {instruments.map(inst => (
                <Badge key={inst} label={inst} variant={INSTRUMENT_VARIANT[inst] || 'gray'} />
              ))}
              <Badge label={teacher.status === 'active' ? 'Đang dạy' : 'Nghỉ'} variant={teacher.status === 'active' ? 'green' : 'gray'} dot />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/admin/teachers/edit/${id}`)}>✏️ Chỉnh sửa</Button>
          <Button variant="ghost" onClick={handleDelete} className="text-red-500">🗑️</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Thông tin cá nhân */}
        <Card>
          <p className="text-sm font-bold text-gray-700 mb-3">📋 Thông tin cá nhân</p>
          <div className="flex flex-col gap-3">
            {[
              ['Điện thoại', teacher.phone || '—'],
              ['Email', teacher.email || '—'],
              ['Kinh nghiệm', teacher.experience || '—'],
              ['Ghi chú', teacher.note || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-800 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Thống kê */}
        <Card>
          <p className="text-sm font-bold text-gray-700 mb-3">📊 Thống kê</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{activeClasses.length}</p>
              <p className="text-xs text-gray-500 mt-1">Lớp đang dạy</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{instruments.length}</p>
              <p className="text-xs text-gray-500 mt-1">Nhạc cụ</p>
            </div>
          </div>
        </Card>

        {/* Lịch dạy tuần */}
        <Card>
          <p className="text-sm font-bold text-gray-700 mb-3">📅 Lịch dạy tuần</p>
          {schedules.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">Chưa có lịch</p>
          ) : (
            <div className="flex flex-col gap-2">
              {schedules.sort((a,b) => a.day_of_week - b.day_of_week || (a.time_start||'').localeCompare(b.time_start||'')).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-bold text-primary-700">{DAY[s.day_of_week]}</span>
                    <div>
                      <p className="font-medium text-gray-800">{s.class_name}</p>
                      <p className="text-xs text-gray-400">{s.room_name || 'Chưa xếp phòng'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{String(s.time_start||'').slice(0,5)} – {String(s.time_end||'').slice(0,5)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Danh sách lớp */}
      <div className="mt-5">
        <Card>
          <p className="text-sm font-bold text-gray-700 mb-3">🎵 Lớp đang dạy ({activeClasses.length})</p>
          {activeClasses.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Chưa có lớp nào</p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeClasses.map(c => (
                <div key={c.id} onClick={() => navigate(`/admin/classes/${c.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-primary-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-lg">🎵</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.instrument} · {c.type === '1v1' ? '1 kèm 1' : 'Nhóm'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge label={c.status} variant="green" dot />
                    {c.tuition_fee > 0 && <p className="text-xs text-gray-400 mt-1">{fmt(c.tuition_fee)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Button variant="secondary" onClick={() => navigate('/admin/teachers')}>← Quay lại</Button>
      </div>
    </MainLayout>
  );
};

export default TeacherDetail;