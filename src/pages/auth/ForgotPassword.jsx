import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Vui lòng nhập email!'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    // Kiểm tra email có tồn tại không
    const mockEmails = [
      'admin@ascentmusic.vn',
      'nv@ascentmusic.vn',
      'gv@ascentmusic.vn',
      'hv@ascentmusic.vn',
    ];

    if (!mockEmails.includes(email)) {
      toast.error('Email không tồn tại trong hệ thống!');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
          <p className="text-gray-500 text-sm mt-1">Quên mật khẩu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Lấy lại mật khẩu</h2>
              <p className="text-sm text-gray-500 mb-5">
                Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@ascentmusic.vn"
                  required icon="📧"
                />
                <Button type="submit" fullWidth loading={loading} size="lg" icon="📨">
                  Gửi yêu cầu
                </Button>
              </form>
            </>
          ) : (
            // Trạng thái đã gửi
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ✅
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Đã gửi!</h2>
              <p className="text-sm text-gray-500 mb-2">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến
              </p>
              <p className="text-sm font-medium text-primary-600 mb-5">{email}</p>
              <div className="p-3 bg-amber-50 rounded-xl text-left mb-4">
                <p className="text-xs text-amber-700">
                  💡 Vì đây là phiên bản demo, hãy liên hệ Admin để được cấp lại mật khẩu.
                </p>
              </div>
              <Button variant="secondary" fullWidth onClick={() => setSent(false)}>
                Thử email khác
              </Button>
            </div>
          )}
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

export default ForgotPassword;