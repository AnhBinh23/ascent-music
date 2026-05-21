import React, { useRef } from 'react';
import Button from '../../../components/ui/Button';

const TuitionReceipt = ({ data, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Phiếu thu học phí</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: bold; text-transform: uppercase; }
        .subtitle { font-size: 14px; color: #555; }
        .divider { border-top: 2px solid #000; margin: 16px 0; }
        .divider-dot { border-top: 1px dashed #999; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 6px 0; font-size: 14px; }
        td:last-child { text-align: right; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; color: #000; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .sign { text-align: center; }
        @media print { button { display: none; } }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Nút điều khiển */}
        <div className="flex gap-2 p-4 border-b border-gray-100">
          <Button icon="🖨️" onClick={handlePrint}>In phiếu thu</Button>
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>

        {/* Nội dung phiếu */}
        <div ref={printRef} className="p-8">
          <div className="header text-center mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Trung tâm âm nhạc</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">ASCENT MUSIC CENTER</h1>
            <p className="text-xs text-gray-500 mt-1">📍 Địa chỉ trung tâm · 📞 0901 234 567</p>
          </div>

          <div className="border-t-2 border-b-2 border-gray-900 py-3 text-center mb-5">
            <h2 className="text-xl font-bold uppercase tracking-widest">Phiếu thu học phí</h2>
            <p className="text-sm text-gray-500 mt-1">
              Số: {data.id} · Ngày: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              <tr>
                <td className="text-gray-600 py-1.5">Họ tên học viên</td>
                <td className="font-semibold text-right">{data.studentName}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-1.5">Môn học</td>
                <td className="font-semibold text-right">{data.instrument}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-1.5">Tháng học phí</td>
                <td className="font-semibold text-right">Tháng {data.month}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-1.5">Hình thức thanh toán</td>
                <td className="font-semibold text-right">{data.method || 'Tiền mặt'}</td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-300 my-4" />

          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600 text-sm">Học phí tháng</p>
            <p className="font-semibold">{data.amount?.toLocaleString('vi-VN')}đ</p>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600 text-sm">Giảm giá</p>
              <p className="font-semibold text-green-600">-{data.discount?.toLocaleString('vi-VN')}đ</p>
            </div>
          )}

          <div className="border-t-2 border-gray-900 mt-3 pt-3 flex justify-between items-center">
            <p className="text-base font-bold">TỔNG CỘNG</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.paid || data.amount)?.toLocaleString('vi-VN')}đ
            </p>
          </div>

          <div className="mt-3 p-3 bg-green-50 rounded-xl flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <p className="text-sm font-medium text-green-700">Đã thanh toán đủ</p>
          </div>

          <div className="flex justify-between mt-10 text-sm text-center">
            <div className="w-1/2">
              <p className="text-gray-600 mb-16">Người nộp tiền</p>
              <p className="font-medium">(Ký, ghi rõ họ tên)</p>
            </div>
            <div className="w-1/2">
              <p className="text-gray-600 mb-16">Người thu tiền</p>
              <p className="font-medium">(Ký, ghi rõ họ tên)</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 mt-6 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Phiếu thu được tạo lúc {new Date().toLocaleTimeString('vi-VN')} ngày {new Date().toLocaleDateString('vi-VN')}
            </p>
            <p className="text-xs text-gray-400">Ascent Music Center - ascent-music.netlify.app</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuitionReceipt;