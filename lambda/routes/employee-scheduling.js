/**
 * 员工排班系统API路由
 * 整合OpenSkedge智能排班系统
 */

const express = require('express');
const router = express.Router();
const EmployeeSchedulingService = require('../services/employee-scheduling');

const schedulingService = new EmployeeSchedulingService();

router.post('/employee', (req, res) => {
  const result = schedulingService.addEmployee(req.body);
  res.json(result);
});

router.put('/employee/:employeeId', (req, res) => {
  const result = schedulingService.updateEmployee(req.params.employeeId, req.body);
  res.json(result);
});

router.get('/employee/:employeeId', (req, res) => {
  const employee = schedulingService.getEmployee(req.params.employeeId);
  res.json(employee || { success: false, error: '员工不存在' });
});

router.get('/employees', (req, res) => {
  const { department, status } = req.query;
  const employees = schedulingService.getAllEmployees({ department, status });
  res.json({ success: true, employees });
});

router.post('/schedule', (req, res) => {
  const result = schedulingService.createSchedule(req.body);
  res.json(result);
});

router.post('/schedule/batch', (req, res) => {
  const { schedules } = req.body;
  if (!schedules || !Array.isArray(schedules)) {
    return res.status(400).json({ success: false, error: '请提供排班数组' });
  }
  const results = schedulingService.batchCreateSchedules(schedules);
  res.json({ success: true, results });
});

router.put('/schedule/:scheduleId', (req, res) => {
  const result = schedulingService.updateSchedule(req.params.scheduleId, req.body);
  res.json(result);
});

router.delete('/schedule/:scheduleId', (req, res) => {
  const result = schedulingService.deleteSchedule(req.params.scheduleId);
  res.json(result);
});

router.get('/schedules', (req, res) => {
  const { startDate, endDate, employeeId } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: '请提供日期范围' });
  }
  const schedules = schedulingService.getSchedulesByDateRange(startDate, endDate, employeeId);
  res.json({ success: true, schedules });
});

router.get('/employee/:employeeId/schedules', (req, res) => {
  const { days } = req.query;
  const schedules = schedulingService.getSchedulesByEmployee(req.params.employeeId, parseInt(days) || 7);
  res.json({ success: true, schedules });
});

router.get('/schedules/weekly', (req, res) => {
  const { date } = req.query;
  const weekSchedule = schedulingService.getWeeklySchedule(date ? new Date(date) : new Date());
  res.json({ success: true, week: weekSchedule });
});

router.get('/schedules/report', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: '请提供日期范围' });
  }
  const report = schedulingService.getScheduleReport(startDate, endDate);
  res.json(report);
});

router.post('/schedule/auto-generate', (req, res) => {
  const { date } = req.body;
  const suggestions = schedulingService.autoGenerateSchedule(date ? new Date(date) : new Date());
  res.json({ success: true, suggestions });
});

router.post('/timeclock', (req, res) => {
  const { employeeId, type } = req.body;
  if (!employeeId || !type) {
    return res.status(400).json({ success: false, error: '请提供员工ID和打卡类型' });
  }
  const result = schedulingService.timeClock(employeeId, type);
  res.json(result);
});

router.get('/timeclock/:employeeId', (req, res) => {
  const { date } = req.query;
  const record = schedulingService.getTimeClockRecords(
    req.params.employeeId,
    date ? new Date(date) : new Date()
  );
  res.json(record || { success: true, record: null });
});

router.get('/timeclock/report', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: '请提供日期范围' });
  }
  const report = schedulingService.getTimeClockReport(startDate, endDate);
  res.json({ success: true, report });
});

module.exports = router;
