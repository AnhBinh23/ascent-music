import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import teacherService from '../../../services/teacherService';
import { toast } from 'react-toastify';

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const SalaryManage = () => {
  const [month, setMonth]     = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]       = useState(String(new Date().getFullYear()));
  const [teachers, setTeachers] = useState([]);
  const [bonuses, setBonuses] = useState({});
  const [paid, setPaid]       = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getSalary(month, year);
        // Nếu API trả về thì dùng, nếu không thì dùng getAll
        if (data.length > 0) {
          setTeachers(data);
        } else {
          const all = await teacherService.getAll();
          setTeachers(all.map(t => ({
            ...t,
            salaryPerSession: Number(t.salary_amount) || 0,
            sessions: 0,
            total_salary: 0,
          })));
        }
      } catch {
        const all = await teacherService.getAll();
        setTeachers(all.map(t => ({
          ...t,
          salaryPerSession: Number(t.salary_amount) || 0,
          sessions: 0,
          total_salary: 0,
        })));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [month, year]);

  const getSalary = (t) => {
    const base  = (Number(t.salary_amount) || Number(t.salaryPerSession) || 0) * (Number(t.sessions) || 0);
    const bonus = Number(bonuses[t.id] || 0);
    return base + bonus;
  };

  const totalSalary = teachers.reduce((sum, t) => sum + getSalary(t), 0);

  const handlePay = (id) => {
    setPaid(prev => ({ ...prev, [id]: true }));
    const t = teachers.find(t => t.id === id);
    toast.success(`✅ Đã thanh toán lương ${getSalary(t).toLocaleString('vi-VN')}đ cho ${t.name}!`);
  };

  const handlePayAll = () => {
    const allPaid = {};
    teachers.forEach(t => { allPaid[t.id] = true; });
    setPaid(allPaid);
    toast.success(`✅ Đã thanh toán lương cho tất cả ${teachers.length} giáo viên!`);
  };

  const handlePrint = () => {
    const content = `
      <html><head><title>Bảng lương tháng ${month}/${year}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; }
        h1 { text-align: center; font-size: 20px; }
        h2 { text-align: center; font-size: 14px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 13px; }
        td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
        .total { font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
        @media print { button { display: none !important; } }
      </style></head>
      <body>
        <h1>ASCENT MUSIC CENTER</h1>
        <h2>BẢNG LƯƠNG THÁNG ${month}/${year}</h2>
        <table>
          <thead>
            <tr>
              <th>STT</th><th>Họ tên</th><th>Chuyên môn</th>
              <th>Số buổi</th><th>Đơn giá/buổi</th><th>Thưởng</th><th>Tổng lương</th>
            </tr>
          </thead>
          <tbody>
            ${teachers.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${t.name}</td>
                <td>${t.instrument}</td>
                <td>${t.sessions || 0}</td>
                <td>${Number(t.salary_amount || t.salaryPerSession || 0).toLocaleString('vi-VN')}đ</td>
                <td>${Number(bonuses[t.id] || 0).toLocaleString('vi-VN')}đ</td>
                <td class="total">${getSalary(t).toLocaleString('vi-VN')}đ</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="6" class="total" style="text-align:right">TỔNG CỘNG:</td>
              <td class="total">${totalSalary.toLocaleString('vi-VN')}đ</td>
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
          {['2024','2025','2026'].map(y => <option key={y}>{y}</option>)}
        </select>
        <Button variant="secondary" icon="🖨️" onClick={handlePrint}>In bảng lương</Button>
        <Button icon="💰" onClick={handlePayAll}>Thanh toán tất cả</Button>
      </div>

      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{teachers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Giáo viên</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-600">{totalSalary.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Tổng lương tháng {month}/{year}</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {Object.keys(paid).length}/{teachers.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
        </div>
      </div>

      {/* Bảng lương */}
      {teachers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-10">Không có dữ liệu giáo viên</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {teachers.map(t => {
            const salaryPerSession = Number(t.salary_amount || t.salaryPerSession || 0);
            const sessions         = Number(t.sessions || 0);
            const base             = salaryPerSession * sessions;
            const bonus            = Number(bonuses[t.id] || 0);
            const total            = base + bonus;
            const isPaid           = paid[t.id];

            return (
              <Card key={t.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={t.instrument} variant="blue" />
                      {isPaid && <Badge label="✅ Đã trả lương" variant="green" />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Số buổi dạy</p>
                        <p className="font-bold text-gray-800">{sessions}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Đơn giá/buổi</p>
                        <p className="font-bold text-gray-800">{salaryPerSession.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-xl text-center">
                        <p className="text-xs text-blue-600">Lương cơ bản</p>
                        <p className="font-bold text-blue-700">{base.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-orange-600">Tổng lương</p>
                        <p className="font-bold text-orange-700">{total.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>

                    {/* Thưởng */}
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-sm text-gray-600 whitespace-nowrap">Thưởng thêm:</p>
                      <input
                        type="number"
                        value={bonuses[t.id] ?? 0}
                        onChange={e => setBonuses(prev => ({ ...prev, [t.id]: e.target.value }))}
                        className="input-field text-sm w-36"
                        placeholder="0"
                        disabled={isPaid}
                      />
                      <span className="text-sm text-gray-500">đ</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!isPaid ? (
                      <Button size="sm" icon="💰" onClick={() => handlePay(t.id)}>Trả lương</Button>
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