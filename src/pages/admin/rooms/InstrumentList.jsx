import React, { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';

const STATUS_VARIANT = { 'Tốt': 'green', 'Cần bảo trì': 'orange', 'Hư hỏng': 'red' };

const SAMPLE = [
  { id: 'NC001', name: 'Piano Yamaha U1', type: 'Piano',  room: 'Phòng 1', status: 'Tốt',         purchaseDate: '2022-01-15', note: '' },
  { id: 'NC002', name: 'Guitar Acoustic', type: 'Guitar', room: 'Phòng 2', status: 'Tốt',         purchaseDate: '2023-03-20', note: '' },
  { id: 'NC003', name: 'Violin 4/4',      type: 'Violin', room: 'Phòng 3', status: 'Cần bảo trì', purchaseDate: '2021-06-10', note: 'Dây đàn cũ' },
  { id: 'NC004', name: 'Guitar Điện',     type: 'Guitar', room: 'Phòng 2', status: 'Hư hỏng',     purchaseDate: '2020-09-05', note: 'Hỏng amplifier' },
];

const EMPTY = { name: '', type: 'Piano', room: 'Phòng 1', status: 'Tốt', purchaseDate: '', note: '' };

const InstrumentList = () => {
  const [items, setItems] = useState(SAMPLE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) { toast.error('Nhập tên nhạc cụ!'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setItems(prev => [...prev, { ...form, id: `NC${Date.now()}` }]);
    toast.success('Thêm nhạc cụ thành công!');
    setShowModal(false); setForm(EMPTY); setSaving(false);
  };

  const typeIcon = { Piano: '🎹', Guitar: '🎸', Violin: '🎻', 'Thanh nhạc': '🎤' };

  return (
    <MainLayout title="Quản lý nhạc cụ">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => setShowModal(true)}>Thêm nhạc cụ</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <Card key={item.id}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl">
                {typeIcon[item.type] || '🎵'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <Badge label={item.status} variant={STATUS_VARIANT[item.status]} dot />
                </div>
                <p className="text-xs text-gray-500">{item.room} · Mua: {item.purchaseDate}</p>
                {item.note && <p className="text-xs text-orange-500 mt-1">⚠️ {item.note}</p>}
                <div className="flex gap-1 mt-3">
                  {['Tốt','Cần bảo trì','Hư hỏng'].map(s => (
                    <button key={s} onClick={() => {
                      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: s } : i));
                      toast.success('Cập nhật!');
                    }}
                      className={`flex-1 py-1 text-xs rounded-lg transition-all
                        ${item.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {s === 'Tốt' ? '✅' : s === 'Cần bảo trì' ? '🔧' : '❌'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
              {['Piano','Guitar','Violin','Thanh nhạc'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phòng</label>
            <select name="room" value={form.room} onChange={handleChange} className="input-field">
              {['Phòng 1','Phòng 2','Phòng 3','Phòng 4'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <Input label="Ngày mua" name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} />
          <Input label="Ghi chú" name="note" value={form.note} onChange={handleChange} placeholder="Tình trạng, ghi chú..." />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default InstrumentList;