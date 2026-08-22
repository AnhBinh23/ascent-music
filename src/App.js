import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/layout/PrivateRoute';
import ScrollToTop from './components/shared/ScrollToTop';

import LoginPage       from './pages/auth/LoginPage';
import RegisterPage    from './pages/auth/RegisterPage';
import ForgotPassword  from './pages/auth/ForgotPassword';
import TrialRegister   from './pages/auth/TrialRegister';

import ProfilePage from './pages/profile/ProfilePage';
import ChatPage from './pages/chat/ChatPage';

import AIAssistant   from './pages/admin/AIAssistant';
import TeacherAIChat from './pages/teacher/TeacherAIChat';
import AIChat        from './pages/student/AIChat';

import AdminDashboard     from './pages/admin/Dashboard';
import StudentManage      from './pages/admin/StudentManage';
import StudentList        from './pages/admin/students/StudentList';
import StudentDetail      from './pages/admin/students/StudentDetail';
import StudentForm        from './pages/admin/students/StudentForm';
import TrialManage        from './pages/admin/students/TrialManage';
import TeacherManage      from './pages/admin/TeacherManage';
import TeacherList        from './pages/admin/teachers/TeacherList';
import TeacherDetail      from './pages/admin/teachers/TeacherDetail';
import TeacherForm        from './pages/admin/teachers/TeacherForm';
import SalaryManage       from './pages/admin/teachers/SalaryManage';
import ClassList          from './pages/admin/classes/ClassList';
import ClassDetail        from './pages/admin/classes/ClassDetail';
import ClassForm          from './pages/admin/classes/ClassForm';
import FlexibleManage     from './pages/admin/classes/FlexibleManage';
import ScheduleCalendar   from './pages/admin/schedule/ScheduleCalendar';
import ScheduleForm       from './pages/admin/schedule/ScheduleForm';
import TuitionList        from './pages/admin/tuition/TuitionList';
import TuitionReport      from './pages/admin/tuition/TuitionReport';
import RoomList           from './pages/admin/rooms/RoomList';
import InstrumentList     from './pages/admin/rooms/InstrumentList';
import ReportPage         from './pages/admin/reports/ReportPage';
import AccountManage      from './pages/admin/settings/AccountManage';
import CheckInManage      from './pages/admin/CheckInManage';
import AttendanceManage   from './pages/admin/AttendanceManage';
import NotificationPage   from './pages/admin/notifications/NotificationPage';
import ImportExcelPage    from './pages/admin/ImportExcelPage';

import StaffDashboard      from './pages/staff/Dashboard';
import StaffTuitionCollect from './pages/staff/TuitionCollect';
import InvoicePage         from './pages/staff/InvoicePage';
import EnrollmentPage      from './pages/staff/EnrollmentPage';
import CheckInView         from './pages/staff/CheckInView';

import TeacherDashboard from './pages/teacher/Dashboard';
import MyClasses        from './pages/teacher/MyClasses';
import Attendance       from './pages/teacher/Attendance';
import LessonLog        from './pages/teacher/LessonLog';
import TeacherMaterials from './pages/teacher/Materials';
import MySchedule       from './pages/teacher/MySchedule';
import CheckIn          from './pages/teacher/CheckIn';
import SendNotification from './pages/teacher/SendNotification';
import FlexibleAttendance from './pages/teacher/FlexibleAttendance';

