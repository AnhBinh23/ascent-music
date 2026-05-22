import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RATINGS = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' };

const MyProgress = () => {
  const { user }    = useAuth();
  const [logs, setLogs]         = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);

      // Tìm student theo user_id
      console.log('User ID:', user?.id);
      const studentByUser = await api.get(`/students/by-user/${user?.id}`);
      console.log('Student found:', studentByUser);
      const sid = studentByUser.row?.id;
      console.log('Student ID:', sid);

      if (!sid) {
        console.log('Không tìm thấy student record!');
        setLoading(false);
        return;
      }

      setStudentId(sid);

      const [logData, attStats] = await Promise.all([
        api.get(`/lesson-logs/student/${sid}`),
        attendanceService.getStats(sid),
      ]);

      console.log('Logs:', logData);
      console.log('Stats:', attStats);

      setLogs(logData.rows || []);
      setStats(attStats);
    } catch (err) {
      console.error('Error:', err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [user]);

  const avgRating = logs.length > 0
    ? (logs.reduce((sum, l) => sum + Number(l.rating || 3), 0) / logs.length).toFixed(1)
    : 0;

  if (loading) return (
    <MainLayout title="Tiến độ học tập">
      <p className="text-center text-gray-400 py-20">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Tiến độ học tập">

      {/* Tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{logs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi học</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{stats?.present || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Có mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{stats?.absent || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Vắng mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{avgRating}⭐</p>
          <p className="text-xs text-gray-500 mt-1">Đánh giá TB</p>
        </div>
      </div>

      {/* Tỷ lệ chuyên cần */}
      {stats && (
        <Card title="📊 Tỷ lệ chuyên cần" className="mb-4">
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Tỷ lệ đi học</span>
              <span className="font-bold text-green-600">{stats.rate || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.rate || 0}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: 'Có mặt',  value: stats.present || 0, color: 'text-green-600'  },
                { label: 'Vắng',    value: stats.absent  || 0, color: 'text-red-500'    },
                { label: 'Đi muộn',  value: stats.late    || 0, color: 'text-orange-500' },
                { label: 'Có phép', value: stats.excused || 0, color: 'text-blue-500'   },
              ].map(item => (
                <div key={item.label} className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Nhật ký học tập */}
      <Card title="📝 Nhật ký học tập từ giáo viên">
        {logs.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Chưa có nhật ký nào</p>
        ) : (
          <div className="flex flex-col gap-4 mt-3">
            {logs.map(log => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge label={log.class_name} variant="blue" />
                    <span className="text-xs text-gray-500">📅 {log.date}</span>
                  </div>
                  <span className="text-sm">{RATINGS[log.rating] || '⭐⭐⭐'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {log.content && (
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 font-medium">📚 Nội dung</p>
                      <p className="text-gray-700 mt-0.5">{log.content}</p>
                    </div>
                  )}
                  {log.skill && (
                    <div className="p-2 bg-green-50 rounded-xl">
                      <p className="text-xs text-green-600 font-medium">✅ Kỹ năng</p>
                      <p className="text-gray-700 mt-0.5">{log.skill}</p>
                    </div>
                  )}
                  {log.weakness && (
                    <div className="p-2 bg-red-50 rounded-xl">
                      <p className="text-xs text-red-600 font-medium">⚠️ Cần cải thiện</p>
                      <p className="text-gray-700 mt-0.5">{log.weakness}</p>
                    </div>
                  )}
                  {log.progress && (
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <p className="text-xs text-purple-600 font-medium">📈 Tiến độ</p>
                      <p className="text-gray-700 mt-0.5">{log.progress}</p>
                    </div>
                  )}
                  {log.homework && (
                    <div className="p-2 bg-orange-50 rounded-xl sm:col-span-2">
                      <p className="text-xs text-orange-600 font-medium">📝 Bài tập về nhà</p>
                      <p className="text-gray-700 mt-0.5">{log.homework}</p>
                    </div>
                  )}
                </div>

                {log.teacher_name && (
                  <p className="text-xs text-gray-400 mt-2">👨‍🏫 GV: {log.teacher_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default MyProgress;