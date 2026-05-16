/**
 * 员工排班系统 (Employee Scheduling)
 * 基于OpenSkedge智能排班系统设计
 * 功能：员工管理、排班管理、时间钟打卡
 */

class EmployeeSchedulingService {
  constructor() {
    this.employees = new Map();
    this.schedules = new Map();
    this.timeClocks = new Map();
    this.shifts = this.initializeShifts();
    this.departments = ['前厅', '后厨', '收银', '外卖', '管理'];
  }

  initializeShifts() {
    return {
      morning: { name: '早班', start: '06:00', end: '14:00', color: '#4CAF50' },
      afternoon: { name: '中班', start: '14:00', end: '22:00', color: '#FF9800' },
      night: { name: '晚班', start: '22:00', end: '06:00', color: '#2196F3' },
      fullDay: { name: '全天', start: '06:00', end: '22:00', color: '#9C27B0' },
      partTime: { name: '兼职', start: '11:00', end: '18:00', color: '#607D8B' }
    };
  }

  addEmployee(employee) {
    const id = employee.id || `EMP${Date.now()}`;
    const newEmployee = {
      id,
      name: employee.name,
      phone: employee.phone,
      department: employee.department || '前厅',
      position: employee.position || '员工',
      hourlyRate: employee.hourlyRate || 20,
      status: 'active',
      hireDate: employee.hireDate || new Date(),
      skills: employee.skills || [],
      maxHoursPerWeek: employee.maxHoursPerWeek || 40,
      createdAt: new Date()
    };

    this.employees.set(id, newEmployee);
    return { success: true, employee: newEmployee };
  }

