import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SearchBar from '../../components/shared/SearchBar';
import api from '../../services/api';
import { toast } from 'react-toastify';

const INSTRUMENTS   = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS        = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const LEVEL_VARIANT = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };

const EMPTY = {
  name: '', dob: '', gender: 'Nam', phone: '', address: '',
  instrument: 'Piano', level: 'Sơ cấp', parentName: '',
  parentPhone: '', note: '', status: 'active',
};

const StaffStudentManage = () => {
  const [students, setStudents]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      const data = await api.get('/students');
      setStudents(data.rows || data || []);
    } catch (err) {
      toast.error('Không tải được danh sách học viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.instrument?.toLowerCase().includes(q)
    ));
  }, [search, students]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/students/${editId}`, form);
        toast.success('Cập nhật học viên thành công!');
      } else {
        await api.post('/students', form);
        toast.success('Thêm học viên thành công!');
      }
      await loadStudents();
      closeModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => { setForm(s); setEditId(s.id); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa học viên này?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Đã xóa!');
      await loadStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY); setEditId(null); };

  const columns = [
    {
      key: 'name', label: 'Họ tên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      )
    },
    { key: 'instrument', label: 'Nhạc cụ' },
    {
      key: 'level', label: 'Trình độ',
      render: val => <Badge label={val} variant={LEVEL_VARIANT[val] || 'gray'} />
    },
    {
      key: 'gender', label: 'Giới tính'
    },
    {
      key: 'status', label: 'Trạng thái',
      render: val => <Badge label={val === 'active' ? 'Đang học' : 'Nghỉ'} variant={val === 'active' ? 'green' : 'gray'} dot />
    },
    {
      key: 'id', label: '',
      render: (val, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); handleEdit(row); }}>✏️</Button>
          <Button size="sm" variant="ghost"     onClick={e => { e.stopPropagation(); handleDelete(val); }}>🗑️</Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý học viên">
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, SĐT, nhạc cụ..." />
        </div>
        <Button icon="➕" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}>
          Thêm học viên
        </Button>
      </div>

      <Card subtitle={`${filtered.length} học viên`}>
        {loading
          ? <div className="text-center py-10 text-gray-400">Đang tải...</div>
          : <Table columns={columns} data={filtered} />
        }
      </Card>

      <Modal
        isOpen={showModal} onClose={closeModal}
        title={editId ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'} size="lg"
        footer={<>
          <Button variant="secondary" onClick={closeModal}>Hủy</Button>
          <Button loading={saving} icon={editId ? '💾' : '➕'} onClick={handleSave}>
            {editId ? 'Cập nhật' : 'Thêm học viên'}
          </Button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Họ và tên"     name="name"        value={form.name}        onChange={handleChange} required placeholder="Nguyễn Văn A" />
          <Input label="Số điện thoại" name="phone"       value={form.phone}       onChange={handleChange} required placeholder="0901234567" />
          <Input label="Ngày sinh"     name="dob"         type="date" value={form.dob} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Giới tính</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
              <option>Nam</option><option>Nữ</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nhạc cụ <span className="text-red-500">*</span></label>
            <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
              {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trình độ</label>
            <select name="level" value={form.level} onChange={handleChange} className="input-field">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <Input label="Tên phụ huynh" name="parentName"  value={form.parentName}  onChange={handleChange} placeholder="Nguyễn Thị B" />
          <Input label="Địa chỉ"       name="address"     value={form.address}     onChange={handleChange} placeholder="Địa chỉ..." />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Ghi chú..." />
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default StaffStudentManage;