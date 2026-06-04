import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const STATUS_VARIANT = { 'Tốt': 'green', 'Cần bảo trì': 'orange', 'Hư hỏng': 'red' };
const STATUSES = ['Tốt', 'Cần bảo trì', 'Hư hỏng'];
const STATUS_ICON = { 'Tốt': '✅', 'Cần bảo trì': '🔧', 'Hư hỏng': '❌' };
const TYPES = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const TYPE_ICON = { Piano: '🎹', Guitar: '🎸', Violin: '🎻', 'Thanh nhạc': '🎤' };

const EMPTY = { name: '', type: 'Piano', room_id: '', status: 'Tốt', purchase_date: '', note: '' };

const InstrumentList = () => {
  const [items, setItems]         = useState([]);
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    try {
      const [insRes, roomRes] = await Promise.all([
        api.get('/instruments'),
        api.get('/rooms'),
      ]);
      setItems(insRes.rows || []);
      setRooms(roomRes.rows || []);
    } catch {
      toast.error('Không tải được dữ liệu!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) { toast.error('Nhập tên nhạc cụ!'); return; }
    setSaving(true);
    try {
      await api.post('/instruments', form);
      toast.success('Thêm nhạc cụ thành công!');
      setShowModal(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    try {
      await api.put(`/instruments/${id}`, { status });
      toast.success('Cập nhật!');
    } catch {
      toast.error('Không cập nhật được!');
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nhạc cụ này?')) return;
    try {
      await api.delete(`/instruments/${id}`);
      toast.success('Đã xóa!');
      load();
    } catch {
      toast.error('Không xóa được!');
    }
  };

  if (loading) return (
    <MainLayout title="Quản lý nhạc cụ">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Quản lý nhạc cụ">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => { setForm(EMPTY); setShowModal(true); }}>Thêm nhạc cụ</Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-2">🎵</p>
          <p className="text-gray-400 text-sm">Chưa có nhạc cụ nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => (
            <Card key={item.id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {TYPE_ICON[item.type] || '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge label={item.status} variant={STATUS_VARIANT[item.status]} dot />
                      <button onClick={() => handleDelete(item.id)}
                        className="text-gray-300 hover:text-red-500 text-sm">🗑️</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.room_name || 'Chưa gán phòng'}
                    {item.purchase_date && ` · Mua: ${new Date(item.purchase_date).toLocaleDateString('vi-VN')}`}
                  </p>
                  {item.note && <p className="text-xs text-orange-500 mt-1">⚠️ {item.note}</p>}
                  <div className="flex gap-1 mt-3">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => changeStatus(item.id, s)}
                        className={`flex-1 py-1 text-xs rounded-lg transition-all
                          ${item.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {STATUS_ICON[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thêm nhạc cụ"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button loading={saving} onClick={handleSave}>Thêm</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <Input label="Tên nhạc cụ" name="name" value={form.name} onChange={handleChange} required placeholder="VD: Piano Yamaha U3" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Loại</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phòng</label>
            <select name="room_id" value={form.room_id} onChange={handleChange} className="input-field">
              <option value="">-- Chưa gán phòng --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <Input label="Ngày mua" name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} />
          <Input label="Ghi chú" name="note" value={form.note} onChange={handleChange} placeholder="Tình trạng, ghi chú..." />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default InstrumentList;