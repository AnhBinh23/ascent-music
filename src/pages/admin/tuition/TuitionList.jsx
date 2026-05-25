import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import SearchBar from '../../../components/shared/SearchBar';
import TuitionReceipt from './TuitionReceipt';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = {
  'Đã thanh toán':    'green',
  'Chưa thanh toán':  'red',
  'Thanh toán 1 phần':'orange',
};

const TuitionList = () => {
  const [data, setData]               = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [showModal, setShowModal]     = useState(false);
  const [selected, setSelected]       = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [payForm, setPayForm]         = useState({ amount: '', method: 'Tiền mặt', note: '' });
  const [saving, setSaving]           = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/tuition');
      setData(res.rows || []);
    } catch (err) {
      toast.error('Không tải được dữ liệu học phí');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = data;
    if (filterStatus !== 'Tất cả') result = result.filter(d => d.status === filterStatus);
    if (search) result = result.filter(d =>
      d.student_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, filterStatus, data]);

  const totalRevenue = data
    .filter(d => d.status === 'Đã thanh toán')
    .reduce((sum, d) => sum + Number(d.paid || 0), 0);
  const totalUnpaid   = data.filter(d => d.status !== 'Đã thanh toán').length;
  const totalPartial  = data.filter(d => d.status === 'Thanh toán 1 phần').length;

  const handleCollect = (row) => {
    setSelected(row);
    setPayForm({ amount: Number(row.amount) - Number(row.paid || 0), method: 'Tiền mặt', note: '' });
    setShowModal(true);
  };

  const handleSavePay = async () => {
    if (!payForm.amount) { toast.error('Nhập số tiền thu!'); return; }
    setSaving(true);
    try {
      const newPaid   = Number(selected.paid || 0) + Number(payForm.amount);
      const newStatus = newPaid >= Number(selected.amount) ? 'Đã thanh toán' : 'Thanh toán 1 phần';
      await api.put(`/tuition/${selected.id}`, {
        paid:   newPaid,
        status: newStatus,
        method: payForm.method,
      });
      toast.success('Thu học phí thành công!');
      setShowModal(false);
      await loadData(); // reload từ DB
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'student_name', label: 'Học viên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.instrument}</p>
        </div>
      ),
    },
    { key: 'month', label: 'Tháng' },
    {
      key: 'amount', label: 'Học phí',
      render: val => <span className="font-medium">{Number(val).toLocaleString('vi-VN')}đ</span>,
    },
    {
      key: 'paid', label: 'Đã thu',
      render: val => (
        <span className={`font-medium ${Number(val) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {Number(val).toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      key: 'status', label: 'Trạng thái',
      render: val => <Badge label={val} variant={STATUS_VARIANT[val] || 'gray'} dot />,
    },
    {
      key: 'method', label: 'Hình thức',
      render: val => val || <span className="text-gray-300">—</span>,
    },
    {
      key: 'id', label: '',
      render: (val, row) => (
        <div className="flex gap-2">
          {row.status !== 'Đã thanh toán' && (
            <Button size="sm" icon="💰"
              onClick={e => { e.stopPropagation(); handleCollect(row); }}>
              Thu tiền
            </Button>
          )}
          {row.status === 'Đã thanh toán' && (
            <Button size="sm" variant="secondary" icon="🖨️"
              onClick={e => { e.stopPropagation(); setReceiptData(row); }}>
              In phiếu
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Quản lý học phí">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-xl font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Đã thu tháng này</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-red-500">{totalUnpaid}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa thanh toán</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-blue-600">{data.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng học viên</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-orange-500">{totalPartial}</p>
          <p className="text-xs text-gray-500 mt-1">Thanh toán 1 phần</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên học viên..." />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="input-field w-auto">
          <option>Tất cả</option>
          <option>Đã thanh toán</option>
          <option>Chưa thanh toán</option>
          <option>Thanh toán 1 phần</option>
        </select>
      </div>

      <Card subtitle={`${filtered.length} học viên`}>
        {loading
          ? <div className="text-center py-10 text-gray-400">Đang tải...</div>
          : <Table columns={columns} data={filtered} />
        }
      </Card>

      {/* Modal thu tiền */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thu học phí"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button icon="💰" loading={saving} onClick={handleSavePay}>Xác nhận thu</Button>
        </>}>
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-800">{selected.student_name}</p>
              <p className="text-sm text-gray-500">{selected.instrument} · Tháng {selected.month}</p>
              <p className="text-sm text-gray-600 mt-2">
                Học phí: <span className="font-medium">{Number(selected.amount).toLocaleString('vi-VN')}đ</span>
              </p>
              <p className="text-sm text-gray-600">
                Còn lại: <span className="font-medium text-red-500">
                  {(Number(selected.amount) - Number(selected.paid || 0)).toLocaleString('vi-VN')}đ
                </span>
              </p>
            </div>
            <Input label="Số tiền thu (VNĐ)" name="amount" value={payForm.amount}
              onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
              required placeholder="VD: 800000" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Hình thức thanh toán</label>
              <select value={payForm.method}
                onChange={e => setPayForm({ ...payForm, method: e.target.value })}
                className="input-field">
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
                <option>Ví điện tử</option>
              </select>
            </div>
            <Input label="Ghi chú" name="note" value={payForm.note}
              onChange={e => setPayForm({ ...payForm, note: e.target.value })}
              placeholder="Ghi chú thêm..." />
          </div>
        )}
      </Modal>

      {/* Modal in phiếu */}
      {receiptData && (
        <TuitionReceipt data={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </MainLayout>
  );
};

export default TuitionList;