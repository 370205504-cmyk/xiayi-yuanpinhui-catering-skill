const db = require('../database/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class RoomReservationService {
  async getRooms() {
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE status = "available" ORDER BY capacity ASC'
    );

    return rooms;
  }

  async getRoomById(roomId) {
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    if (rooms.length === 0) {
      throw new Error('包间不存在');
    }

    return rooms[0];
  }

  async checkAvailability(roomId, date, timeSlot) {
    const [reservations] = await db.query(
      'SELECT * FROM room_reservations WHERE room_id = ? AND date = ? AND time_slot = ? AND status IN ("confirmed", "pending")',
      [roomId, date, timeSlot]
    );

    return reservations.length === 0;
  }

  async reserveRoom(userId, roomId, date, timeSlot, people, phone, remarks = '') {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [rooms] = await connection.query(
        'SELECT * FROM rooms WHERE id = ? AND status = "available"',
        [roomId]
      );

      if (rooms.length === 0) {
        throw new Error('包间不存在或不可用');
      }

      const room = rooms[0];

      if (!await this.checkAvailability(roomId, date, timeSlot)) {
        throw new Error('该时间段已被预订');
      }

      if (people > room.capacity) {
        throw new Error(`人数超过包间容量，该包间最多容纳${room.capacity}人`);
      }

      const reservationId = uuidv4();
      const reservationNo = `BJ${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      await connection.query(
        'INSERT INTO room_reservations (id, reservation_no, room_id, user_id, date, time_slot, people, phone, remarks, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [reservationId, reservationNo, roomId, userId, date, timeSlot, people, phone, remarks, 'pending']
      );

      await connection.commit();

      logger.info('包间预订成功', { reservationNo, roomId, userId });

      return {
        success: true,
        reservationId,
        reservationNo,
        roomId,
        roomName: room.name,
        roomCapacity: room.capacity,
        date,
        timeSlot,
        people,
        phone,
        remarks,
        status: 'pending'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('包间预订失败', { error: error.message, roomId, userId });
      throw error;
    } finally {
      connection.release();
    }
  }

  async confirmReservation(reservationNo) {
    const [reservations] = await db.query(
      'UPDATE room_reservations SET status = "confirmed", confirmed_at = NOW() WHERE reservation_no = ? AND status = "pending"',
      [reservationNo]
    );

    if (reservations.affectedRows === 0) {
      throw new Error('预订不存在或已确认');
    }

    return { success: true, reservationNo, status: 'confirmed' };
  }

  async cancelReservation(reservationNo) {
    const [reservations] = await db.query(
      'UPDATE room_reservations SET status = "cancelled", cancelled_at = NOW() WHERE reservation_no = ? AND status IN ("pending", "confirmed")',
      [reservationNo]
    );

    if (reservations.affectedRows === 0) {
      throw new Error('预订不存在或已取消');
    }

    return { success: true, reservationNo, status: 'cancelled' };
  }

  async getUserReservations(userId) {
    const [reservations] = await db.query(
      'SELECT r.*, rm.name as room_name, rm.capacity as room_capacity FROM room_reservations r JOIN rooms rm ON r.room_id = rm.id WHERE r.user_id = ? ORDER BY r.date DESC, r.time_slot ASC',
      [userId]
    );

    return reservations;
  }

  async getTodayReservations() {
    const today = new Date().toISOString().split('T')[0];
    const [reservations] = await db.query(
      'SELECT r.*, rm.name as room_name FROM room_reservations r JOIN rooms rm ON r.room_id = rm.id WHERE r.date = ? AND r.status IN ("pending", "confirmed") ORDER BY r.time_slot ASC',
      [today]
    );

    return reservations;
  }
}

module.exports = new RoomReservationService();