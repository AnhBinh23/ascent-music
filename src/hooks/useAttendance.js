import { useState, useCallback } from 'react';
import attendanceService from '../services/attendanceService';
import { toast } from 'react-toastify';

const useAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]       = useState(false);

  const fetchByClass = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await attendanceService.getByClass(classId);
      setAttendance(data);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByStudent = useCallback(async (studentId) => {
    setLoading(true);
    try {
      const data = await attendanceService.getByStudent(studentId);
      setAttendance(data);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAttendance = async (attendanceList) => {
    try {
      await attendanceService.save(attendanceList);
      toast.success('Lưu điểm danh thành công!');
      return true;
    } catch { return false; }
  };

  const getStats = async (studentId) => {
    try {
      return await attendanceService.getStats(studentId);
    } catch { return {}; }
  };

  return { attendance, loading, fetchByClass, fetchByStudent, saveAttendance, getStats };
};

export default useAttendance;