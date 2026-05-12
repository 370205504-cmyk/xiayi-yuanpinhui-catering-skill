const db = require('../database/db');
const logger = require('../utils/logger');

class EventService {
  async getAllEvents(status = 'active') {
    const query = status === 'all'
      ? 'SELECT * FROM events ORDER BY start_date DESC'
      : 'SELECT * FROM events WHERE status = ? ORDER BY start_date DESC';

    const [events] = status === 'all'
      ? await db.query(query)
      : await db.query(query, [status]);

    return events;
  }

  async getEventById(eventId) {
    const [events] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      throw new Error('活动不存在');
    }

    return events[0];
  }

  async getCurrentEvents() {
    const now = new Date().toISOString().split('T')[0];
    const [events] = await db.query(
      'SELECT * FROM events WHERE status = "active" AND start_date <= ? AND end_date >= ? ORDER BY start_date ASC',
      [now, now]
    );

    return events;
  }

  async getUpcomingEvents() {
    const now = new Date().toISOString().split('T')[0];
    const [events] = await db.query(
      'SELECT * FROM events WHERE status = "active" AND start_date > ? ORDER BY start_date ASC LIMIT 10',
      [now]
    );

    return events;
  }

  async createEvent(eventData) {
    const { name, description, start_date, end_date, type, discount, conditions, image_url } = eventData;

    const [result] = await db.query(
      'INSERT INTO events (name, description, start_date, end_date, type, discount, conditions, image_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, description, start_date, end_date, type, discount, conditions, image_url, 'active']
    );

    logger.info('活动创建成功', { eventId: result.insertId, name });

    return {
      success: true,
      eventId: result.insertId,
      ...eventData
    };
  }

  async updateEvent(eventId, eventData) {
    const updates = [];
    const values = [];

    if (eventData.name) {
      updates.push('name = ?');
      values.push(eventData.name);
    }
    if (eventData.description) {
      updates.push('description = ?');
      values.push(eventData.description);
    }
    if (eventData.start_date) {
      updates.push('start_date = ?');
      values.push(eventData.start_date);
    }
    if (eventData.end_date) {
      updates.push('end_date = ?');
      values.push(eventData.end_date);
    }
    if (eventData.type) {
      updates.push('type = ?');
      values.push(eventData.type);
    }
    if (eventData.discount) {
      updates.push('discount = ?');
      values.push(eventData.discount);
    }
    if (eventData.conditions) {
      updates.push('conditions = ?');
      values.push(eventData.conditions);
    }
    if (eventData.image_url) {
      updates.push('image_url = ?');
      values.push(eventData.image_url);
    }
    if (eventData.status) {
      updates.push('status = ?');
      values.push(eventData.status);
    }

    values.push(eventId);

    const [result] = await db.query(
      `UPDATE events SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('活动不存在');
    }

    logger.info('活动更新成功', { eventId });

    return { success: true, eventId };
  }

  async deleteEvent(eventId) {
    const [result] = await db.query(
      'DELETE FROM events WHERE id = ?',
      [eventId]
    );

    if (result.affectedRows === 0) {
      throw new Error('活动不存在');
    }

    logger.info('活动删除成功', { eventId });

    return { success: true, eventId };
  }

  async getEventByType(type) {
    const [events] = await db.query(
      'SELECT * FROM events WHERE status = "active" AND type = ? ORDER BY start_date DESC',
      [type]
    );

    return events;
  }
}

module.exports = new EventService();