  updateEmployee(employeeId, updates) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      return { success: false, error: '员工不存在' };
    }

    Object.assign(employee, updates, { updatedAt: new Date() });
    return { success: true, employee };
  }

  getEmployee(employeeId) {
    return this.employees.get(employeeId);
  }

  getAllEmployees(filters = {}) {
    let employees = Array.from(this.employees.values());
    
    if (filters.department) {
      employees = employees.filter(e => e.department === filters.department);
    }
    if (filters.status) {
      employees = employees.filter(e => e.status === filters.status);
    }
    
    return employees;
  }

  createSchedule(schedule) {
    const id = schedule.id || `SCH${Date.now()}`;
    const newSchedule = {
      id,
      employeeId: schedule.employeeId,
      employeeName: this.employees.get(schedule.employeeId)?.name || '未知',
      date: schedule.date,
      shift: schedule.shift,
      shiftInfo: this.shifts[schedule.shift] || this.shifts.morning,
      department: schedule.department || this.employees.get(schedule.employeeId)?.department,
      status: 'scheduled',
      notes: schedule.notes || '',
      createdAt: new Date(),
      createdBy: schedule.createdBy || 'system'
    };

    this.schedules.set(id, newSchedule);
    return { success: true, schedule: newSchedule };
  }

  batchCreateSchedules(schedules) {
    const results = [];
    for (const schedule of schedules) {
      results.push(this.createSchedule(schedule));
    }
    return results;
  }

  getSchedule(scheduleId) {
    return this.schedules.get(scheduleId);
  }

  getSchedulesByDateRange(startDate, endDate, employeeId = null) {
    const schedules = Array.from(this.schedules.values())
      .filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate >= new Date(startDate) && scheduleDate <= new Date(endDate);
      })
      .filter(s => !employeeId || s.employeeId === employeeId);

    return schedules.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getSchedulesByEmployee(employeeId, days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getSchedulesByDateRange(startDate, endDate, employeeId);
  }

  getSchedulesByDepartment(department, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.schedules.values())
      .filter(s => s.department === department && s.date === dateStr);
  }

  updateSchedule(scheduleId, updates) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return { success: false, error: '排班不存在' };
    }

    if (updates.shift) {
      updates.shiftInfo = this.shifts[updates.shift] || this.shifts.morning;
    }

    Object.assign(schedule, updates, { updatedAt: new Date() });
    return { success: true, schedule };
  }

  deleteSchedule(scheduleId) {
    if (!this.schedules.has(scheduleId)) {
      return { success: false, error: '排班不存在' };
    }
    
    this.schedules.delete(scheduleId);
    return { success: true };
  }

  timeClock(employeeId, type = 'in') {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    let records = this.timeClocks.get(employeeId) || [];
    
    const todayRecord = records.find(r => r.date === dateStr);
    
    if (type === 'in') {
      if (todayRecord?.clockIn) {
        return { success: false, error: '今日已打卡上班' };
      }
      
      if (!todayRecord) {
        records.push({ date: dateStr, clockIn: timeStr, clockOut: null, breaks: [] });
      } else {
        todayRecord.clockIn = timeStr;
      }
    } else if (type === 'out') {
      if (!todayRecord?.clockIn) {
        return { success: false, error: '今日未打卡上班' };
      }
      if (todayRecord.clockOut) {
        return { success: false, error: '今日已打卡下班' };
      }
      todayRecord.clockOut = timeStr;
      
      todayRecord.workHours = this.calculateWorkHours(todayRecord);
    } else if (type === 'breakStart') {
      if (!todayRecord) {
        return { success: false, error: '请先打卡上班' };
      }
      todayRecord.breaks.push({ start: timeStr, end: null });
    } else if (type === 'breakEnd') {
      if (!todayRecord) {
        return { success: false, error: '请先打卡上班' };
      }
      const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
      if (lastBreak && !lastBreak.end) {
        lastBreak.end = timeStr;
      }
    }

    this.timeClocks.set(employeeId, records);
    
    return {
      success: true,
      record: records[records.length - 1],
      message: type === 'in' ? '上班打卡成功' : type === 'out' ? '下班打卡成功' : type === 'breakStart' ? '休息开始' : '休息结束'
    };
  }

  calculateWorkHours(record) {
    if (!record.clockIn || !record.clockOut) return 0;
    
    const inTime = new Date(`2024-01-01 ${record.clockIn}`);
    let outTime = new Date(`2024-01-01 ${record.clockOut}`);
    
    if (outTime < inTime) {
      outTime.setDate(outTime.getDate() + 1);
    }
    
    let breakMinutes = 0;
    for (const br of record.breaks) {
      if (br.start && br.end) {
        const brStart = new Date(`2024-01-01 ${br.start}`);
        const brEnd = new Date(`2024-01-01 ${br.end}`);
        breakMinutes += (brEnd - brStart) / 60000;
      }
    }
    
    return ((outTime - inTime) / 3600000) - (breakMinutes / 60);
  }

  getTimeClockRecords(employeeId, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const records = this.timeClocks.get(employeeId) || [];
    return records.find(r => r.date === dateStr) || null;
  }

  getTimeClockReport(startDate, endDate) {
    const report = [];
    
    for (const [employeeId, records] of this.timeClocks.entries()) {
      const employee = this.employees.get(employeeId);
      if (!employee) continue;
      
      const filteredRecords = records.filter(r => 
        new Date(r.date) >= new Date(startDate) && new Date(r.date) <= new Date(endDate)
      );
      
      if (filteredRecords.length > 0) {
        const totalHours = filteredRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
        const totalLateMinutes = filteredRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
        
        report.push({
          employeeId,
          employeeName: employee.name,
          department: employee.department,
          workDays: filteredRecords.length,
          totalHours: Math.round(totalHours * 100) / 100,
          lateDays: totalLateMinutes > 0 ? filteredRecords.filter(r => r.lateMinutes > 0).length : 0,
          records: filteredRecords
        });
      }
    }
    
    return report;
  }

  autoGenerateSchedule(date = new Date()) {
    const suggestions = [];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const requiredStaff = isWeekend ? 8 : 5;
    const perShift = Math.ceil(requiredStaff / 3);
    
    for (const department of this.departments) {
      const employees = this.getAllEmployees({ department, status: 'active' });
      const availableEmployees = employees.filter(e => {
        const hours = this.getScheduledHours(e.id, date);
        return hours < e.maxHoursPerWeek;
      });
      
      for (let shiftIndex = 0; shiftIndex < 3 && suggestions.length < requiredStaff; shiftIndex++) {
        const shiftKeys = Object.keys(this.shifts);
        const shift = shiftKeys[shiftIndex];
        
        for (let i = 0; i < perShift && suggestions.length < requiredStaff; i++) {
          if (availableEmployees[i]) {
            suggestions.push({
              employeeId: availableEmployees[i].id,
              employeeName: availableEmployees[i].name,
              department,
              date: date.toISOString().split('T')[0],
              shift,
              reason: '自动排班'
            });
          }
        }
      }
    }
    
    return suggestions;
  }

  getScheduledHours(employeeId, date) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const schedules = this.getSchedulesByEmployee(employeeId, 7)
      .filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate >= weekStart && scheduleDate <= weekEnd;
      });
    
    return schedules.reduce((sum, s) => {
      const shift = s.shiftInfo;
      const [startHour, startMin] = shift.start.split(':').map(Number);
      let [endHour, endMin] = shift.end.split(':').map(Number);
      
      let hours = endHour - startHour;
      if (hours < 0) hours += 24;
      
      return sum + hours;
    }, 0);
  }

  getScheduleReport(startDate, endDate) {
    const schedules = this.getSchedulesByDateRange(startDate, endDate);
    
    const report = {
      totalShifts: schedules.length,
      byDepartment: {},
      byShift: {},
      employees: {},
      generatedAt: new Date().toISOString()
    };
    
    for (const schedule of schedules) {
      report.byDepartment[schedule.department] = (report.byDepartment[schedule.department] || 0) + 1;
      report.byShift[schedule.shift] = (report.byShift[schedule.shift] || 0) + 1;
      
      if (!report.employees[schedule.employeeId]) {
        report.employees[schedule.employeeId] = {
          name: schedule.employeeName,
          shifts: 0,
          hours: 0
        };
      }
      report.employees[schedule.employeeId].shifts++;
      
      const shift = schedule.shiftInfo;
      const [startHour] = shift.start.split(':').map(Number);
      let [endHour] = shift.end.split(':').map(Number);
      let hours = endHour - startHour;
      if (hours < 0) hours += 24;
      report.employees[schedule.employeeId].hours += hours;
    }
    
    return report;
  }

  getWeeklySchedule(date = new Date()) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      const daySchedules = Array.from(this.schedules.values())
        .filter(s => s.date === dateStr);
      
      week.push({
        date: dateStr,
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i],
        schedules: daySchedules,
        totalShifts: daySchedules.length
      });
    }
    
    return week;
  }
}

module.exports = EmployeeSchedulingService;
