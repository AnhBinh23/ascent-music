import { useState, useEffect, useCallback } from 'react';
import teacherService from '../services/teacherService';
import { toast } from 'react-toastify';

const useTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherService.getAll();
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const createTeacher = async (data) => {
    try {
      await teacherService.create(data);
      toast.success('Thêm giáo viên thành công!');
      fetchTeachers();
      return true;
    } catch { return false; }
  };

  const updateTeacher = async (id, data) => {
    try {
      await teacherService.update(id, data);
      toast.success('Cập nhật giáo viên thành công!');
      fetchTeachers();
      return true;
    } catch { return false; }
  };

  const deleteTeacher = async (id) => {
    try {
      await teacherService.delete(id);
      toast.success('Đã xóa giáo viên!');
      fetchTeachers();
      return true;
    } catch { return false; }
  };

  return { teachers, loading, error, fetchTeachers, createTeacher, updateTeacher, deleteTeacher };
};

export default useTeachers;