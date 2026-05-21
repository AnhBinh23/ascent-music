import React, { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';

const ROLE_LABEL = { admin: 'Super Admin', staff: 'Nhân viên', teacher: 'Giáo viên', student: 'Học viên' };
const ROLE_VARIANT = { admin: 'red', staff: 'orange', teacher: 'blue', student: 'green' };

const SAMPLE = [
  { id: '1', name: 'Nguyễn Văn Admin', email: 'admin@ascentmusic.vn', role: 'admin',   status: 'active' },
  { id: '2', name: 'Trần Thị Nhân Viên', email: 'nv@ascentmusic.vn', role: 'staff',   status: 'active' },
  { id: '3', name: 'Nguyễn Thị Mai',    email: 'mai@ascentmusic.vn', role: 'teacher', status: 'active' },
  { id: '4', name: 'Nguyễn Văn An',     email: 'an@ascentmusic.vn',  role: 'student', status: 'active' },
];

const EMPTY = { name: '', email: '', role: 'student', password: '', status: 'active' };

const AccountManage = () => {
  const [accounts, setAccounts] = useState(SAMPLE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setAccounts(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success('Tạo tài khoản thành công!');
      setShowModal(false);
      setForm(EMPTY);
    } catch { toast.error('Có lỗi xảy ra!'); }
    finally { setSaving(false); }
  };

  const toggleStatus = (id) => {
    setAccounts(prev => prev.map(a => a.id === id
      ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
    ));
    toast.success('Cập nhật trạng thái!');
  };

  const columns = [
    { key: 'name', label: 'Tên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      )
    },
    { key: 'role', label: 'Vai trò',
      render: val => <Badge label={ROLE_LABEL[val]} variant={ROLE_VARIANT[val]} />
    },
    { key: 'status', label: 'Trạng thái',
      render: val => <Badge label={val === 'active' ? 'Hoạt động' : 'Đã khóa'} variant={val === 'active' ? 'green' : 'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val, row) => (
        <Button size="sm" variant={row.status === 'active' ? 'danger' : 'secondary'}
          onClick={(e) => { e.stopPropagation(); toggleStatus(val); }}>
          {row.status === 'active' ? '🔒 Khóa' : '🔓 Mở'}
        </Button>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý tài khoản">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => setShowModal(true)}>Tạo tài khoản</Button>
      </div>

      <Card>
        <Table columns={columns} data={accounts} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo tài khoản mới"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button loading={saving} onClick={handleSave}>Tạo tài khoản</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} required placeholder="Nguyễn Văn A" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="email@ascentmusic.vn" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Vai trò</label>
            <select name="role" value={form.role} onChange={handleChange} className="input-field">
              <option value="admin">Super Admin</option>
              <option value="staff">Nhân viên</option>
              <option value="teacher">Giáo viên</option>
              <option value="student">Học viên</option>
            </select>
          </div>
          <Input label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default AccountManage;