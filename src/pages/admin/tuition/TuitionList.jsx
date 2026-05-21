import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import SearchBar from '../../../components/shared/SearchBar';
import TuitionReceipt from './TuitionReceipt';
import { toast } from 'react-toastify';

const STATUS_VARIANT = {
  'Đã thanh toán':    'green',
  'Chưa thanh toán':  'red',
  'Thanh toán 1 phần':'orange',
};

const SAMPLE = [
  { id: 'HP001', studentName: 'Nguyễn Văn An',  instrument: 'Piano',      month: '05/2025', amount: 800000, paid: 800000, status: 'Đã thanh toán',    method: 'Tiền mặt',     date: '2025-05-01' },
  { id: 'HP002', studentName: 'Trần Thị Bình',  instrument: 'Guitar',     month: '05/2025', amount: 700000, paid: 0,      status: 'Chưa thanh toán',  method: '',             date: '' },
  { id: 'HP003', studentName: 'Lê Minh Châu',   instrument: 'Violin',     month: '05/2025', amount: 850000, paid: 400000, status: 'Thanh toán 1 phần',method: 'Chuyển khoản', date: '2025-05-10' },
  { id: 'HP004', studentName: 'Hoàng Văn Em',   instrument: 'Piano',      month: '05/2025', amount: 800000, paid: 0,      status: 'Chưa thanh toán',  method: '',             date: '' },
  { id: 'HP005', studentName: 'Phạm Thị Dung',  instrument: 'Thanh nhạc', month: '05/2025', amount: 750000, paid: 750000, status: 'Đã thanh toán',    method: 'Ví điện tử',   date: '2025-05-03' },
];

const TuitionList = () => {
  const [data, setData]               = useState(SAMPLE);
  const [filtered, setFiltered]       = useState(SAMPLE);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [showModal, setShowModal]     = useState(false);
  const [selected, setSelected]       = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [payForm, setPayForm]         = useState({ amount: '', method: 'Tiền mặt', note: '' });

  useEffect(() => {
    let result = data;
    if (filterStatus !== 'Tất cả') result = result.filter(d => d.status === filterStatus);
    if (search) result = result.filter(d =>
      d.studentName?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, filterStatus, data]);

  const totalRevenue = data
    .filter(d => d.status === 'Đã thanh toán')
    .reduce((sum, d) => sum + d.paid, 0);
  const totalUnpaid = data.filter(d => d.status !== 'Đã thanh toán').length;

  const handleCollect = (row) => {
    setSelected(row);
    setPayForm({ amount: row.amount - row.paid, method: 'Tiền mặt', note: '' });
    setShowModal(true);
  };

  const handleSavePay = () => {
    if (!payForm.amount) { toast.error('Nhập số tiền thu!'); return; }
    const newPaid   = selected.paid + Number(payForm.amount);
    const newStatus = newPaid >= selected.amount ? 'Đã thanh toán' : 'Thanh toán 1 phần';
    setData(prev => prev.map(d => d.id === selected.id
      ? { ...d, paid: newPaid, status: newStatus, method: payForm.method, date: new Date().toISOString().split('T')[0] }
      : d
    ));
    toast.success('Thu học phí thành công!');
    setShowModal(false);
  };

  const columns = [
    {
      key: 'studentName', label: 'Học viên',
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
      render: (val) => <span className="font-medium">{val.toLocaleString('vi-VN')}đ</span>,
    },
    {
      key: 'paid', label: 'Đã thu',
      render: (val) => (
        <span className={`font-medium ${val > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {val.toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val} variant={STATUS_VARIANT[val]} dot />,
    },
    {
      key: 'method', label: 'Hình thức',
      render: (val) => val || <span className="text-gray-300">—</span>,
    },
    {
      key: 'id', label: '',
      render: (val, row) => (
        <div className="flex gap-2">
          {row.status !== 'Đã thanh toán' && (
            <Button size="sm" icon="💰"
              onClick={(e) => { e.stopPropagation(); handleCollect(row); }}>
              Thu tiền
            </Button>
          )}
          {row.status === 'Đã thanh toán' && (
            <Button size="sm" variant="secondary" icon="🖨️"
              onClick={(e) => { e.stopPropagation(); setReceiptData(row); }}>
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
          <p className="text-xl font-bold text-orange-500">
            {data.filter(d => d.status === 'Thanh toán 1 phần').length}
          </p>
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
        <Table columns={columns} data={filtered} />
      </Card>

      {/* Modal thu tiền */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thu học phí"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button icon="💰" onClick={handleSavePay}>Xác nhận thu</Button>
        </>}>
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-800">{selected.studentName}</p>
              <p className="text-sm text-gray-500">{selected.instrument} · Tháng {selected.month}</p>
              <p className="text-sm text-gray-600 mt-2">
                Học phí: <span className="font-medium">{selected.amount.toLocaleString('vi-VN')}đ</span>
              </p>
              <p className="text-sm text-gray-600">
                Còn lại: <span className="font-medium text-red-500">
                  {(selected.amount - selected.paid).toLocaleString('vi-VN')}đ
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

      {/* Modal in phiếu thu */}
      {receiptData && (
        <TuitionReceipt
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}

    </MainLayout>
  );
};

export default TuitionList;