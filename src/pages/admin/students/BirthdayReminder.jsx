import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { toast } from 'react-toastify';

const SAMPLE_STUDENTS = [
  { id: 'HV001', name: 'Nguyễn Văn An',  dob: '2010-05-21', instrument: 'Piano',    phone: '0901234567', courseEnd: '2025-05-30' },
  { id: 'HV002', name: 'Trần Thị Bình',  dob: '2008-06-15', instrument: 'Guitar',   phone: '0912345678', courseEnd: '2025-06-10' },
  { id: 'HV003', name: 'Lê Minh Châu',   dob: '2012-05-25', instrument: 'Violin',   phone: '0923456789', courseEnd: '2025-07-01' },
  { id: 'HV004', name: 'Hoàng Văn Em',   dob: '2011-05-21', instrument: 'Piano',    phone: '0945678901', courseEnd: '2025-05-28' },
  { id: 'HV005', name: 'Phạm Thị Dung',  dob: '2005-07-10', instrument: 'Thanh nhạc', phone: '0934567890', courseEnd: '2025-06-20' },
];

const BirthdayReminder = () => {
  const [birthdays, setBirthdays]   = useState([]);
  const [expiring, setExpiring]     = useState([]);

  useEffect(() => {
    const today    = new Date();
    const todayMD  = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const in7Days  = new Date(today.getTime() + 7 * 86400000);
    const in30Days = new Date(today.getTime() + 30 * 86400000);

    const bdays = SAMPLE_STUDENTS.filter(s => {
      const dob = new Date(s.dob);
      const dobMD = `${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`;
      const within7 = new Date(`${today.getFullYear()}-${dobMD}`);
      return within7 >= today && within7 <= in7Days;
    }).map(s => {
      const dob = new Date(s.dob);
      const thisYear = new Date(`${today.getFullYear()}-${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`);
      const diffDays = Math.ceil((thisYear - today) / 86400000);
      return { ...s, age: today.getFullYear() - dob.getFullYear(), daysUntil: diffDays };
    });

    const exp = SAMPLE_STUDENTS.filter(s => {
      const end = new Date(s.courseEnd);
      return end >= today && end <= in30Days;
    }).map(s => {
      const daysLeft = Math.ceil((new Date(s.courseEnd) - today) / 86400000);
      return { ...s, daysLeft };
    });

    setBirthdays(bdays);
    setExpiring(exp);
  }, []);

  const sendBirthdayWish = (student) => {
    toast.success(`🎂 Đã gửi lời chúc sinh nhật đến ${student.name} qua Zalo!`);
  };

  const sendRenewalReminder = (student) => {
    toast.success(`📞 Đã gửi nhắc gia hạn khóa học đến ${student.name}!`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sinh nhật */}
      <Card
        title={`🎂 Sinh nhật trong 7 ngày tới (${birthdays.length})`}
        subtitle="Gửi lời chúc qua Zalo">
        {birthdays.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có sinh nhật nào trong 7 ngày tới</p>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {birthdays.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-100">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.daysUntil === 0 ? '🎉' : '🎂'}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.instrument} · {s.phone}</p>
                    <p className="text-xs text-pink-600 font-medium mt-0.5">
                      {s.daysUntil === 0 ? '🎉 Hôm nay!' : `Còn ${s.daysUntil} ngày`} · {s.age} tuổi
                    </p>
                  </div>
                </div>
                <Button size="sm" icon="🎂" onClick={() => sendBirthdayWish(s)}>
                  Chúc mừng
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sắp hết khóa */}
      <Card
        title={`⏰ Khóa học sắp kết thúc (${expiring.length})`}
        subtitle="Trong 30 ngày tới — cần tư vấn gia hạn">
        {expiring.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có khóa học nào sắp kết thúc</p>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {expiring.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.daysLeft <= 7 ? '🔴' : '🟡'}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.instrument} · {s.phone}</p>
                    <p className={`text-xs font-medium mt-0.5 ${s.daysLeft <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                      Kết thúc: {new Date(s.courseEnd).toLocaleDateString('vi-VN')} · Còn {s.daysLeft} ngày
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon="📞" onClick={() => sendRenewalReminder(s)}>
                  Nhắc gia hạn
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BirthdayReminder;