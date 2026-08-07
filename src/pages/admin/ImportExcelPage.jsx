import React, { useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ImportExcelPage = () => {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [notFound, setNotFound]   = useState([]);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState('upload'); // upload | preview | done
  const fileRef                   = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Chỉ hỗ trợ file .xlsx hoặc .xls!');
      return;
    }
    setFile(f);
    setPreview(null);
    setResult(null);
    setStep('upload');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.postForm('/import/preview', fd);
      setPreview(res.preview || []);
      setNotFound(res.notFound || []);
      setStep('preview');
    } catch (err) {
      toast.error(err.message || 'Lỗi đọc file!');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.postForm('/import/attendance', fd);
      setResult(res);
      setStep('done');
      toast.success(`✅ Import thành công ${res.imported} buổi!`);
    } catch (err) {
      toast.error(err.message || 'Lỗi import!');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setNotFound([]); setResult(null); setStep('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  // Nhóm preview theo khóa
  const byCourse = preview ? preview.reduce((acc, p) => {
    const k = `Khóa ${p.course}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {}) : {};

  return (
    <MainLayout title="Import Excel">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="font-bold text-gray-800">Import điểm danh từ Excel</p>
              <p className="text-xs text-gray-500">Tải file Google Sheet (xuất ra .xlsx) lên để cập nhật dữ liệu</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex flex-col gap-1">
            <p>📌 Sheet cần có tên: <strong>Khóa 1</strong>, <strong>Khóa 2</strong>, <strong>Khóa 3</strong>...</p>
            <p>📌 Cột: STT · Họ tên · Tên gọi · Năm sinh · Bộ môn · Phụ trách · Hình thức · Gói học · Buổi 1, 2, 3...</p>
            <p>⚠️ Chỉ xóa dữ liệu Excel cũ — điểm danh từ app giữ nguyên.</p>
          </div>
        </div>

        {/* Bước 1: Upload */}
        {step === 'upload' && (
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">📁 Chọn file Excel</p>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <p className="text-4xl mb-3">📂</p>
              <p className="text-sm font-medium text-gray-700">Kéo thả file vào đây</p>
              <p className="text-xs text-gray-400 mt-1">hoặc bấm để chọn file .xlsx</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📗</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">{file.name}</p>
                    <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={reset} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            )}

            <button
              onClick={handlePreview}
              disabled={!file || loading}
              className="mt-4 w-full py-3 bg-primary-600 text-white rounded-2xl font-semibold disabled:opacity-50 hover:bg-primary-700 transition-all"
            >
              {loading ? '⏳ Đang đọc file...' : '🔍 Xem trước dữ liệu'}
            </button>
          </div>
        )}

        {/* Bước 2: Preview */}
        {step === 'preview' && preview && (
          <div className="flex flex-col gap-4">
            {/* Tóm tắt */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <p className="text-2xl font-bold text-blue-600">{preview.length}</p>
                <p className="text-xs text-gray-500 mt-1">HV có dữ liệu</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600">
                  {preview.reduce((s, p) => s + p.sessions, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tổng buổi</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-500">{notFound.length}</p>
                <p className="text-xs text-gray-500 mt-1">Không khớp</p>
              </div>
            </div>

            {/* Cảnh báo HV không khớp */}
            {notFound.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">⚠️ {notFound.length} học viên không tìm thấy trong hệ thống:</p>
                <div className="flex flex-wrap gap-2">
                  {notFound.map((n, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{n}</span>
                  ))}
                </div>
                <p className="text-xs text-red-500 mt-2">Các HV này sẽ bị bỏ qua khi import.</p>
              </div>
            )}

            {/* Danh sách theo khóa */}
            {Object.entries(byCourse).map(([khoa, list]) => (
              <div key={khoa} className="card">
                <p className="text-sm font-bold text-gray-700 mb-3">📚 {khoa} — {list.length} học viên</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-2 text-gray-500">Học viên</th>
                        <th className="text-center py-2 px-2 text-gray-500">Gói học</th>
                        <th className="text-center py-2 px-2 text-gray-500">Số buổi</th>
                        <th className="text-center py-2 px-2 text-gray-500">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1.5 px-2 font-medium text-gray-800">{p.name}</td>
                          <td className="py-1.5 px-2 text-center text-gray-600">
                            {p.total_sessions ? `${p.total_sessions} buổi` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-primary-600">{p.sessions}</td>
                          <td className="py-1.5 px-2 text-center">
                            {p.found
                              ? <span className="text-green-600">✅ Khớp</span>
                              : <span className="text-red-500">❌ Không tìm thấy</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Nút xác nhận */}
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-3 border border-gray-200 rounded-2xl text-gray-600 font-semibold hover:bg-gray-50">
                ← Chọn lại file
              </button>
              <button onClick={handleImport} disabled={loading || preview.filter(p => p.found).length === 0}
                className="flex-1 py-3 bg-primary-600 text-white rounded-2xl font-semibold disabled:opacity-50 hover:bg-primary-700 transition-all">
                {loading ? '⏳ Đang import...' : `✅ Xác nhận import ${preview.filter(p=>p.found).length} HV`}
              </button>
            </div>
          </div>
        )}

        {/* Bước 3: Kết quả */}
        {step === 'done' && result && (
          <div className="card">
            <div className="text-center mb-6">
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-xl font-bold text-gray-800">Import thành công!</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-xs text-gray-500 mt-1">Buổi đã import</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{result.deleted}</p>
                <p className="text-xs text-gray-500 mt-1">Buổi cũ đã xóa</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.goiUpdated}</p>
                <p className="text-xs text-gray-500 mt-1">HV cập nhật gói học</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-500">{result.skipped}</p>
                <p className="text-xs text-gray-500 mt-1">Bỏ qua (trùng)</p>
              </div>
            </div>
            {Object.entries(result.countByCourse || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-600">Khóa {k}</span>
                <span className="font-semibold text-primary-600">{v} buổi</span>
              </div>
            ))}
            {result.notFound?.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-xl">
                <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Bỏ qua {result.notFound.length} HV không khớp:</p>
                <p className="text-xs text-orange-600">{result.notFound.join(', ')}</p>
              </div>
            )}
            <button onClick={reset} className="mt-5 w-full py-3 border border-gray-200 rounded-2xl text-gray-600 font-semibold hover:bg-gray-50">
              📁 Import file khác
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ImportExcelPage;