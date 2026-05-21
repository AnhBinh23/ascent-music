import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (isAuthenticated && user) navigate(`/${user.role}`, { replace: true });
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Vui lòng nhập email';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const userData = await authService.login(form.email, form.password);
      const redirectPath = login(userData);
      toast.success(`Chào mừng ${userData.name}!`);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      toast.error('Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-primary-200">
            🎵
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Ascent Music</h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống quản lý trung tâm âm nhạc</p>
        </div>

        {/* Form đăng nhập */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email" name="email" type="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@ascentmusic.vn" required error={errors.email} icon="📧"
            />

            {/* Password với nút hiện/ẩn */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-12 ${errors.password ? 'border-red-400' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                  {showPassword ? '🙈 Ẩn' : '👁️ Hiện'}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Đăng nhập
            </Button>
            <div className="text-center mt-2">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </form>
        </div>

        {/* Đăng ký */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-3 text-center">
          <p className="text-sm text-gray-600 mb-3">Bạn chưa có tài khoản?</p>
          <Link to="/register">
            <Button variant="secondary" fullWidth icon="📝">
              Đăng ký tài khoản
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Ascent Music Center</p>
      </div>
    </div>
  );
};

export default LoginPage;