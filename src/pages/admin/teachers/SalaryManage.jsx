import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import PendingSalary from '../../../components/ui/PendingSalary';
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const SalaryManage = ({ embedded = false }) => {
  const [month, setMonth]           = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]             = useState(String(new Date().getFullYear()));
  const [teacherData, setTeacherData] = useState([]);
  const [bonuses, setBonuses]       = useState({});
  const [paidMap, setPaidMap]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState({});
  const [absentSessions, setAbsentSessions] = useState([]); // buổi có HV vắng
  const [customSalary, setCustomSalary]     = useState({}); // checkinId → số tiền nhập tay
  const [savingSalary, setSavingSalary]     = useState({});

  const monthKey = `${year}-${month}`;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, absentRes] = await Promise.all([
        api.get(`/teachers/salary?month=${month}&year=${year}`),
        api.get(`/teachers/absent-sessions?month=${month}&year=${year}`),
      ]);

      const rows = res.rows || [];
      const grouped = {};
      rows.forEach(row => {
        if (!grouped[row.id]) {
          grouped[row.id] = { id: row.id, name: row.name, instrument: row.instrument, phone: row.phone, classes: [] };
        }
        if (row.class_id) {
          grouped[row.id].classes.push({
            class_id:               row.class_id,
            class_name:             row.class_name,
            class_type:             row.class_type,
            teacher_salary:         Number(row.teacher_salary || 0),
            teacher_salary_partial: Number(row.teacher_salary_partial || 0),
            teacher_salary_absent:  Number(row.teacher_salary_absent || 0),
            sessions:               Number(row.sessions_this_month || 0),
            sessions_partial:       Number(row.sessions_partial || 0),
            class_salary:           Number(row.class_salary || 0),
          });
        }
      });
      setTeacherData(Object.values(grouped));

      // Buổi có HV vắng
      const absent = absentRes.rows || [];
      setAbsentSessions(absent);
      // Set giá trị mặc định cho customSalary từ salary_earned hiện tại
      const initCustom = {};
      absent.forEach(s => { initCustom[s.checkin_id] = s.salary_earned || ''; });
      setCustomSalary(initCustom);

      const salaryRes = await api.get('/salary');
      const paid = {};
      (salaryRes.rows || []).filter(p => p.month === monthKey).forEach(p => { paid[p.teacher_id] = p; });
      setPaidMap(paid);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [month, year, monthKey]);

  useEffect(() => { loadData(); }, [loadData]);

  // Lưu lương riêng cho buổi vắng
  const handleSaveSessionSalary = async (checkinId) => {
    setSavingSalary(prev => ({ ...prev, [checkinId]: true }));
    try {
      await api.patch(`/teachers/checkin/${checkinId}/salary`, {
        salary_earned: customSalary[checkinId] || 0,
        note: 'Admin nhập thủ công (có HV vắng)',
      });
      toast.success('✅ Đã lưu lương buổi!');
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSavingSalary(prev => ({ ...prev, [checkinId]: false })); }
  };

  const getTotalSalary = (t) => {
    const fromClasses = t.classes.reduce((sum, c) => {
      const s = c.class_salary > 0 ? c.class_salary : c.sessions * c.teacher_salary;
      return sum + s;
    }, 0);
    return fromClasses + Number(bonuses[t.id] || 0);
  };

  const totalSalary = teacherData.reduce((sum, t) => sum + getTotalSalary(t), 0);
  // eslint-disable-next-line no-unused-vars
  const totalPaid   = Object.keys(paidMap).length;

  const handlePay = async (t) => {
    setPaying(prev => ({ ...prev, [t.id]: true }));
    try {
      const total = getTotalSalary(t);
      await api.post('/salary', { teacher_id: t.id, month: monthKey, amount: total, status: 'paid', note: bonuses[t.id] ? `Thưởng: ${fmt(bonuses[t.id])}` : '' });
      toast.success(`✅ Đã thanh toán ${fmt(total)} cho ${t.name}!`);
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setPaying(prev => ({ ...prev, [t.id]: false })); }
  };

  const handlePayAll = async () => {
    const unpaid = teacherData.filter(t => !paidMap[t.id]);
    if (!unpaid.length) { toast.info('Tất cả đã được thanh toán!'); return; }
    try {
      await Promise.all(unpaid.map(t => api.post('/salary', { teacher_id: t.id, month: monthKey, amount: getTotalSalary(t), status: 'paid', note: '' })));
      toast.success(`✅ Đã thanh toán lương cho ${unpaid.length} giáo viên!`);
      await loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handlePrint = () => {
    const content = `<html><head><title>Bảng lương tháng ${month}/${year}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px}h1{text-align:center;font-size:20px}h2{text-align:center;font-size:14px;color:#555}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f0f0f0;padding:8px;text-align:left;border:1px solid #ddd;font-size:12px}td{padding:8px;border:1px solid #ddd;font-size:12px}.total{font-weight:bold;background:#fff9e6}.subtotal{background:#f0f9ff;font-weight:bold}.footer{margin-top:40px;display:flex;justify-content:space-between;text-align:center}</style></head>
      <body><h1>ASCENT MUSIC CENTER</h1><h2>BẢNG LƯƠNG THÁNG ${month}/${year}</h2>
      <table><thead><tr><th>STT</th><th>Giáo viên</th><th>Lớp học</th><th>Số buổi</th><th>Lương/buổi</th><th>Thành tiền</th><th>Thưởng</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
      <tbody>${teacherData.map((t,i)=>{const total=getTotalSalary(t);const isPaid=!!paidMap[t.id];if(!t.classes.length)return`<tr><td>${i+1}</td><td>${t.name}</td><td colspan="4">—</td><td>${fmt(bonuses[t.id]||0)}</td><td class="total">${fmt(total)}</td><td>${isPaid?'✅ Đã trả':'⏳ Chưa trả'}</td></tr>`;return t.classes.map((c,j)=>{const cSalary=c.class_salary>0?c.class_salary:c.sessions*c.teacher_salary;return`<tr>${j===0?`<td rowspan="${t.classes.length}">${i+1}</td><td rowspan="${t.classes.length}">${t.name}</td>`:''}<td>${c.class_name}</td><td>${c.sessions}</td><td>${fmt(c.teacher_salary)}</td><td>${fmt(cSalary)}</td>${j===0?`<td rowspan="${t.classes.length}">${fmt(bonuses[t.id]||0)}</td><td rowspan="${t.classes.length}" class="subtotal">${fmt(total)}</td><td rowspan="${t.classes.length}">${isPaid?'✅ Đã trả':'⏳ Chưa trả'}</td>`:''}</tr>`;}).join('');}).join('')}
      <tr class="total"><td colspan="7" style="text-align:right">TỔNG CỘNG:</td><td colspan="2">${fmt(totalSalary)}</td></tr>
      </tbody></table>
      <div class="footer"><div><p>Người lập bảng</p><br/><br/><p>(Ký, ghi rõ họ tên)</p></div><div><p>Giám đốc</p><br/><br/><p>(Ký, đóng dấu)</p></div></div>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.print();
  };

  if (loading) {
    if (embedded) return <p className="text-center text-gray-400 py-20">Đang tải dữ liệu...</p>;
    return <MainLayout title="Quản lý lương giáo viên"><p className="text-center text-gray-400 py-20">Đang tải dữ liệu...</p></MainLayout>;
  }

  const mainContent = (
  <>
    <div className="flex gap-3 mb-5 flex-wrap">
      <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto">
        {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
      </select>
      <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
        {['2024','2025','2026','2027'].map(y => <option key={y}>{y}</option>)}
      </select>
      <Button variant="secondary" icon="🖨" onClick={handlePrint}>In bảng lương</Button>
      <Button icon="💰" onClick={handlePayAll}>Thanh toán tất cả</Button>
    </div>
    <PendingSalary />
    <div className="grid grid-cols-3 gap-4 mb-5">
      {/* ...3 card thống kê... */}
    </div>

    {/* BUỔI CÓ HV VẮNG — cần nhập lương riêng */}
    {absentSessions.length > 0 && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-orange-700 mb-3">
            ⚠️ {absentSessions.length} buổi lớp nhóm có học viên vắng — cần xác nhận lương
          </p>
          <div className="flex flex-col gap-2">
            {absentSessions.map(s => (
              <div key={s.checkin_id} className="bg-white rounded-xl border border-orange-100 p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{s.teacher_name}</p>
                  <p className="text-xs text-gray-500">{s.class_name} · {new Date(s.date).toLocaleDateString('vi-VN', { weekday:'short', day:'numeric', month:'numeric' })}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      👥 {s.present_count}/{s.total_students} có mặt · {s.absent_count} vắng
                    </span>
                    {s.salary_earned > 0 && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        Đã nhập: {fmt(s.salary_earned)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    value={customSalary[s.checkin_id] ?? ''}
                    onChange={e => setCustomSalary(prev => ({ ...prev, [s.checkin_id]: e.target.value }))}
                    placeholder="Nhập lương buổi này"
                    className="input-field text-sm w-40"
                  />
                  <span className="text-xs text-gray-500">đ</span>
                  <button
                    onClick={() => handleSaveSessionSalary(s.checkin_id)}
                    disabled={savingSalary[s.checkin_id]}
                    className="px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    {savingSalary[s.checkin_id] ? '...' : '💾 Lưu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teacherData.length === 0 ? (
        <Card><p className="text-center text-gray-400 py-10">Không có dữ liệu</p></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {teacherData.map(t => {
            const total  = getTotalSalary(t);
            const isPaid = !!paidMap[t.id];
            const paidInfo = paidMap[t.id];
            const totalSessions = t.classes.reduce((s, c) => s + c.sessions, 0);
            // Buổi vắng của GV này
            const myAbsent = absentSessions.filter(s => s.teacher_id === t.id);

            return (
              <Card key={t.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={t.instrument} variant="blue" />
                      <span className="text-xs text-gray-400">• {totalSessions} buổi tháng này</span>
                      {myAbsent.length > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          ⚠️ {myAbsent.length} buổi có vắng
                        </span>
                      )}
                      {isPaid && <Badge label="✅ Đã trả lương" variant="green" />}
                    </div>

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
                              const cSalary = c.class_salary > 0 ? c.class_salary : c.sessions * c.teacher_salary;
                              const classAbsent = absentSessions.filter(s => s.class_id === c.class_id);
                              return (
                                <React.Fragment key={c.class_id}>
                                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-1.5 px-2 text-gray-700 font-medium">{c.class_name}</td>
                                    <td className="py-1.5 px-2 text-center">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.class_type === '1v1' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                        {c.class_type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-bold text-gray-800">{c.sessions}</td>
                                    <td className="py-1.5 px-2 text-right text-gray-600">
                                      <span className="cursor-pointer hover:text-blue-600 hover:underline" onClick={() => {
                                        const newSalary = prompt(`Lương/buổi cho ${c.class_name}:`, c.teacher_salary);
                                        if (newSalary === null) return;
                                        api.put(`/classes/${c.class_id}`, { teacher_salary: Number(newSalary) })
                                          .then(() => { toast.success('Đã cập nhật lương!'); loadData(); })
                                          .catch(e => toast.error(e.message));
                                      }}>{fmt(c.teacher_salary)} ✏️</span>
                                      {c.class_type === 'group' && c.teacher_salary_partial > 0 && c.sessions_partial > 0 && (
                                        <span className="block text-xs text-orange-500">vắng {c.sessions_partial} buổi: {fmt(c.teacher_salary_partial)}</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-semibold text-primary-700">{fmt(cSalary)}</td>
                                  </tr>
                                  {/* Chi tiết buổi có HV vắng của lớp này */}
                                  {classAbsent.length > 0 && (
                                    <tr>
                                      <td colSpan={5} className="px-2 pb-2">
                                        <div className="bg-orange-50 rounded-xl p-2 flex flex-col gap-1.5 mt-1">
                                          <p className="text-xs font-semibold text-orange-700">⚠️ Buổi có HV vắng — chưa xác nhận lương:</p>
                                          {classAbsent.map(s => (
                                            <div key={s.checkin_id} className="flex items-center gap-2 flex-wrap">
                                              <span className="text-xs text-gray-600 min-w-[100px]">
                                                📅 {new Date(s.date).toLocaleDateString('vi-VN', { day:'numeric', month:'numeric' })}
                                              </span>
                                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                                {s.present_count}/{s.total_students} có mặt
                                              </span>
                                              <input
                                                type="number"
                                                value={customSalary[s.checkin_id] ?? ''}
                                                onChange={e => setCustomSalary(prev => ({ ...prev, [s.checkin_id]: e.target.value }))}
                                                placeholder="Nhập lương..."
                                                className="border border-orange-200 rounded-lg px-2 py-1 text-xs w-28 outline-none focus:border-orange-400"
                                              />
                                              <span className="text-xs text-gray-400">đ</span>
                                              <button
                                                onClick={() => handleSaveSessionSalary(s.checkin_id)}
                                                disabled={savingSalary[s.checkin_id]}
                                                className="px-2 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
                                              >
                                                {savingSalary[s.checkin_id] ? '...' : '💾'}
                                              </button>
                                              {s.salary_earned > 0 && (
                                                <span className="text-xs text-green-600">✅ {fmt(s.salary_earned)}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-3">Chưa có lớp hoặc chưa dạy buổi nào tháng này</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      {!isPaid && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600">Thưởng thêm:</p>
                          <input type="number" value={bonuses[t.id] ?? 0} onChange={e => setBonuses(prev => ({ ...prev, [t.id]: e.target.value }))} className="input-field text-sm w-32" placeholder="0" />
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
                        <div className="flex items-center justify-between">
                          <span>
                            ✅ Đã thanh toán {fmt(paidInfo.amount)}
                            {paidInfo.paid_at && ` · ${new Date(paidInfo.paid_at).toLocaleDateString('vi-VN')}`}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const newAmount = prompt('Nhập số tiền mới:', paidInfo.amount);
                              if (newAmount === null) return;
                              const note = prompt('Ghi chú (lý do sửa):', paidInfo.note || '');
                              api.put(`/salary/${paidInfo.id}`, { amount: Number(newAmount), note: note || '' })
                                .then(() => { toast.success('Đã cập nhật lương!'); loadData(); })
                                .catch(e => toast.error(e.message));
                            }} className="text-blue-500 hover:text-blue-700 text-xs">✏️ Sửa</button>
                            <button onClick={() => {
                              if(window.confirm('Hoàn tác thanh toán tháng này?')) {
                                api.delete(`/salary/${t.id}/${monthKey}`).then(() => { toast.success('Đã hoàn tác!'); loadData(); }).catch(e => toast.error(e.message));
                              }
                            }} className="text-red-400 hover:text-red-600 text-xs">↩️ Hoàn tác</button>
                          </div>
                        </div>
                        {paidInfo.note && <p className="mt-1 text-gray-500 italic">{paidInfo.note}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {!isPaid ? (
                      <Button size="sm" icon="💰" loading={paying[t.id]} onClick={() => handlePay(t)}>Trả lương</Button>
                    ) : (
                      <Button size="sm" icon="💰" loading={paying[t.id]} onClick={() => handlePay(t)}>Trả thêm</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
  </>
  );

  if (embedded) return <div>{mainContent}</div>;
  return <MainLayout title="Quản lý lương giáo viên">{mainContent}</MainLayout>;
};

export default SalaryManage;
