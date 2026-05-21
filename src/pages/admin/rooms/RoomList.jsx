import React, { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';

const STATUS_VARIANT = { 'Trống': 'green', 'Đang sử dụng': 'orange', 'Bảo trì': 'red' };
const STATUS_ICON    = { 'Trống': '✅', 'Đang sử dụng': '🔴', 'Bảo trì': '🔧' };

const SAMPLE = [
  { id: 'P1', name: 'Phòng 1', capacity: 2, equipment: 'Piano Yamaha U1', status: 'Đang sử dụng', note: '' },
  { id: 'P2', name: 'Phòng 2', capacity: 4, equipment: 'Guitar điện, Amplifier', status: 'Trống', note: '' },
  { id: 'P3', name: 'Phòng 3', capacity: 2, equipment: 'Violin, Gương luyện tập', status: 'Trống', note: '' },
  { id: 'P4', name: 'Phòng 4', capacity: 4, equipment: 'Hệ thống âm thanh', status: 'Bảo trì', note: 'Sửa điều hòa' },
];

const EMPTY = { name: '', capacity: 2, equipment: '', status: 'Trống', note: '' };

const RoomList = () => {
  const [rooms, setRooms] = useState(SAMPLE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) { toast.error('Nhập tên phòng!'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setRooms(prev => [...prev, { ...form, id: `P${Date.now()}` }]);
    toast.success('Thêm phòng học thành công!');
    setShowModal(false);
    setForm(EMPTY);
    setSaving(false);
  };

  const changeStatus = (id, status) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Cập nhật trạng thái!');
  };

  return (
    <MainLayout title="Quản lý phòng học">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => setShowModal(true)}>Thêm phòng</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map(room => (
          <Card key={room.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">🚪</div>
              <Badge label={room.status} variant={STATUS_VARIANT[room.status]} dot />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{room.name}</h3>
            <p className="text-xs text-gray-500 mb-1">Sức chứa: {room.capacity} người</p>
            <p className="text-xs text-gray-500 mb-3">{room.equipment}</p>
            {room.note && <p className="text-xs text-orange-500 mb-3">⚠️ {room.note}</p>}
            <div className="flex gap-1">
              {['Trống', 'Đang sử dụng', 'Bảo trì'].map(s => (
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
              <option>Trống</option><option>Đang sử dụng</option><option>Bảo trì</option>
            </select>
          </div>
          <Input label="Ghi chú" name="note" value={form.note} onChange={handleChange} placeholder="Ghi chú..." />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default RoomList;