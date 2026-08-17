import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GroupSalaryRates = ({ classId, totalStudents }) => {
  const [rates, setRates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const res = await api.get(`/group-salary/rates/${classId}`);
        const existing = res.rows || [];
        const total = Number(totalStudents) || 3;

        if (existing.length && existing[0].total_count === total) {
          // Load từ DB: chỉ lấy các dòng có present_count < total
          const mapped = existing
            .filter(r => r.present_count < r.total_count)
            .map(r => ({
              present_count: r.present_count,
              total_count: r.total_count,
              amount: r.amount || '',
            }));
          // Bổ sung dòng còn thiếu từ (total-1) → 0
          for (let i = total - 1; i >= 0; i--) {
            if (!mapped.find(r => r.present_count === i)) {
              mapped.push({ present_count: i, total_count: total, amount: '' });
            }
          }
          mapped.sort((a, b) => b.present_count - a.present_count);
          setRates(mapped);
        } else {
          // Sinh mới: từ (total-1) → 0
          const generated = [];
          for (let i = total - 1; i >= 0; i--) {
            generated.push({ present_count: i, total_count: total, amount: '' });
          }
          setRates(generated);
        }
        setLoaded(true);
      } catch (err) { console.error(err.message); }
    };
    load();
  }, [classId, totalStudents]);

  const handleChange = (idx, value) => {
    setRates(prev => prev.map((r, i) => i === idx ? { ...r, amount: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/group-salary/rates/${classId}`, { rates });
      toast.success('Đã lưu bảng lương nhóm!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!loaded) return null;

  return (
    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
      <p className="text-sm font-bold text-orange-700 mb-1">💰 Lương theo số HV có mặt</p>
      <p className="text-xs text-orange-500 mb-3">Nhập mức lương cho từng trường hợp số HV đi học</p>
      <div className="flex flex-col gap-2">
        {rates.map((r, i) => (
          <div key={i} className={`flex items-center gap-3 ${r.present_count === 0 ? 'opacity-80' : ''}`}>
            <span className={`text-sm font-semibold w-16 ${r.present_count === 0 ? 'text-red-500' : 'text-gray-700'}`}>
              {r.present_count}/{r.total_count}
            </span>
            <span className={`text-xs w-28 ${r.present_count === 0 ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
              {r.present_count === 0 ? '🚫 Cả lớp vắng →' : 'HV đi học →'}
            </span>
            <input
              type="number"
              value={r.amount}
              onChange={e => handleChange(i, e.target.value)}
              placeholder="Nhập số tiền..."
              className="input-field text-sm flex-1"
            />
            <span className="text-xs text-gray-500">đ</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">Để trống = chưa thiết lập, admin sẽ nhập sau</p>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
          {saving ? '⏳...' : '💾 Lưu'}
        </button>
      </div>
    </div>
  );
};

export default GroupSalaryRates;