import StudentDashboard  from './pages/student/Dashboard';
import StudentMySchedule from './pages/student/MySchedule';
import MyTuition         from './pages/student/MyTuition';
import MyAttendance      from './pages/student/MyAttendance';
import MyProgress        from './pages/student/MyProgress';
import StudentMaterials  from './pages/student/Materials';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <SocketProvider>
        <AppProvider>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
          <Routes>

            <Route path="/"                element={<Navigate to="/login" replace />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/trial-register"  element={<TrialRegister />} />

            <Route path="/admin" element={<PrivateRoute roles={['admin']} />}>
              <Route index                    element={<AdminDashboard />} />
              <Route path="students"          element={<StudentManage />} />
              <Route path="students/new"      element={<StudentForm />} />
              <Route path="students/:id"      element={<StudentDetail />} />
              <Route path="students/edit/:id" element={<StudentForm />} />
              <Route path="trials"            element={<TrialManage />} />
              <Route path="teachers"          element={<TeacherManage />} />
              <Route path="teachers/new"      element={<TeacherForm />} />
              <Route path="teachers/:id"      element={<TeacherDetail />} />
              <Route path="teachers/edit/:id" element={<TeacherForm />} />
              <Route path="salary"            element={<SalaryManage />} />
              <Route path="classes"           element={<ClassList />} />
              <Route path="classes/new"       element={<ClassForm />} />
              <Route path="classes/:id"       element={<ClassDetail />} />
              <Route path="classes/edit/:id"  element={<ClassForm />} />
              <Route path="schedule"          element={<ScheduleCalendar />} />
              <Route path="schedule/new"      element={<ScheduleForm />} />
              <Route path="tuition"           element={<TuitionList />} />
              <Route path="tuition/report"    element={<TuitionReport />} />
              <Route path="enrollment"        element={<EnrollmentPage />} />
              <Route path="invoice"           element={<InvoicePage />} />
              <Route path="tuition-collect"   element={<StaffTuitionCollect />} />
              <Route path="rooms"             element={<RoomList />} />
              <Route path="instruments"       element={<InstrumentList />} />
              <Route path="reports"           element={<ReportPage />} />
              <Route path="settings"          element={<AccountManage />} />
              <Route path="checkin"           element={<CheckInManage />} />
              <Route path="attendance"             element={<AttendanceManage />} />
              <Route path="flexible-attendance"    element={<FlexibleManage />} />
              <Route path="notifications"          element={<NotificationPage />} />
              <Route path="chat"              element={<ChatPage />} />
              <Route path="ai"               element={<AIAssistant />} />
              <Route path="profile"           element={<ProfilePage />} />
              <Route path="import-excel"      element={<ImportExcelPage />} />
            </Route>

            <Route path="/staff" element={<PrivateRoute roles={['staff']} />}>
              <Route index                    element={<StaffDashboard />} />
              <Route path="students"          element={<StudentList />} />
              <Route path="students/new"      element={<StudentForm />} />
              <Route path="students/:id"      element={<StudentDetail />} />
              <Route path="students/edit/:id" element={<StudentForm />} />
              <Route path="teachers"          element={<TeacherList />} />
              <Route path="teachers/new"      element={<TeacherForm />} />
              <Route path="teachers/:id"      element={<TeacherDetail />} />
              <Route path="teachers/edit/:id" element={<TeacherForm />} />
              <Route path="enrollment"        element={<EnrollmentPage />} />
              <Route path="schedule"          element={<ScheduleCalendar />} />
              <Route path="schedule/new"      element={<ScheduleForm />} />
              <Route path="tuition"           element={<StaffTuitionCollect />} />
              <Route path="invoice"           element={<InvoicePage />} />
              <Route path="checkin"           element={<CheckInView />} />
              <Route path="chat"              element={<ChatPage />} />
              <Route path="profile"           element={<ProfilePage />} />
            </Route>

            <Route path="/teacher" element={<PrivateRoute roles={['teacher']} />}>
              <Route index                    element={<TeacherDashboard />} />
              <Route path="classes"           element={<MyClasses />} />
              <Route path="attendance"        element={<Attendance />} />
              <Route path="lesson-log"        element={<LessonLog />} />
              <Route path="materials"         element={<TeacherMaterials />} />
              <Route path="schedule"          element={<MySchedule />} />
              <Route path="checkin"           element={<CheckIn />} />
              <Route path="notifications"     element={<SendNotification />} />
              <Route path="chat"              element={<ChatPage />} />
              <Route path="ai"               element={<TeacherAIChat />} />
              <Route path="flexible-attendance" element={<FlexibleAttendance />} />
              <Route path="profile"           element={<ProfilePage />} />
            </Route>

            <Route path="/student" element={<PrivateRoute roles={['student']} />}>
              <Route index                    element={<StudentDashboard />} />
              <Route path="schedule"          element={<StudentMySchedule />} />
              <Route path="tuition"           element={<MyTuition />} />
              <Route path="attendance"        element={<MyAttendance />} />
              <Route path="progress"          element={<MyProgress />} />
              <Route path="materials"         element={<StudentMaterials />} />
              <Route path="chat"              element={<ChatPage />} />
              <Route path="ai"               element={<AIChat />} />
              <Route path="profile"           element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </AppProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;