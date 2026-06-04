import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const STATUS_VARIANT = { 'Trống': 'green', 'Đang sử dụng': 'orange', 'Bảo trì': 'red' };
const STATUS_ICON    = { 'Trống': '✅', 'Đang sử dụng': '🔴', 'Bảo trì': '🔧' };
const STATUSES = ['Trống', 'Đang sử dụng', 'Bảo trì'];

const EMPTY = { name: '', capacity: 2, equipment: '', status: 'Trống', note: '' };

const RoomList = () => {
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.rows || []);
    } catch {
      toast.error('Không tải được danh sách phòng!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) { toast.error('Nhập tên phòng!'); return; }
    setSaving(true);
    try {
      await api.post('/rooms', form);
      toast.success('Thêm phòng học thành công!');
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
    // Cập nhật lạc quan trên UI
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      await api.put(`/rooms/${id}`, { status });
      toast.success('Cập nhật trạng thái!');
    } catch {
      toast.error('Không cập nhật được!');
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Đã xóa phòng!');
      load();
    } catch {
      toast.error('Không xóa được!');
    }
  };

  if (loading) return (
    <MainLayout title="Quản lý phòng học">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Quản lý phòng học">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => { setForm(EMPTY); setShowModal(true); }}>Thêm phòng</Button>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-2">🚪</p>
          <p className="text-gray-400 text-sm">Chưa có phòng học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map(room => (
            <Card key={room.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">🚪</div>
                <div className="flex items-center gap-1">
                  <Badge label={room.status} variant={STATUS_VARIANT[room.status]} dot />
                  <button onClick={() => handleDelete(room.id)}
                    className="text-gray-300 hover:text-red-500 text-sm ml-1">🗑️</button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{room.name}</h3>
              <p className="text-xs text-gray-500 mb-1">Sức chứa: {room.capacity || '—'} người</p>
              {room.equipment && <p className="text-xs text-gray-500 mb-3">{room.equipment}</p>}
              {room.note && <p className="text-xs text-orange-500 mb-3">⚠️ {room.note}</p>}
              <div className="flex gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => changeStatus(room.id, s)}
                    className={`flex-1 py-1 text-xs rounded-lg transition-all
                      ${room.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {STATUS_ICON[s]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thêm phòng học"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button loading={saving} onClick={handleSave}>Thêm phòng</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <Input label="Tên phòng" name="name" value={form.name} onChange={handleChange} required placeholder="VD: Phòng 5" />
          <Input label="Sức chứa (người)" name="capacity" type="number" value={form.capacity} onChange={handleChange} />
          <Input label="Thiết bị" name="equipment" value={form.equipment} onChange={handleChange} placeholder="VD: Piano Yamaha..." />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Ghi chú" name="note" value={form.note} onChange={handleChange} placeholder="Ghi chú..." />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default RoomList;