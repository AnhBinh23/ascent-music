import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DAY_LABEL = { 1: 'CN', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7' };

const MyClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Bước 1: Lấy teachers.id từ user.id (user-001 → gv-001)
        const teacherData = await api.get(`/teachers/by-user/${user?.id}`);
        const teacher = teacherData.row || teacherData;
        const teacherId = teacher?.id;
        if (!teacherId) {
          setClasses([]);
          return;
        }

        // Bước 2: Lấy lớp theo teachers.id
        const data = await api.get(`/classes?teacher_id=${teacherId}`);
        const rows = data.rows || data || [];

        // Bước 3: Lấy học viên + tỉ lệ điểm danh từng lớp
        const enriched = await Promise.all(rows.map(async (cls) => {
          try {
            const students = await api.get(`/classes/${cls.id}/students`);
            return { ...cls, students: students.rows || students || [] };
          } catch {
            return { ...cls, students: [] };
          }
        }));

        setClasses(enriched);
      } catch (err) {
        console.error(err.message);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user]);

  const formatSchedule = (cls) => {
    const days = cls.days_of_week || cls.schedule_days || '';
    const time = cls.time_start?.slice(0, 5) || '';
    if (!days && !time) return cls.schedule || '';
    const dayLabels = String(days).split(',').map(d => DAY_LABEL[d.trim()] || d).join(', ');
    return `${dayLabels} - ${time}`;
  };

  if (loading) {
    return (
      <MainLayout title="Lớp học của tôi">
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Lớp học của tôi">
      {classes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎵</p>
          <p className="font-semibold text-gray-600">Chưa có lớp học nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {classes.map(cls => (
            <Card
              key={cls.id}
              title={cls.name}
              subtitle={`${formatSchedule(cls)} · ${cls.room_name || cls.room || ''}`}
              action={
                <Badge
                  label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                  variant={cls.type === '1v1' ? 'blue' : 'green'}
                />
              }
            >
              {cls.students.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">Chưa có học viên</p>
              ) : (
                <div className="flex flex-col gap-2 mt-3">
                  {cls.students.map((s, i) => {
                    const attendance = Number(s.attendance_rate || s.attendance || 0);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                            {s.name?.charAt(0)}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${attendance >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(attendance, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{attendance}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm" variant="secondary" icon="✅"
                  onClick={() => navigate('/teacher/attendance', { state: { classId: cls.id } })}
                >
                  Điểm danh
                </Button>
                <Button
                  size="sm" variant="secondary" icon="📝"
                  onClick={() => navigate('/teacher/lesson-log', { state: { classId: cls.id } })}
                >
                  Nhật ký
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default MyClasses;