import { useState, useEffect, useCallback } from 'react';
import tuitionService from '../services/tuitionService';
import { toast } from 'react-toastify';

const useTuition = (studentId = null) => {
  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchTuitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = studentId
        ? await tuitionService.getByStudent(studentId)
        : await tuitionService.getAll();
      setTuitions(data);
    } catch {
      setTuitions([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchTuitions(); }, [fetchTuitions]);

  const collectTuition = async (data) => {
    try {
      await tuitionService.collect(data);
      toast.success('Thu học phí thành công!');
      fetchTuitions();
      return true;
    } catch { return false; }
  };

  const getUnpaid = async () => {
    try {
      return await tuitionService.getUnpaid();
    } catch { return []; }
  };

  const getReport = async (month, year) => {
    try {
      return await tuitionService.getReport(month, year);
    } catch { return {}; }
  };

  return { tuitions, loading, fetchTuitions, collectTuition, getUnpaid, getReport };
};

export default useTuition;