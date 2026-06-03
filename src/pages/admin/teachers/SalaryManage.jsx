import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const SalaryManage = () => {
  const [month, setMonth]     = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]       = useState(String(new Date().getFullYear()));
  const [teacherData, setTeacherData] = useState([]); // grouped by teacher
  const [bonuses, setBonuses] = useState({});
  const [paidMap, setPaidMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState({});

  const monthKey = `${year}-${month}`;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy lương theo từng lớp
      const res = await api.get(`/teachers/salary?month=${month}&year=${year}`);
      const rows = res.rows || [];

      // Group theo teacher
      const grouped = {};
      rows.forEach(row => {
        if (!grouped[row.id]) {
          grouped[row.id] = {
            id:         row.id,
            name:       row.name,
            instrument: row.instrument,
            phone:      row.phone,
            classes:    [],
          };
        }
        if (row.class_id) {
          grouped[row.id].classes.push({
            class_id:               row.class_id,
            class_name:             row.class_name,
            class_type:             row.class_type,
            teacher_salary:         Number(row.teacher_salary || 0),
            teacher_salary_partial: Number(row.teacher_salary_partial || 0),
            sessions:               Number(row.sessions_this_month || 0),
            class_salary:           Number(row.class_salary || 0),
          });
        }
      });

      setTeacherData(Object.values(grouped));

      // Trạng thái đã trả lương
      const salaryRes = await api.get('/salary');
      const paid = {};
      (salaryRes.rows || [])
        .filter(p => p.month === monthKey)
        .forEach(p => { paid[p.teacher_id] = p; });
      setPaidMap(paid);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, year, monthKey]);

  useEffect(() => { loadData(); }, [loadData]);

  // Tổng lương từ các lớp + thưởng
  const getTotalSalary = (t) => {
    const fromClasses = t.classes.reduce((sum, c) => {
      // Nếu có checkin thì dùng class_salary, không thì tính sessions × rate
      const s = c.class_salary > 0
        ? c.class_salary
        : c.sessions * c.teacher_salary;
      return sum + s;
    }, 0);
    return fromClasses + Number(bonuses[t.id] || 0);
  };

  const totalSalary = teacherData.reduce((sum, t) => sum + getTotalSalary(t), 0);
  const totalPaid   = Object.keys(paidMap).length;

  const handlePay = async (t) => {
    setPaying(prev => ({ ...prev, [t.id]: true }));
    try {
      const total = getTotalSalary(t);
      await api.post('/salary', {
        teacher_id: t.id,
        month:      monthKey,
        amount:     total,
        status:     'paid',
        note:       bonuses[t.id] ? `Thưởng: ${fmt(bonuses[t.id])}` : '',
      });
      toast.success(`✅ Đã thanh toán ${fmt(total)} cho ${t.name}!`);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(prev => ({ ...prev, [t.id]: false }));
    }
  };

  const handlePayAll = async () => {
    const unpaid = teacherData.filter(t => !paidMap[t.id]);
    if (!unpaid.length) { toast.info('Tất cả đã được thanh toán!'); return; }
    try {
      await Promise.all(unpaid.map(t =>
        api.post('/salary', {
          teacher_id: t.id,
          month:      monthKey,
          amount:     getTotalSalary(t),
          status:     'paid',
          note:       '',
        })
      ));
      toast.success(`✅ Đã thanh toán lương cho ${unpaid.length} giáo viên!`);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePrint = () => {
    const content = `
      <html><head><title>Bảng lương tháng ${month}/${year}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:30px}
        h1{text-align:center;font-size:20px}
        h2{text-align:center;font-size:14px;color:#555}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th{background:#f0f0f0;padding:8px;text-align:left;border:1px solid #ddd;font-size:12px}
        td{padding:8px;border:1px solid #ddd;font-size:12px}
        .total{font-weight:bold;background:#fff9e6}
        .subtotal{background:#f0f9ff;font-weight:bold}
        .footer{margin-top:40px;display:flex;justify-content:space-between;text-align:center}
      </style></head>
      <body>
        <h1>ASCENT MUSIC CENTER</h1>
        <h2>BẢNG LƯƠNG THÁNG ${month}/${year}</h2>
        <table>
          <thead>
            <tr>
              <th>STT</th><th>Giáo viên</th><th>Lớp học</th>
              <th>Số buổi</th><th>Lương/buổi</th><th>Thành tiền</th>
              <th>Thưởng</th><th>Tổng</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${teacherData.map((t, i) => {
              const total = getTotalSalary(t);
              const isPaid = !!paidMap[t.id];
              if (t.classes.length === 0) {
                return `<tr>
                  <td>${i+1}</td><td>${t.name}</td><td colspan="4">—</td>
                  <td>${fmt(bonuses[t.id]||0)}</td>
                  <td class="total">${fmt(total)}</td>
                  <td>${isPaid ? '✅ Đã trả' : '⏳ Chưa trả'}</td>
                </tr>`;
              }
              return t.classes.map((c, j) => {
                const cSalary = c.class_salary > 0 ? c.class_salary : c.sessions * c.teacher_salary;
                return `<tr>
                  ${j === 0 ? `<td rowspan="${t.classes.length}">${i+1}</td><td rowspan="${t.classes.length}">${t.name}</td>` : ''}
                  <td>${c.class_name}</td>
                  <td>${c.sessions}</td>
                  <td>${fmt(c.teacher_salary)}</td>
                  <td>${fmt(cSalary)}</td>
                  ${j === 0 ? `<td rowspan="${t.classes.length}">${fmt(bonuses[t.id]||0)}</td>
                    <td rowspan="${t.classes.length}" class="subtotal">${fmt(total)}</td>
                    <td rowspan="${t.classes.length}">${isPaid ? '✅ Đã trả' : '⏳ Chưa trả'}</td>` : ''}
                </tr>`;
              }).join('');
            }).join('')}
            <tr class="total">
              <td colspan="7" style="text-align:right">TỔNG CỘNG:</td>
              <td colspan="2">${fmt(totalSalary)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <div><p>Người lập bảng</p><br/><br/><p>(Ký, ghi rõ họ tên)</p></div>
          <div><p>Giám đốc</p><br/><br/><p>(Ký, đóng dấu)</p></div>
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.print();
  };

  if (loading) return (
    <MainLayout title="Quản lý lương giáo viên">
      <p className="text-center text-gray-400 py-20">Đang tải dữ liệu...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Quản lý lương giáo viên">
      {/* Bộ lọc */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto">
          {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
          {['2024','2025','2026','2027'].map(y => <option key={y}>{y}</option>)}
        </select>
        <Button variant="secondary" icon="🖨️" onClick={handlePrint}>In bảng lương</Button>
        <Button icon="💰" onClick={handlePayAll}>Thanh toán tất cả</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{teacherData.length}</p>
          <p className="text-xs text-gray-500 mt-1">Giáo viên</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-orange-600">{fmt(totalSalary)}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng lương tháng {month}/{year}</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalPaid}/{teacherData.length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
        </div>
      </div>

      {/* Danh sách */}
      {teacherData.length === 0 ? (
        <Card><p className="text-center text-gray-400 py-10">Không có dữ liệu</p></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {teacherData.map(t => {
            const total  = getTotalSalary(t);
            const isPaid = !!paidMap[t.id];
            const paidInfo = paidMap[t.id];
            const totalSessions = t.classes.reduce((s, c) => s + c.sessions, 0);

            return (
              <Card key={t.id}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={t.instrument} variant="blue" />
                      <span className="text-xs text-gray-400">• {totalSessions} buổi tháng này</span>
                      {isPaid && <Badge label="✅ Đã trả lương" variant="green" />}
                    </div>

                    {/* Bảng lớp học */}
                    {t.classes.length > 0 ? (
                      <div className="mb-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-1.5 px-2 text-xs text-gray-500 font-medium">Lớp học</th>
                              <th className="text-center py-1.5 px-2 text-xs text-gray-500 font-medium">Hình thức</th>
                              <th className="text-center py-1.5 px-2 text-xs text-gray-500 font-medium">Buổi dạy</th>
                              <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Lương/buổi</th>
                              <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.classes.map(c => {
                              const cSalary = c.class_salary > 0
                                ? c.class_salary
                                : c.sessions * c.teacher_salary;
                              return (
                                <tr key={c.class_id} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="py-1.5 px-2 text-gray-700 font-medium">{c.class_name}</td>
                                  <td className="py-1.5 px-2 text-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                      ${c.class_type === '1v1'
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'bg-green-100 text-green-600'}`}>
                                      {c.class_type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-bold text-gray-800">
                                    {c.sessions}
                                  </td>
                                  <td className="py-1.5 px-2 text-right text-gray-600">
                                    {fmt(c.teacher_salary)}
                                    {c.class_type === 'group' && c.teacher_salary_partial > 0 && (
                                      <span className="block text-xs text-orange-500">
                                        vắng: {fmt(c.teacher_salary_partial)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-semibold text-primary-700">
                                    {fmt(cSalary)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-3">Chưa có lớp hoặc chưa dạy buổi nào tháng này</p>
                    )}

                    {/* Tổng + Thưởng */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {!isPaid && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600">Thưởng thêm:</p>
                          <input
                            type="number"
                            value={bonuses[t.id] ?? 0}
                            onChange={e => setBonuses(prev => ({ ...prev, [t.id]: e.target.value }))}
                            className="input-field text-sm w-32"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">đ</span>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Tổng lương tháng này</p>
                          <p className="text-xl font-bold text-orange-600">{fmt(total)}</p>
                        </div>
                      </div>
                    </div>

                    {isPaid && paidInfo && (
                      <div className="mt-2 p-2 bg-green-50 rounded-xl text-xs text-green-700">
                        ✅ Đã thanh toán {fmt(paidInfo.amount)}
                        {paidInfo.paid_at && ` · ${new Date(paidInfo.paid_at).toLocaleDateString('vi-VN')}`}
                      </div>
                    )}
                  </div>

                  {/* Nút trả lương */}
                  <div className="flex-shrink-0">
                    {!isPaid ? (
                      <Button size="sm" icon="💰" loading={paying[t.id]} onClick={() => handlePay(t)}>
                        Trả lương
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled>✅ Đã trả</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export default SalaryManage;