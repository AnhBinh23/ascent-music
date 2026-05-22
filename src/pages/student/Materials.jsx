import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const TYPE_INFO = {
  'video':      { icon: '🎬', label: 'Video',     variant: 'blue'   },
  'pdf':        { icon: '📄', label: 'PDF',        variant: 'red'    },
  'sheet':      { icon: '🎼', label: 'Sheet nhạc', variant: 'purple' },
  'assignment': { icon: '📝', label: 'Bài tập',    variant: 'orange' },
};

const StudentMaterials = () => {
  const { user }  = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilterType] = useState('all');
  

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        // Tìm student ID
        const studentByUser = await api.get(`/students/by-user/${user?.id}`);
        const sid = studentByUser.row?.id;

        let data;
        if (sid) {
          data = await api.get(`/materials/student/${sid}`);
        } else {
          data = await api.get('/materials');
        }
        setMaterials(data.rows || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const filtered = filterType === 'all'
    ? materials
    : materials.filter(m => m.type === filterType);

  if (loading) return (
    <MainLayout title="Tài liệu học tập">
      <p className="text-center text-gray-400 py-20">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Tài liệu học tập">
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
            ${filterType === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Tất cả ({materials.length})
        </button>
        {Object.entries(TYPE_INFO).map(([key, info]) => (
          <button key={key} onClick={() => setFilterType(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
              ${filterType === key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {info.icon} {info.label} ({materials.filter(m => m.type === key).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Chưa có tài liệu nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => {
            const info = TYPE_INFO[item.type];
            return (
              <Card key={item.id}>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {item.mime_type?.startsWith('image/') ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{info?.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.class_name || 'Tất cả lớp'} · {item.teacher_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge label={info?.label} variant={info?.variant} />
                      {item.url && (
                        <Button size="sm" variant="primary" icon="👁️"
                          onClick={() => window.open(item.url, '_blank')}>Xem</Button>
                      )}
                      <Button size="sm" variant="secondary" icon="⬇️"
                        onClick={() => { if (item.url) window.open(item.url, '_blank'); }}>
                        Tải về
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export default StudentMaterials;