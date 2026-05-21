import React, { useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-toastify';

const STUDENTS = [
  { id: 'HV001', name: 'Nguyễn Văn An',  instrument: 'Piano',      tuition: 800000 },
  { id: 'HV002', name: 'Trần Thị Bình',  instrument: 'Guitar',     tuition: 700000 },
  { id: 'HV003', name: 'Lê Minh Châu',   instrument: 'Violin',     tuition: 850000 },
  { id: 'HV004', name: 'Hoàng Văn Em',   instrument: 'Piano',      tuition: 800000 },
  { id: 'HV005', name: 'Phạm Thị Dung',  instrument: 'Thanh nhạc', tuition: 750000 },
];

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const InvoicePage = () => {
  const printRef = useRef();
  // eslint-disable-next-line no-unused-vars
const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({
    month: '05', year: '2025',
    method: 'Tiền mặt', discount: 0,
    note: '', collectorName: 'Nhân viên',
  });
  const [invoiceNo] = useState(`HD${Date.now().toString().slice(-6)}`);
  const [saved, setSaved]         = useState([]);

  const totalAmount = selectedStudent
    ? selectedStudent.tuition - Number(form.discount || 0)
    : 0;

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Hóa đơn ${invoiceNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; font-size: 14px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          .divider { border-top: 2px solid #000; margin: 12px 0; }
          .divider-dot { border-top: 1px dashed #666; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          td { padding: 5px 0; font-size: 14px; vertical-align: top; }
          td:last-child { text-align: right; }
          .total-row td { font-size: 17px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; }
          .paid-box { border: 2px solid #000; padding: 8px 16px; display: inline-block; margin: 12px 0; font-weight: bold; }
          .sign-row { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
          .sign-col { width: 45%; }
          .sign-line { margin-top: 60px; border-top: 1px solid #000; padding-top: 4px; font-style: italic; }
          @media print { button { display: none !important; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleSave = () => {
    const invoice = {
      id: invoiceNo,
      studentName: selectedStudent.name,
      instrument:  selectedStudent.instrument,
      month:       `${form.month}/${form.year}`,
      amount:      selectedStudent.tuition,
      discount:    Number(form.discount || 0),
      total:       totalAmount,
      method:      form.method,
      note:        form.note,
      date:        new Date().toLocaleDateString('vi-VN'),
      status:      'Đã thanh toán',
    };
    const all = JSON.parse(localStorage.getItem('invoices') || '[]');
    all.unshift(invoice);
    localStorage.setItem('invoices', JSON.stringify(all));
    setSaved(prev => [invoice, ...prev]);
    toast.success('✅ Đã lưu hóa đơn!');
    setStep(1);
    setSelectedStudent(null);
    setForm({ month: '05', year: '2025', method: 'Tiền mặt', discount: 0, note: '', collectorName: 'Nhân viên' });
  };

  return (
    <MainLayout title="Tạo hóa đơn">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bước 1 & 2 — Form tạo */}
        <div className="flex flex-col gap-4">

          {/* Chọn học viên */}
          <Card title="1. Chọn học viên">
            <div className="flex flex-col gap-2 mt-2">
              {STUDENTS.map(s => (
                <button key={s.id} onClick={() => setSelectedStudent(s)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left
                    ${selectedStudent?.id === s.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.instrument}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary-600">
                    {s.tuition.toLocaleString('vi-VN')}đ
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Thông tin hóa đơn */}
          <Card title="2. Thông tin hóa đơn">
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tháng</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="input-field">
                  {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Năm</label>
                <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input-field">
                  {['2024','2025','2026'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức thanh toán</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className="input-field">
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                  <option>Ví điện tử</option>
                </select>
              </div>
              <Input label="Giảm giá (đ)" name="discount" value={form.discount}
                onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" />
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Người thu tiền</label>
                <input value={form.collectorName} onChange={e => setForm({ ...form, collectorName: e.target.value })}
                  className="input-field" placeholder="Tên nhân viên thu tiền" />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2} className="input-field resize-none" placeholder="Ghi chú thêm..." />
              </div>
            </div>

            {selectedStudent && (
              <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Học phí tháng {form.month}/{form.year}</span>
                  <span className="font-medium">{selectedStudent.tuition.toLocaleString('vi-VN')}đ</span>
                </div>
                {Number(form.discount) > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="text-green-600 font-medium">-{Number(form.discount).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-orange-200 pt-2 mt-2">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-xl font-bold text-orange-600">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button fullWidth variant="secondary" icon="🖨️" onClick={handlePrint}
                disabled={!selectedStudent}>
                In hóa đơn
              </Button>
              <Button fullWidth icon="💾" onClick={handleSave}
                disabled={!selectedStudent}>
                Lưu & hoàn tất
              </Button>
            </div>
          </Card>
        </div>

        {/* Preview hóa đơn */}
        <div>
          <Card title="3. Xem trước hóa đơn">
            <div ref={printRef} className="mt-3 p-6 border border-gray-200 rounded-xl bg-white text-sm">

              <div className="center mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Trung tâm âm nhạc</p>
                <p className="title mt-1">ASCENT MUSIC CENTER</p>
                <p className="text-xs text-gray-500 mt-1">📍 Địa chỉ trung tâm · 📞 0901 234 567</p>
              </div>

              <div className="divider" />

              <div className="center mb-3">
                <p className="text-lg font-bold uppercase tracking-widest">Hóa đơn thu học phí</p>
                <p className="text-xs text-gray-500 mt-1">
                  Số: {invoiceNo} · Ngày: {new Date().toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="divider-dot" />

              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-600 py-1">Học viên</td>
                    <td className="font-bold text-right">{selectedStudent?.name || '—'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-1">Môn học</td>
                    <td className="font-semibold text-right">{selectedStudent?.instrument || '—'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-1">Tháng học phí</td>
                    <td className="font-semibold text-right">Tháng {form.month}/{form.year}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-1">Hình thức TT</td>
                    <td className="font-semibold text-right">{form.method}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-1">Người thu</td>
                    <td className="font-semibold text-right">{form.collectorName}</td>
                  </tr>
                </tbody>
              </table>

              <div className="divider-dot" />

              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-600 py-1">Học phí</td>
                    <td className="font-semibold text-right">
                      {selectedStudent ? `${selectedStudent.tuition.toLocaleString('vi-VN')}đ` : '—'}
                    </td>
                  </tr>
                  {Number(form.discount) > 0 && (
                    <tr>
                      <td className="text-gray-600 py-1">Giảm giá</td>
                      <td className="text-green-600 font-semibold text-right">
                        -{Number(form.discount).toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td className="font-bold py-2">TỔNG CỘNG</td>
                    <td className="font-bold text-right text-lg">
                      {selectedStudent ? `${totalAmount.toLocaleString('vi-VN')}đ` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {selectedStudent && (
                <div className="text-center my-3">
                  <span className="paid-box">✅ ĐÃ THANH TOÁN</span>
                </div>
              )}

              {form.note && (
                <p className="text-xs text-gray-500 italic mt-2">Ghi chú: {form.note}</p>
              )}

              <div className="sign-row">
                <div className="sign-col">
                  <p className="text-xs text-gray-600">Người nộp tiền</p>
                  <div className="sign-line">
                    <p className="text-xs">(Ký, ghi rõ họ tên)</p>
                  </div>
                </div>
                <div className="sign-col">
                  <p className="text-xs text-gray-600">Người thu tiền</p>
                  <div className="sign-line">
                    <p className="text-xs">{form.collectorName}</p>
                  </div>
                </div>
              </div>

              <div className="divider-dot mt-4" />
              <p className="text-xs text-gray-400 text-center">
                {new Date().toLocaleString('vi-VN')} · ascent-music.netlify.app
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Lịch sử hóa đơn */}
      {saved.length > 0 && (
        <Card title="Hóa đơn vừa tạo" className="mt-4">
          <div className="flex flex-col gap-2 mt-2">
            {saved.map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{inv.studentName} · {inv.instrument}</p>
                  <p className="text-xs text-gray-500">Tháng {inv.month} · {inv.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{inv.total.toLocaleString('vi-VN')}đ</p>
                  <Badge label="✅ Đã lưu" variant="green" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default InvoicePage;