import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { toast } from 'react-toastify';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const TYPES       = [
  { value: '1v1',   label: '🎹 1 kèm 1',        fee: 200000 },
  { value: 'group', label: '👥 Nhóm (tối đa 3)', fee: 150000 },
];
const BILLING_TYPES = [
  { value: 'session', label: '🎯 Theo buổi'  },
  { value: 'month',   label: '📅 Theo tháng' },
];
const TEACHERS = {
  Piano: 'Nguyễn Thị Mai', Guitar: 'Trần Văn Hùng',
  Violin: 'Lê Thị Hoa', 'Thanh nhạc': 'Phạm Minh Tuấn',
};

const EMPTY_STUDENT = {
  name: '', dob: '', gender: 'Nam', phone: '',
  parentName: '', address: '', email: '',
};
const EMPTY_COURSE = {
  instrument: 'Piano', level: 'Sơ cấp', type: '1v1',
  billingType: 'session',
  sessions: 10, sessionsPerWeek: 2, pricePerSession: 200000,
  duration: 3,
  startDate: '', schedule: '', teacher: 'Nguyễn Thị Mai',
  discount: 0, method: 'Tiền mặt', note: '',
};

const getStorage = (key, def = []) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
};
const setStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const EnrollmentPage = () => {
  const [tab, setTab]       = useState('unpaid');
  const [student, setStudent] = useState(EMPTY_STUDENT);
  const [course, setCourse]   = useState(EMPTY_COURSE);
  const [invoices, setInvoices] = useState(() => getStorage('invoices_v2', []));
  const [saving, setSaving]   = useState(false);
  
  const [confirmModal, setConfirmModal] = useState(null);
  const [payForm, setPayForm] = useState({ method: 'Tiền mặt', note: '' });
  const [printModal, setPrintModal] = useState(null);

  const feePerMonth = TYPES.find(t => t.value === course.type)?.fee || 200000;
  const totalFee    = course.billingType === 'session'
    ? course.pricePerSession * course.sessions - Number(course.discount || 0)
    : feePerMonth * course.duration - Number(course.discount || 0);
  const weeksEst    = course.sessionsPerWeek > 0
    ? Math.ceil(course.sessions / course.sessionsPerWeek) : 0;
  const endDate = (() => {
    if (!course.startDate) return '—';
    const d = new Date(course.startDate);
    if (course.billingType === 'session') d.setDate(d.getDate() + weeksEst * 7);
    else d.setMonth(d.getMonth() + Number(course.duration));
    return d.toLocaleDateString('vi-VN');
  })();

  const handleStudentChange = e => setStudent({ ...student, [e.target.name]: e.target.value });
  const handleCourseChange  = e => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev, [name]: value,
      ...(name === 'instrument' ? { teacher: TEACHERS[value] || '' } : {}),
      ...(name === 'type' ? { pricePerSession: TYPES.find(t => t.value === value)?.fee || 200000 } : {}),
    }));
  };

  const saveInvoices = (list) => { setInvoices(list); setStorage('invoices_v2', list); };

  const handleCreate = async () => {
    if (!student.name || !student.phone) { toast.error('Điền đầy đủ thông tin học viên!'); return; }
    if (!course.startDate)               { toast.error('Chọn ngày bắt đầu!'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const newInvoice = {
      id:          `HD${Date.now().toString().slice(-8)}`,
      student:     { ...student },
      course:      { ...course },
      feePerMonth, totalFee, endDate,
      status:      'unpaid',
      createdDate: new Date().toLocaleDateString('vi-VN'),
      createdAt:   new Date().toISOString(),
      paidDate:    null, paidMethod: null, paidNote: null,
    };
    saveInvoices([newInvoice, ...invoices]);
    toast.success('✅ Tạo hóa đơn thành công!');
    setStudent(EMPTY_STUDENT);
    setCourse(EMPTY_COURSE);
  
    setTab('unpaid');
    setSaving(false);
  };

  const handleConfirmPay = (inv) => {
    setConfirmModal(inv);
    setPayForm({ method: inv.course?.method || 'Tiền mặt', note: '' });
  };

  const handleSavePay = () => {
    const updated = invoices.map(inv =>
      inv.id === confirmModal.id
        ? { ...inv, status: 'paid', paidDate: new Date().toLocaleDateString('vi-VN'), paidMethod: payForm.method, paidNote: payForm.note }
        : inv
    );
    saveInvoices(updated);
    toast.success(`✅ Đã xác nhận thanh toán cho ${confirmModal.student.name}!`);
    setConfirmModal(null);
  };

  const unpaidList  = invoices.filter(i => i.status === 'unpaid');
  const paidList    = invoices.filter(i => i.status === 'paid');
  const totalPaid   = paidList.reduce((sum, i) => sum + i.totalFee, 0);

  const PrintInvoice = ({ inv }) => {
    if (!inv) return null;
    return (
      <div className="p-6 border border-gray-200 rounded-xl bg-white text-sm">
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Trung tâm âm nhạc</p>
          <p className="text-2xl font-bold">ASCENT MUSIC CENTER</p>
          <p className="text-xs text-gray-500 mt-1">📞 0901 234 567</p>
        </div>
        <div className="border-t-2 border-b-2 border-gray-900 py-2 text-center mb-4">
          <p className="text-lg font-bold uppercase">Hóa đơn đăng ký học</p>
          <p className="text-xs text-gray-500 mt-1">Số: {inv.id} · Ngày: {inv.createdDate}</p>
        </div>
        <table className="w-full text-sm mb-3">
          <tbody>
            {[
              ['Học viên',    inv.student.name],
              ['Phụ huynh',   inv.student.parentName || '—'],
              ['Điện thoại',  inv.student.phone],
              ['Email',       inv.student.email || '—'],
              ['Nhạc cụ',     inv.course.instrument],
              ['Trình độ',    inv.course.level],
              ['Hình thức',   TYPES.find(t => t.value === inv.course.type)?.label],
              ['Giáo viên',   inv.course.teacher],
              ['Lịch học',    inv.course.schedule || '—'],
              ['Ngày bắt đầu',inv.course.startDate],
              ['Ngày kết thúc',inv.endDate],
              inv.course.billingType === 'session'
                ? ['Số buổi học', `${inv.course.sessions} buổi`]
                : ['Thời hạn',    `${inv.course.duration} tháng`],
            ].map(([l, v]) => (
              <tr key={l}>
                <td className="text-gray-600 py-1">{l}</td>
                <td className="font-semibold text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-gray-300 my-3" />
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="text-gray-600">
                {inv.course.billingType === 'session'
                  ? `${inv.course.pricePerSession?.toLocaleString('vi-VN')}đ × ${inv.course.sessions} buổi`
                  : `${inv.feePerMonth?.toLocaleString('vi-VN')}đ × ${inv.course.duration} tháng`}
              </td>
              <td className="font-semibold text-right">
                {inv.course.billingType === 'session'
                  ? (inv.course.pricePerSession * inv.course.sessions).toLocaleString('vi-VN')
                  : (inv.feePerMonth * inv.course.duration).toLocaleString('vi-VN')}đ
              </td>
            </tr>
            {Number(inv.course.discount) > 0 && (
              <tr>
                <td className="text-gray-600">Giảm giá</td>
                <td className="text-green-600 font-semibold text-right">-{Number(inv.course.discount).toLocaleString('vi-VN')}đ</td>
              </tr>
            )}
            <tr>
              <td className="font-bold text-base border-t-2 border-gray-900 pt-2">TỔNG THANH TOÁN</td>
              <td className="font-bold text-right text-xl text-orange-600 border-t-2 border-gray-900 pt-2">{inv.totalFee.toLocaleString('vi-VN')}đ</td>
            </tr>
          </tbody>
        </table>
        <div className="text-center my-3">
          {inv.status === 'paid'
            ? <span className="border-2 border-green-700 px-4 py-1 font-bold text-sm text-green-700">✅ ĐÃ THANH TOÁN</span>
            : <span className="border-2 border-red-600 px-4 py-1 font-bold text-sm text-red-600">⏳ CHƯA THANH TOÁN</span>}
        </div>
        {inv.paidDate && (
          <p className="text-xs text-center text-gray-500">Thanh toán ngày {inv.paidDate} · {inv.paidMethod}</p>
        )}
        {inv.course.note && <p className="text-xs text-gray-500 italic mt-2">Ghi chú: {inv.course.note}</p>}
        <div className="flex justify-between mt-10 text-center text-xs">
          <div className="w-5/12">
            <p className="text-gray-600">Người nộp tiền</p>
            <div className="mt-16 border-t border-gray-400 pt-1">(Ký, ghi rõ họ tên)</div>
          </div>
          <div className="w-5/12">
            <p className="text-gray-600">Người thu tiền</p>
            <div className="mt-16 border-t border-gray-400 pt-1">(Ký, đóng dấu)</div>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-200 mt-4 pt-2 text-center text-xs text-gray-400">
          {new Date().toLocaleString('vi-VN')} · ascent-music.netlify.app
        </div>
      </div>
    );
  };

  const handlePrint = (inv) => {
    const el = document.getElementById('print-invoice-content');
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Hóa đơn ${inv.id}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:40px;font-size:14px;line-height:1.6}
      table{width:100%;border-collapse:collapse}td{padding:5px 4px;font-size:13px;vertical-align:top}
      td:last-child{text-align:right;font-weight:bold}@media print{button{display:none!important}}</style>
      </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <MainLayout title="Quản lý hóa đơn">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{unpaidList.length}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa thanh toán</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{paidList.length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
        </div>
        <div className="card text-center">
          <p className="text-lg font-bold text-orange-600">{totalPaid.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Tổng đã thu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5 border-b border-gray-100">
        <div className="flex gap-2">
          {[
            { key: 'unpaid',  label: `⏳ Chưa thanh toán (${unpaidList.length})`  },
            { key: 'paid',    label: `✅ Lịch sử thanh toán (${paidList.length})` },
            { key: 'new',     label: '➕ Tạo hóa đơn mới'                          },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
                ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab chưa thanh toán */}
      {tab === 'unpaid' && (
        <div className="flex flex-col gap-3">
          {unpaidList.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Không có hóa đơn chưa thanh toán</p></Card>
          ) : unpaidList.map(inv => (
            <Card key={inv.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold flex-shrink-0">
                    {inv.student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{inv.student.name}</p>
                      <Badge label={inv.course.instrument} variant="blue" />
                      <Badge label="⏳ Chưa thanh toán" variant="red" />
                    </div>
                    <p className="text-sm text-gray-500">📱 {inv.student.phone}</p>
                    <p className="text-xs text-gray-400">
                      {inv.course.billingType === 'session'
                        ? `${inv.course.sessions} buổi · ${inv.course.pricePerSession?.toLocaleString('vi-VN')}đ/buổi`
                        : `${inv.course.duration} tháng · ${inv.feePerMonth?.toLocaleString('vi-VN')}đ/tháng`}
                    </p>
                    <p className="text-xs text-gray-400">📅 {inv.course.startDate} → {inv.endDate}</p>
                    <p className="text-xs text-gray-400">Số HĐ: {inv.id} · Tạo: {inv.createdDate}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-orange-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => setPrintModal(inv)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      🖨️ In
                    </button>
                    <button onClick={() => handleConfirmPay(inv)}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
                      ✅ Xác nhận TT
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab lịch sử */}
      {tab === 'paid' && (
        <div className="flex flex-col gap-3">
          {/* Tổng */}
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-700">💰 Tổng doanh thu từ học viên</p>
              <p className="text-xs text-green-600 mt-0.5">{paidList.length} hóa đơn đã thanh toán</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('vi-VN')}đ</p>
          </div>

          {paidList.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Chưa có hóa đơn nào được thanh toán</p></Card>
          ) : paidList.map(inv => (
            <Card key={inv.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                    {inv.student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{inv.student.name}</p>
                      <Badge label={inv.course.instrument} variant="blue" />
                      <Badge label="✅ Đã thanh toán" variant="green" />
                    </div>
                    <p className="text-sm text-gray-500">📱 {inv.student.phone}</p>
                    <p className="text-xs text-gray-400">
                      {inv.course.billingType === 'session'
                        ? `${inv.course.sessions} buổi`
                        : `${inv.course.duration} tháng`}
                      · {inv.course.startDate} → {inv.endDate}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      Thanh toán: {inv.paidDate} · {inv.paidMethod}
                    </p>
                    {inv.paidNote && <p className="text-xs text-gray-400 italic">"{inv.paidNote}"</p>}
                    <p className="text-xs text-gray-400">Số HĐ: {inv.id}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-green-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                  <button onClick={() => setPrintModal(inv)}
                    className="mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    🖨️ In hóa đơn
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab tạo mới */}
      {tab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Thông tin học viên */}
          <Card title="👤 Thông tin học viên">
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2">
                <Input label="Họ và tên" name="name" value={student.name}
                  onChange={handleStudentChange} required placeholder="Nguyễn Văn A" />
              </div>
              <Input label="Ngày sinh" name="dob" type="date" value={student.dob} onChange={handleStudentChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Giới tính</label>
                <select name="gender" value={student.gender} onChange={handleStudentChange} className="input-field">
                  <option>Nam</option><option>Nữ</option>
                </select>
              </div>
              <Input label="SĐT" name="phone" value={student.phone}
                onChange={handleStudentChange} required placeholder="0901234567" />
              <Input label="Tên phụ huynh" name="parentName" value={student.parentName}
                onChange={handleStudentChange} placeholder="Nguyễn Thị B" />
              <div className="col-span-2">
                <Input label="Email" name="email" type="email" value={student.email}
                  onChange={handleStudentChange} placeholder="email@gmail.com" />
              </div>
              <div className="col-span-2">
                <Input label="Địa chỉ" name="address" value={student.address}
                  onChange={handleStudentChange} placeholder="Địa chỉ..." />
              </div>
            </div>
          </Card>

          {/* Thông tin khóa học */}
          <Card title="🎵 Thông tin khóa học">
            <div className="grid grid-cols-2 gap-3 mt-2">

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nhạc cụ</label>
                <select name="instrument" value={course.instrument} onChange={handleCourseChange} className="input-field">
                  {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trình độ</label>
                <select name="level" value={course.level} onChange={handleCourseChange} className="input-field">
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              {/* Hình thức học */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức học</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setCourse({ ...course, type: t.value, pricePerSession: t.fee })}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all
                        ${course.type === t.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                      {t.label}
                      <p className="text-xs font-normal opacity-80">{t.fee.toLocaleString('vi-VN')}đ/buổi</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hình thức tính phí */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tính học phí theo</label>
                <div className="grid grid-cols-2 gap-2">
                  {BILLING_TYPES.map(b => (
                    <button key={b.value} type="button"
                      onClick={() => setCourse({ ...course, billingType: b.value })}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all
                        ${course.billingType === b.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theo buổi */}
              {course.billingType === 'session' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Tổng số buổi <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={course.sessions}
                      onChange={e => setCourse({ ...course, sessions: Number(e.target.value) })}
                      className="input-field" placeholder="VD: 10" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Số buổi/tuần</label>
                    <select value={course.sessionsPerWeek}
                      onChange={e => setCourse({ ...course, sessionsPerWeek: Number(e.target.value) })}
                      className="input-field">
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} buổi/tuần</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Giá/buổi (đ) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={course.pricePerSession}
                      onChange={e => setCourse({ ...course, pricePerSession: Number(e.target.value) })}
                      className="input-field" placeholder="200000" />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">Tự động tính</p>
                    <p className="text-sm font-bold text-blue-800">~{weeksEst} tuần</p>
                    <p className="text-xs text-blue-600">{course.sessions} buổi / {course.sessionsPerWeek} buổi/tuần</p>
                  </div>
                </>
              )}

              {/* Theo tháng */}
              {course.billingType === 'month' && (
                <>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Thời hạn</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1,3,6,12].map(d => (
                        <button key={d} type="button"
                          onClick={() => setCourse({ ...course, duration: d })}
                          className={`py-2 rounded-xl text-sm font-medium border transition-all
                            ${course.duration === d ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                          {d} tháng
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Học phí/tháng (đ)</label>
                    <input type="number" min="0" value={course.pricePerSession}
                      onChange={e => setCourse({ ...course, pricePerSession: Number(e.target.value) })}
                      className="input-field" />
                  </div>
                </>
              )}

              <Input label="Ngày bắt đầu" name="startDate" type="date"
                value={course.startDate} onChange={handleCourseChange} />
              <Input label="Lịch học" name="schedule" value={course.schedule}
                onChange={handleCourseChange} placeholder="T2,T4 - 08:00" />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Giáo viên</label>
                <input value={course.teacher || TEACHERS[course.instrument]} readOnly
                  className="input-field bg-gray-50 cursor-not-allowed" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức TT</label>
                <select name="method" value={course.method} onChange={handleCourseChange} className="input-field">
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                  <option>Ví điện tử</option>
                </select>
              </div>

              <Input label="Giảm giá (đ)" name="discount" value={course.discount}
                onChange={handleCourseChange} placeholder="0" />

              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea name="note" value={course.note} onChange={handleCourseChange}
                  rows={2} className="input-field resize-none" placeholder="Ghi chú..." />
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {course.billingType === 'session'
                    ? `${course.pricePerSession.toLocaleString('vi-VN')}đ × ${course.sessions} buổi`
                    : `${course.pricePerSession.toLocaleString('vi-VN')}đ × ${course.duration} tháng`}
                </span>
                <span className="font-medium">
                  {(course.billingType === 'session'
                    ? course.pricePerSession * course.sessions
                    : course.pricePerSession * course.duration
                  ).toLocaleString('vi-VN')}đ
                </span>
              </div>
              {Number(course.discount) > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Giảm giá</span>
                  <span className="text-green-600 font-medium">-{Number(course.discount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between border-t border-orange-200 pt-2 mt-2">
                <span className="font-bold">Tổng thanh toán</span>
                <span className="text-xl font-bold text-orange-600">{totalFee.toLocaleString('vi-VN')}đ</span>
              </div>
              {course.startDate && (
                <p className="text-xs text-gray-500 mt-1">📅 {course.startDate} → {endDate}</p>
              )}
            </div>

            <Button fullWidth loading={saving} icon="✅" onClick={handleCreate}
              className="mt-4" disabled={!student.name || !course.startDate}>
              Tạo hóa đơn & Lưu
            </Button>
          </Card>
        </div>
      )}

      {/* Modal xác nhận thanh toán */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title="Xác nhận thanh toán"
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmModal(null)}>Hủy</Button>
          <Button icon="✅" onClick={handleSavePay}>Xác nhận đã thu</Button>
        </>}>
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-800">{confirmModal.student.name}</p>
              <p className="text-sm text-gray-500">{confirmModal.course.instrument} · {confirmModal.course.billingType === 'session' ? `${confirmModal.course.sessions} buổi` : `${confirmModal.course.duration} tháng`}</p>
              <p className="text-xl font-bold text-orange-600 mt-2">{confirmModal.totalFee.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Hình thức thanh toán</label>
              <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })} className="input-field">
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
                <option>Ví điện tử</option>
              </select>
            </div>
            <Input label="Ghi chú" value={payForm.note}
              onChange={e => setPayForm({ ...payForm, note: e.target.value })}
              placeholder="Ghi chú thêm..." />
          </div>
        )}
      </Modal>

      {/* Modal in hóa đơn */}
      <Modal isOpen={!!printModal} onClose={() => setPrintModal(null)}
        title="Hóa đơn" size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setPrintModal(null)}>Đóng</Button>
          <Button icon="🖨️" onClick={() => handlePrint(printModal)}>In hóa đơn</Button>
        </>}>
        <div id="print-invoice-content">
          <PrintInvoice inv={printModal} />
        </div>
      </Modal>

    </MainLayout>
  );
};

export default EnrollmentPage;