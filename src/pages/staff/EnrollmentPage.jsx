import React, { useState, useEffect } from 'react';
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

const SAMPLE_STUDENTS = [
  { id: 'HV001', name: 'Nguyễn Văn An',  dob: '2010-05-12', gender: 'Nam', phone: '0901234567', parentName: 'Nguyễn Thị B',   address: 'Hà Nội',    email: 'an@gmail.com',   instrument: 'Piano'      },
  { id: 'HV002', name: 'Trần Thị Bình',  dob: '2008-09-20', gender: 'Nữ',  phone: '0912345678', parentName: 'Trần Văn C',    address: 'Nam Định',   email: 'binh@gmail.com', instrument: 'Guitar'     },
  { id: 'HV003', name: 'Lê Minh Châu',   dob: '2012-03-08', gender: 'Nam', phone: '0923456789', parentName: 'Lê Thị D',     address: 'Hà Nội',    email: 'chau@gmail.com', instrument: 'Violin'     },
  { id: 'HV004', name: 'Hoàng Văn Em',   dob: '2011-07-22', gender: 'Nam', phone: '0945678901', parentName: 'Hoàng Thị F',  address: 'Hải Phòng', email: 'em@gmail.com',   instrument: 'Piano'      },
  { id: 'HV005', name: 'Phạm Thị Dung',  dob: '2005-11-15', gender: 'Nữ',  phone: '0934567890', parentName: 'Phạm Văn G',   address: 'Hà Nội',    email: 'dung@gmail.com', instrument: 'Thanh nhạc' },
];

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
  const [tab, setTab]           = useState('unpaid');
  const [invoices, setInvoices] = useState(() => getStorage('invoices_v2', []));
  const [saving, setSaving]     = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [payForm, setPayForm]   = useState({ method: 'Tiền mặt', note: '' });
  const [printModal, setPrintModal] = useState(null);

  // State tìm kiếm học viên
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [isNewStudent, setIsNewStudent]   = useState(false);
  const [newStudent, setNewStudent]       = useState({
    name: '', phone: '', parentName: '', address: '', email: '', gender: 'Nam', dob: ''
  });

  // Course state
  const [course, setCourse] = useState(EMPTY_COURSE);

  // Load danh sách học viên
  const allStudents = [
    ...getStorage('students_data', SAMPLE_STUDENTS),
    ...SAMPLE_STUDENTS.filter(s =>
      !getStorage('students_data', []).find(ss => ss.id === s.id)
    )
  ];

  // Tìm kiếm học viên
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const q = searchQuery.toLowerCase();
    const results = allStudents.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.id?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(results);
    setShowDropdown(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setSearchQuery(s.name);
    setShowDropdown(false);
    // Tự động điền nhạc cụ theo học viên
    if (s.instrument) {
      setCourse(prev => ({
        ...prev,
        instrument: s.instrument,
        teacher: TEACHERS[s.instrument] || prev.teacher,
      }));
    }
    toast.success(`✅ Đã chọn học viên: ${s.name}`);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setSearchResults([]);
    
  };

  const handleCourseChange = e => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev, [name]: value,
      ...(name === 'instrument' ? { teacher: TEACHERS[value] || '' } : {}),
      ...(name === 'type' ? { pricePerSession: TYPES.find(t => t.value === value)?.fee || 200000 } : {}),
    }));
  };

  const feePerMonth = TYPES.find(t => t.value === course.type)?.fee || 200000;
  const totalFee    = course.billingType === 'session'
    ? course.pricePerSession * course.sessions - Number(course.discount || 0)
    : course.pricePerSession * course.duration - Number(course.discount || 0);
  const weeksEst    = course.sessionsPerWeek > 0
    ? Math.ceil(course.sessions / course.sessionsPerWeek) : 0;
  const endDate = (() => {
    if (!course.startDate) return '—';
    const d = new Date(course.startDate);
    if (course.billingType === 'session') d.setDate(d.getDate() + weeksEst * 7);
    else d.setMonth(d.getMonth() + Number(course.duration));
    return d.toLocaleDateString('vi-VN');
  })();

  const saveInvoices = (list) => { setInvoices(list); setStorage('invoices_v2', list); };

  const handleCreate = async () => {
    const studentData = isNewStudent ? newStudent : selectedStudent;
    if (!studentData?.name || !studentData?.phone) { toast.error('Chọn hoặc nhập thông tin học viên!'); return; }
    if (!course.startDate) { toast.error('Chọn ngày bắt đầu!'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    // Nếu là học viên mới thì lưu vào danh sách
    if (isNewStudent) {
      const newSt = { ...newStudent, id: `HV${Date.now()}`, status: 'active', createdAt: new Date().toISOString() };
      const existing = getStorage('students_data', SAMPLE_STUDENTS);
      setStorage('students_data', [newSt, ...existing]);
    }

    const newInvoice = {
      id:          `HD${Date.now().toString().slice(-8)}`,
      studentId:   studentData.id || `HV${Date.now()}`,
      student:     studentData,
      course:      { ...course },
      feePerMonth, totalFee, endDate,
      status:      'unpaid',
      createdDate: new Date().toLocaleDateString('vi-VN'),
      createdAt:   new Date().toISOString(),
      paidDate: null, paidMethod: null, paidNote: null,
    };
    saveInvoices([newInvoice, ...invoices]);
    toast.success('✅ Tạo hóa đơn thành công!');
    setSelectedStudent(null);
    setSearchQuery('');
    setNewStudent({ name: '', phone: '', parentName: '', address: '', email: '', gender: 'Nam', dob: '' });
    setCourse(EMPTY_COURSE);
    setIsNewStudent(false);
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

  const unpaidList = invoices.filter(i => i.status === 'unpaid');
  const paidList   = invoices.filter(i => i.status === 'paid');
  const totalPaid  = paidList.reduce((sum, i) => sum + i.totalFee, 0);

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
              ['Mã học viên',  inv.studentId],
              ['Học viên',     inv.student.name],
              ['Phụ huynh',    inv.student.parentName || '—'],
              ['Điện thoại',   inv.student.phone],
              ['Email',        inv.student.email || '—'],
              ['Địa chỉ',      inv.student.address || '—'],
              ['Nhạc cụ',      inv.course.instrument],
              ['Trình độ',     inv.course.level],
              ['Hình thức',    TYPES.find(t => t.value === inv.course.type)?.label],
              ['Giáo viên',    inv.course.teacher],
              ['Lịch học',     inv.course.schedule || '—'],
              ['Ngày bắt đầu', inv.course.startDate],
              ['Ngày kết thúc',inv.endDate],
              inv.course.billingType === 'session'
                ? ['Số buổi', `${inv.course.sessions} buổi`]
                : ['Thời hạn', `${inv.course.duration} tháng`],
            ].map(([l, v]) => (
              <tr key={l}><td className="text-gray-600 py-1">{l}</td><td className="font-semibold text-right">{v}</td></tr>
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
                  : `${inv.course.pricePerSession?.toLocaleString('vi-VN')}đ × ${inv.course.duration} tháng`}
              </td>
              <td className="font-semibold text-right">
                {(inv.course.billingType === 'session'
                  ? inv.course.pricePerSession * inv.course.sessions
                  : inv.course.pricePerSession * inv.course.duration
                ).toLocaleString('vi-VN')}đ
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
        {inv.paidDate && <p className="text-xs text-center text-gray-500">Thanh toán {inv.paidDate} · {inv.paidMethod}</p>}
        <div className="flex justify-between mt-10 text-center text-xs">
          <div className="w-5/12"><p className="text-gray-600">Người nộp tiền</p><div className="mt-16 border-t border-gray-400 pt-1">(Ký, ghi rõ họ tên)</div></div>
          <div className="w-5/12"><p className="text-gray-600">Người thu tiền</p><div className="mt-16 border-t border-gray-400 pt-1">(Ký, đóng dấu)</div></div>
        </div>
        <div className="border-t border-dashed border-gray-200 mt-4 pt-2 text-center text-xs text-gray-400">
          {new Date().toLocaleString('vi-VN')} · ascent-music.netlify.app
        </div>
      </div>
    );
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
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {[
          { key: 'unpaid', label: `⏳ Chưa TT (${unpaidList.length})` },
          { key: 'paid',   label: `✅ Lịch sử (${paidList.length})`   },
          { key: 'new',    label: '➕ Tạo hóa đơn'                     },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab chưa thanh toán */}
      {tab === 'unpaid' && (
        <div className="flex flex-col gap-3">
          {unpaidList.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Không có hóa đơn chưa thanh toán 🎉</p></Card>
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
                      <Badge label={`#${inv.studentId}`} variant="gray" />
                      <Badge label={inv.course.instrument} variant="blue" />
                      <Badge label="⏳ Chưa TT" variant="red" />
                    </div>
                    <p className="text-sm text-gray-500">📱 {inv.student.phone}</p>
                    <p className="text-xs text-gray-400">
                      {inv.course.billingType === 'session'
                        ? `${inv.course.sessions} buổi · ${inv.course.pricePerSession?.toLocaleString('vi-VN')}đ/buổi`
                        : `${inv.course.duration} tháng`}
                      · {inv.course.startDate} → {inv.endDate}
                    </p>
                    <p className="text-xs text-gray-400">Số HĐ: {inv.id} · {inv.createdDate}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-orange-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => setPrintModal(inv)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">🖨️ In</button>
                    <button onClick={() => handleConfirmPay(inv)}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">✅ Xác nhận TT</button>
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
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-700">💰 Tổng doanh thu</p>
              <p className="text-xs text-green-600">{paidList.length} hóa đơn</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('vi-VN')}đ</p>
          </div>
          {paidList.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Chưa có hóa đơn nào</p></Card>
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
                      <Badge label={`#${inv.studentId}`} variant="gray" />
                      <Badge label={inv.course.instrument} variant="blue" />
                      <Badge label="✅ Đã TT" variant="green" />
                    </div>
                    <p className="text-sm text-gray-500">📱 {inv.student.phone}</p>
                    <p className="text-xs text-gray-400">
                      {inv.course.billingType === 'session' ? `${inv.course.sessions} buổi` : `${inv.course.duration} tháng`}
                      · {inv.course.startDate} → {inv.endDate}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Đóng: {inv.paidDate} · {inv.paidMethod}</p>
                    {inv.paidNote && <p className="text-xs text-gray-400 italic">"{inv.paidNote}"</p>}
                    <p className="text-xs text-gray-400">Số HĐ: {inv.id}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-green-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                  <button onClick={() => setPrintModal(inv)}
                    className="mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">🖨️ In HĐ</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab tạo mới */}
      {tab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Chọn học viên */}
          <Card title="👤 Chọn học viên">
            <div className="flex flex-col gap-3 mt-2">

              {/* Toggle học viên cũ / mới */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsNewStudent(false); handleClearStudent(); }}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all
                    ${!isNewStudent ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                  🔍 Học viên đã có
                </button>
                <button onClick={() => { setIsNewStudent(true); handleClearStudent(); }}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all
                    ${isNewStudent ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                  ➕ Học viên mới
                </button>
              </div>

              {/* Tìm kiếm học viên đã có */}
              {!isNewStudent && (
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Tìm theo tên, SĐT, mã HV <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSelectedStudent(null); }}
                      placeholder="Nhập tên, SĐT hoặc mã học viên..."
                      className="input-field pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button onClick={handleClearStudent}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>

                  {/* Dropdown kết quả */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                      {searchResults.map(s => (
                        <button key={s.id} onClick={() => handleSelectStudent(s)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 transition-colors text-left border-b border-gray-50 last:border-0">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.phone} · {s.instrument}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{s.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && searchQuery && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 p-4 text-center">
                      <p className="text-sm text-gray-400">Không tìm thấy học viên</p>
                      <button onClick={() => setIsNewStudent(true)}
                        className="text-sm text-primary-600 hover:underline mt-1">
                        + Thêm học viên mới
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin học viên đã chọn */}
              {selectedStudent && !isNewStudent && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-green-700">✅ Đã chọn học viên</p>
                    <button onClick={handleClearStudent} className="text-xs text-red-500 hover:underline">Đổi</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      ['Mã HV',       selectedStudent.id],
                      ['Họ tên',      selectedStudent.name],
                      ['SĐT',         selectedStudent.phone],
                      ['Phụ huynh',   selectedStudent.parentName || '—'],
                      ['Email',       selectedStudent.email || '—'],
                      ['Địa chỉ',     selectedStudent.address || '—'],
                      ['Nhạc cụ',     selectedStudent.instrument],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <span className="text-gray-500">{l}: </span>
                        <span className="font-medium text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form học viên mới */}
              {isNewStudent && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700">💡 Học viên mới sẽ được lưu vào danh sách khi tạo hóa đơn</p>
                  </div>
                  <Input label="Họ và tên" value={newStudent.name} required
                    onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Nguyễn Văn A" />
                  <Input label="Số điện thoại" value={newStudent.phone} required
                    onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} placeholder="0901234567" />
                  <Input label="Tên phụ huynh" value={newStudent.parentName}
                    onChange={e => setNewStudent({ ...newStudent, parentName: e.target.value })} placeholder="Nguyễn Thị B" />
                  <Input label="Email" type="email" value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="email@gmail.com" />
                  <Input label="Địa chỉ" value={newStudent.address}
                    onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} placeholder="Địa chỉ..." />
                </div>
              )}
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

              {course.billingType === 'session' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Tổng số buổi <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={course.sessions}
                      onChange={e => setCourse({ ...course, sessions: Number(e.target.value) })}
                      className="input-field" placeholder="10" />
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
                    <label className="text-sm font-medium text-gray-700">Giá/buổi (đ)</label>
                    <input type="number" min="0" value={course.pricePerSession}
                      onChange={e => setCourse({ ...course, pricePerSession: Number(e.target.value) })}
                      className="input-field" />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center">
                    <p className="text-xs text-blue-600 font-medium">Ước tính</p>
                    <p className="text-sm font-bold text-blue-800">~{weeksEst} tuần</p>
                    <p className="text-xs text-blue-500">{course.sessions} buổi / {course.sessionsPerWeek}/tuần</p>
                  </div>
                </>
              ) : (
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
                  <option>Tiền mặt</option><option>Chuyển khoản</option><option>Ví điện tử</option>
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
              {course.startDate && <p className="text-xs text-gray-500 mt-1">📅 {course.startDate} → {endDate}</p>}
            </div>

            <Button fullWidth loading={saving} icon="✅" onClick={handleCreate}
              className="mt-4"
              disabled={(!selectedStudent && !isNewStudent) || !course.startDate}>
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
              <p className="text-xs text-gray-400">Mã HV: {confirmModal.studentId}</p>
              <p className="text-sm text-gray-500 mt-1">
                {confirmModal.course.instrument} · {confirmModal.course.billingType === 'session'
                  ? `${confirmModal.course.sessions} buổi`
                  : `${confirmModal.course.duration} tháng`}
              </p>
              <p className="text-xl font-bold text-orange-600 mt-2">{confirmModal.totalFee.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Hình thức thanh toán</label>
              <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })} className="input-field">
                <option>Tiền mặt</option><option>Chuyển khoản</option><option>Ví điện tử</option>
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