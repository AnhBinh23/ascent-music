import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const SAMPLE_LOGS = [
  { date: '2025-05-19', content: 'Luyện gam Đô trưởng, bài số 5', skill: 'Ngón tay linh hoạt', weakness: 'Tay trái còn yếu', rating: '⭐⭐⭐⭐', homework: 'Luyện bài số 6' },
  { date: '2025-05-17', content: 'Bài số 4 - gam La thứ', skill: 'Đọc nốt nhanh hơn', weakness: 'Nhịp chưa đều', rating: '⭐⭐⭐', homework: 'Tập lại bài 4' },
  { date: '2025-05-14', content: 'Ôn lại bài 1, 2, 3', skill: 'Nhớ tốt các nốt', weakness: 'Cần tập đều hơn', rating: '⭐⭐⭐⭐', homework: 'Luyện gam' },
];

const MyProgress = () => {
  const { user } = useAuth();
  const avgRating = 4;

  return (
    <MainLayout title="Tiến độ học tập">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{'⭐'.repeat(avgRating)}</p>
          <p className="text-sm text-gray-500 mt-1">Đánh giá trung bình</p>
        </div>
        <div className="card text-center">
          <Badge label="Trung cấp" variant="orange" />
          <p className="text-sm text-gray-500 mt-2">Trình độ hiện tại</p>
        </div>
      </div>

      <Card title="Nhật ký học tập" subtitle="Phản hồi từ giáo viên">
        <div className="flex flex-col gap-4 mt-3">
          {SAMPLE_LOGS.map((log, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-gray-800">📅 {log.date}</p>
                <span className="text-sm">{log.rating}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <p className="font-medium text-blue-600 mb-1">📖 Nội dung học</p>
                  <p className="text-gray-700">{log.content}</p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <p className="font-medium text-green-600 mb-1">✅ Điểm tốt</p>
                  <p className="text-gray-700">{log.skill}</p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <p className="font-medium text-red-600 mb-1">⚠️ Cần cải thiện</p>
                  <p className="text-gray-700">{log.weakness}</p>
                </div>
                <div className="p-2.5 bg-yellow-50 rounded-xl">
                  <p className="font-medium text-yellow-600 mb-1">📝 Bài tập về nhà</p>
                  <p className="text-gray-700">{log.homework}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </MainLayout>
  );
};

export default MyProgress;