import React, { useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const TYPE_INFO = {
  'video':      { icon: '🎬', label: 'Video',      variant: 'blue',   accept: 'video/*' },
  'pdf':        { icon: '📄', label: 'PDF',         variant: 'red',    accept: '.pdf' },
  'sheet':      { icon: '🎼', label: 'Sheet nhạc',  variant: 'purple', accept: 'image/*,.pdf' },
  'assignment': { icon: '📝', label: 'Bài tập',     variant: 'orange', accept: '*' },
};

const SAMPLE = [
  { id: 1, name: 'Hướng dẫn gam Đô trưởng', type: 'video',      class: 'Piano cơ bản 01', size: '45 MB',  date: '2025-05-15', url: 'https://www.w3schools.com/html/mov_bbb.mp4', mimeType: 'video/mp4' },
  { id: 2, name: 'Giáo trình Piano cơ bản',  type: 'pdf',        class: 'Piano cơ bản 01', size: '2.5 MB', date: '2025-05-10', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf', mimeType: 'application/pdf' },
  { id: 3, name: 'Sheet nhạc bài số 5',       type: 'sheet',      class: 'Piano cơ bản 01', size: '1.2 MB', date: '2025-05-18', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ode_an_die_Freude_-_Beethoven.jpg/800px-Ode_an_die_Freude_-_Beethoven.jpg', mimeType: 'image/jpeg' },
  { id: 4, name: 'Bài tập tuần 3',            type: 'assignment', class: 'Piano cơ bản 01', size: '0.5 MB', date: '2025-05-18', url: '', mimeType: '' },
];

// ===== FILE VIEWER =====
const FileViewer = ({ file, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!file) return null;

  const renderContent = () => {
    if (file.mimeType?.startsWith('video/')) {
      return (
        <video controls autoPlay className="w-full rounded-xl"
          style={{ maxHeight: isFullscreen ? '85vh' : '60vh' }}>
          <source src={file.url} type={file.mimeType} />
        </video>
      );
    }
    if (file.mimeType === 'application/pdf') {
      return (
        <iframe src={file.url} className="w-full rounded-xl"
          style={{ height: isFullscreen ? '85vh' : '65vh' }}
          title={file.name} />
      );
    }
    if (file.mimeType?.startsWith('image/')) {
      return (
        <img src={file.url} alt={file.name}
          className="w-full rounded-xl object-contain cursor-zoom-in"
          style={{ maxHeight: isFullscreen ? '85vh' : '65vh' }}
          onClick={() => setIsFullscreen(!isFullscreen)} />
      );
    }
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📄</p>
        <p className="text-gray-500">Không thể xem trực tiếp file này</p>
        <Button className="mt-4" onClick={() => window.open(file.url, '_blank')} icon="⬇️">
          Tải xuống để xem
        </Button>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
      ${isFullscreen ? 'p-0' : 'p-4'}`}>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isFullscreen ? () => setIsFullscreen(false) : onClose} />

      {/* Modal box */}
      <div className={`relative bg-white flex flex-col transition-all duration-300 z-10
        ${isFullscreen
          ? 'w-full h-full rounded-none'
          : 'rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh]'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Badge label={TYPE_INFO[file.type]?.label} variant={TYPE_INFO[file.type]?.variant} />
            <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
            <span className="text-xs text-gray-400 whitespace-nowrap">{file.size}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            {/* Nút fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ (Esc)' : 'Mở toàn màn hình'}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 text-xl">
              {isFullscreen ? '🗗' : '🗖'}
            </button>

            {/* Nút tải về */}
            <button
              onClick={() => window.open(file.url, '_blank')}
              title="Tải về"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 text-lg">
              ⬇️
            </button>

            {/* Nút đóng */}
            <button
              onClick={onClose}
              title="Đóng"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors text-gray-500 text-lg font-bold">
              ✕
            </button>
          </div>
        </div>

        {/* Nội dung */}
        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>

        {/* Footer hint */}
        {!isFullscreen && (
          <div className="px-5 py-2 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400">
              Bấm <span className="font-medium">🗖</span> để mở toàn màn hình
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const Materials = () => {
  const { user } = useAuth();
  const isTeacher  = user?.role === 'teacher';
  const fileRef    = useRef(null);

  const [materials, setMaterials]   = useState(SAMPLE);
  const [viewing, setViewing]       = useState(null);
  const [uploadType, setUploadType] = useState('video');
  const [uploading, setUploading]   = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', class: 'Piano cơ bản 01', note: '' });
  const [preview, setPreview]       = useState(null);
  const [filterType, setFilterType] = useState('all');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    if (sizeMB > 100) { toast.error('File quá lớn! Tối đa 100MB'); return; }
    const url = URL.createObjectURL(file);
    setPreview({ url, mimeType: file.type, name: file.name, size: `${sizeMB} MB` });
    setUploadForm(prev => ({ ...prev, name: prev.name || file.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleUpload = async () => {
    if (!preview)          { toast.error('Chưa chọn file!'); return; }
    if (!uploadForm.name)  { toast.error('Nhập tên tài liệu!'); return; }
    setUploading(true);
    await new Promise(r => setTimeout(r, 1200));
    setMaterials(prev => [{
      id:       Date.now(),
      name:     uploadForm.name,
      type:     uploadType,
      class:    uploadForm.class,
      size:     preview.size,
      date:     new Date().toISOString().split('T')[0],
      url:      preview.url,
      mimeType: preview.mimeType,
      note:     uploadForm.note,
    }, ...prev]);
    toast.success('✅ Upload thành công!');
    setPreview(null);
    setUploadForm({ name: '', class: 'Piano cơ bản 01', note: '' });
    setShowUpload(false);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast.success('Đã xóa tài liệu!');
  };

  const filtered = filterType === 'all' ? materials : materials.filter(m => m.type === filterType);

  return (
    <MainLayout title="Tài liệu học tập">

      {/* Filter & Upload */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 flex-1 overflow-x-auto pb-1">
          <button onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${filterType === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            Tất cả ({materials.length})
          </button>
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <button key={key} onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${filterType === key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {info.icon} {info.label} ({materials.filter(m => m.type === key).length})
            </button>
          ))}
        </div>
        {isTeacher && (
          <Button icon="📤" onClick={() => setShowUpload(true)}>Upload tài liệu</Button>
        )}
      </div>

      {/* Danh sách */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(item => {
          const info = TYPE_INFO[item.type];
          return (
            <Card key={item.id}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {item.mimeType?.startsWith('image/') && item.url ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : item.mimeType?.startsWith('video/') && item.url ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <span className="text-3xl">{info?.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.class} · {item.size}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge label={info?.label} variant={info?.variant} />
                    {item.url && (
                      <Button size="sm" variant="primary" icon="👁️"
                        onClick={() => setViewing(item)}>
                        Xem
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" icon="⬇️"
                      onClick={() => { if (item.url) window.open(item.url, '_blank'); else toast.info('File chưa có link!'); }}>
                      Tải về
                    </Button>
                    {isTeacher && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>🗑️</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Chưa có tài liệu nào</p>
        </div>
      )}

      {/* Modal Upload */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setPreview(null); }}
        title="Upload tài liệu" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setShowUpload(false); setPreview(null); }}>Hủy</Button>
          <Button loading={uploading} icon="📤" onClick={handleUpload}>Upload</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Loại tài liệu</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_INFO).map(([key, info]) => (
                <button key={key} type="button"
                  onClick={() => { setUploadType(key); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className={`p-2.5 rounded-xl text-sm font-medium border transition-all
                    ${uploadType === key ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {info.icon} {info.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Chọn file <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
              onClick={() => fileRef.current?.click()}>
              {preview ? (
                <div>
                  {preview.mimeType?.startsWith('image/') && <img src={preview.url} alt="preview" className="max-h-32 mx-auto rounded-lg mb-2 object-contain" />}
                  {preview.mimeType?.startsWith('video/') && <video src={preview.url} className="max-h-32 mx-auto rounded-lg mb-2" controls />}
                  <p className="text-sm font-medium text-green-600">✅ {preview.name}</p>
                  <p className="text-xs text-gray-400">{preview.size}</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl mb-2">{TYPE_INFO[uploadType]?.icon}</p>
                  <p className="text-sm text-gray-500">Bấm để chọn file</p>
                  <p className="text-xs text-gray-400 mt-1">Tối đa 100MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden"
              accept={TYPE_INFO[uploadType]?.accept} onChange={handleFileSelect} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tên tài liệu <span className="text-red-500">*</span></label>
            <input value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
              className="input-field" placeholder="VD: Sheet nhạc bài số 5" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Lớp học</label>
            <select value={uploadForm.class} onChange={e => setUploadForm({ ...uploadForm, class: e.target.value })} className="input-field">
              <option>Piano cơ bản 01</option>
              <option>Piano nâng cao</option>
              <option>Guitar nhóm 01</option>
              <option>Tất cả lớp</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea value={uploadForm.note} onChange={e => setUploadForm({ ...uploadForm, note: e.target.value })}
              rows={2} className="input-field resize-none" placeholder="Mô tả tài liệu..." />
          </div>
        </div>
      </Modal>

      {/* File Viewer */}
      <FileViewer file={viewing} onClose={() => setViewing(null)} />

    </MainLayout>
  );
};

export default Materials;