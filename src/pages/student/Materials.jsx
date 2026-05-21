import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const TYPE_ICON    = { 'PDF': '📄', 'Video': '🎬', 'Sheet nhạc': '🎼', 'Bài tập': '📝' };
const TYPE_VARIANT = { 'PDF': 'red', 'Video': 'blue', 'Sheet nhạc': 'purple', 'Bài tập': 'orange' };

const SAMPLE = [
  { id: 1, name: 'Giáo trình Piano cơ bản',   type: 'PDF',       class: 'Piano cơ bản 01', size: '2.5 MB',  date: '2025-05-01' },
  { id: 2, name: 'Hướng dẫn gam Đô trưởng',  type: 'Video',     class: 'Piano cơ bản 01', size: '45 MB',   date: '2025-05-10' },
  { id: 3, name: 'Sheet nhạc bài số 5',       type: 'Sheet nhạc',class: 'Piano cơ bản 01', size: '1.2 MB',  date: '2025-05-15' },
  { id: 4, name: 'Bài tập tuần 3',            type: 'Bài tập',   class: 'Piano cơ bản 01', size: '0.5 MB',  date: '2025-05-18' },
];

const Materials = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [materials, setMaterials] = useState(SAMPLE);

  const handleUpload = () => toast.info('Tính năng upload sẽ kết nối Google Drive!');
  const handleDownload = (item) => toast.success(`Đang tải ${item.name}...`);
  const handleDelete = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast.success('Đã xóa tài liệu!');
  };

  return (
    <MainLayout title="Tài liệu học tập">
      {isTeacher && (
        <div className="flex justify-end mb-5">
          <Button icon="📤" onClick={handleUpload}>Upload tài liệu</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materials.map(item => (
          <Card key={item.id}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">
                {TYPE_ICON[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.class} · {item.size}</p>
                <p className="text-xs text-gray-400">{item.date}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge label={item.type} variant={TYPE_VARIANT[item.type]} />
                  <Button size="sm" variant="secondary" icon="⬇️" onClick={() => handleDownload(item)}>Tải về</Button>
                  {isTeacher && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>🗑️</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default Materials;