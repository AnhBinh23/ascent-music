import { useState, useEffect, useCallback } from 'react';
import scheduleService from '../services/scheduleService';
import { toast } from 'react-toastify';

const useSchedule = (filters = {}) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (filters.teacherId) {
        data = await scheduleService.getByTeacher(filters.teacherId);
      } else if (filters.studentId) {
        data = await scheduleService.getByStudent(filters.studentId);
      } else if (filters.date) {
        data = await scheduleService.getByDate(filters.date);
      } else {
        data = await scheduleService.getAll();
      }
      setSchedule(data);
    } catch {
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [filters.teacherId, filters.studentId, filters.date]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const createSchedule = async (data) => {
    try {
      const conflict = await scheduleService.checkConflict(
        data.teacherId, data.roomId, data.date, data.timeStart, data.timeEnd
      );
      if (conflict) { toast.error('⚠️ Trùng lịch! Vui lòng chọn thời gian khác.'); return false; }
      await scheduleService.create(data);
      toast.success('Thêm lịch học thành công!');
      fetchSchedule();
      return true;
    } catch { return false; }
  };

  const deleteSchedule = async (id) => {
    try {
      await scheduleService.delete(id);
      toast.success('Đã xóa lịch học!');
      fetchSchedule();
      return true;
    } catch { return false; }
  };

  return { schedule, loading, fetchSchedule, createSchedule, deleteSchedule };
};

export default useSchedule;