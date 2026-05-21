import { useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';
import { toast } from 'react-toastify';

const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const createStudent = async (data) => {
    try {
      await studentService.create(data);
      toast.success('Thêm học viên thành công!');
      fetchStudents();
      return true;
    } catch { return false; }
  };

  const updateStudent = async (id, data) => {
    try {
      await studentService.update(id, data);
      toast.success('Cập nhật học viên thành công!');
      fetchStudents();
      return true;
    } catch { return false; }
  };

  const deleteStudent = async (id) => {
    try {
      await studentService.delete(id);
      toast.success('Đã xóa học viên!');
      fetchStudents();
      return true;
    } catch { return false; }
  };

  return { students, loading, error, fetchStudents, createStudent, updateStudent, deleteStudent };
};

export default useStudents;