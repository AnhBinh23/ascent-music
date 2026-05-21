import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];

const EMPTY = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  role: 'student', instrument: 'Piano', note: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name)     errs.name = 'Vui lòng nhập họ tên';
    if (!form.email)    errs.email = 'Vui lòng nhập email';
    if (!form.phone)    errs.phone = 'Vui lòng nhập số điện thoại';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));

      // Lưu vào danh sách chờ duyệt
      const pending = JSON.parse(localStorage.getItem('ascent_pending') || '[]');
      pending.push({
        id: `PENDING_${Date.now()}`,
        ...form,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('ascent_pending', JSON.stringify(pending));

      toast.success('Đăng ký thành công! Vui lòng chờ Admin xác nhận.');
      navigate('/login');
    } catch {
      toast.error('Có lỗi xảy ra, thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg shadow-primary-200">
            🎵
          </div>
          <h1 className="text-xl font-bold text-gray-800">Đăng ký tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Ascent Music Center</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Vai trò */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bạn là <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'student', label: '🎓 Học viên' },
                  { value: 'teacher', label: '👨‍🏫 Giáo viên' },
                ].map(r => (
                  <button key={r.value} type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                      ${form.role === r.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Họ và tên" name="name" value={form.name}
              onChange={handleChange} required placeholder="Nguyễn Văn A" error={errors.name} />

            <Input label="Email" name="email" type="email" value={form.email}
              onChange={handleChange} required placeholder="email@gmail.com" error={errors.email} icon="📧" />

            <Input label="Số điện thoại" name="phone" value={form.phone}
              onChange={handleChange} required placeholder="0901234567" error={errors.phone} icon="📱" />

            {/* Nhạc cụ */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {form.role === 'teacher' ? 'Chuyên môn' : 'Nhạc cụ muốn học'} <span className="text-red-500">*</span>
              </label>
              <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
                {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Mật khẩu */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mật khẩu <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`input-field pr-20 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                  {showPassword ? '🙈 Ẩn' : '👁️ Hiện'}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Input label="Xác nhận mật khẩu" name="confirmPassword" type="password"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Nhập lại mật khẩu" error={errors.confirmPassword} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ghi chú thêm</label>
              <textarea name="note" value={form.note} onChange={handleChange}
                rows={2} placeholder="Kinh nghiệm, mong muốn..."
                className="input-field resize-none" />
            </div>

            {/* Thông báo */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">
                ⏳ Sau khi đăng ký, Admin sẽ xem xét và xác nhận tài khoản của bạn trong vòng 24 giờ.
              </p>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" icon="📝">
              Gửi đăng ký
            </Button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-primary-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">© 2025 Ascent Music Center</p>
      </div>
    </div>
  );
};

export default RegisterPage;