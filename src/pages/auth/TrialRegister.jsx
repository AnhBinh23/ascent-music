import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const TIMES = ['Buổi sáng (8h-12h)', 'Buổi chiều (13h-17h)', 'Buổi tối (18h-21h)'];
const AGES  = ['Dưới 6 tuổi', '6-12 tuổi', '13-17 tuổi', '18-25 tuổi', 'Trên 25 tuổi'];

const TrialRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', age: '6-12 tuổi',
    instrument: 'Piano', time: 'Buổi sáng (8h-12h)',
    experience: 'Chưa có', note: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Điền đầy đủ thông tin!'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const trials = JSON.parse(localStorage.getItem('trial_registrations') || '[]');
    trials.unshift({ ...form, id: `TRIAL_${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() });
    localStorage.setItem('trial_registrations', JSON.stringify(trials));

    setDone(true);
    setLoading(false);
  };

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Trung tâm sẽ liên hệ với bạn trong vòng <strong>24 giờ</strong> để sắp xếp buổi học thử miễn phí.
        </p>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5 text-left">
          <p className="text-sm font-medium text-gray-700 mb-3">Thông tin đăng ký:</p>
          {[
            ['👤 Họ tên', form.name],
            ['📱 Điện thoại', form.phone],
            ['🎵 Môn học', form.instrument],
            ['🕐 Thời gian', form.time],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        <Link to="/login">
          <Button fullWidth variant="secondary">Đăng nhập vào app</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg shadow-primary-200">🎵</div>
          <h1 className="text-xl font-bold text-gray-800">Đăng ký học thử</h1>
          <p className="text-gray-500 text-sm mt-1">Miễn phí · Không cam kết</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Họ và tên" name="name" value={form.name}
              onChange={handleChange} required placeholder="Nguyễn Văn A" />
            <Input label="Số điện thoại" name="phone" value={form.phone}
              onChange={handleChange} required placeholder="0901234567" icon="📱" />
            <Input label="Email (không bắt buộc)" name="email" type="email"
              value={form.email} onChange={handleChange} placeholder="email@gmail.com" icon="📧" />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Độ tuổi</label>
              <select name="age" value={form.age} onChange={handleChange} className="input-field">
                {AGES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Môn muốn học <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENTS.map(i => (
                  <button key={i} type="button"
                    onClick={() => setForm({ ...form, instrument: i })}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                      ${form.instrument === i ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                    {i === 'Piano' ? '🎹' : i === 'Guitar' ? '🎸' : i === 'Violin' ? '🎻' : '🎤'} {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Thời gian phù hợp</label>
              <select name="time" value={form.time} onChange={handleChange} className="input-field">
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Kinh nghiệm âm nhạc</label>
              <select name="experience" value={form.experience} onChange={handleChange} className="input-field">
                <option>Chưa có</option>
                <option>Đã học sơ cấp</option>
                <option>Đã học trung cấp</option>
                <option>Đã có kinh nghiệm</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ghi chú thêm</label>
              <textarea name="note" value={form.note} onChange={handleChange}
                rows={2} className="input-field resize-none" placeholder="Mong muốn, câu hỏi..." />
            </div>

            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-green-700 font-medium">🎁 Buổi học thử hoàn toàn miễn phí!</p>
              <p className="text-xs text-green-600 mt-0.5">Trung tâm sẽ liên hệ trong 24 giờ để xác nhận lịch.</p>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" icon="🎵">
              Đăng ký học thử ngay
            </Button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-primary-600 hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrialRegister;