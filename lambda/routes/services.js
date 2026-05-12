const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');
const roomReservationService = require('../services/roomReservationService');
const eventService = require('../services/eventService');
const { requireAuth } = require('../middleware/auth');

router.post('/invoice/issue', requireAuth, async (req, res) => {
  try {
    const { orderNo, taxNumber, companyName, email } = req.body;
    
    if (!orderNo || !taxNumber || !companyName) {
      return res.status(400).json({ success: false, code: 1001, message: '缺少必要参数' });
    }

    const result = await invoiceService.issueInvoice(orderNo, taxNumber, companyName, email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/invoice/:invoiceNo', requireAuth, async (req, res) => {
  try {
    const { invoiceNo } = req.params;
    const invoice = await invoiceService.getInvoice(invoiceNo);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/invoice/order/:orderNo', requireAuth, async (req, res) => {
  try {
    const { orderNo } = req.params;
    const invoices = await invoiceService.getOrderInvoices(orderNo);
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await roomReservationService.getRooms();
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomReservationService.getRoomById(roomId);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.post('/rooms/reserve', requireAuth, async (req, res) => {
  try {
    const { roomId, date, timeSlot, people, phone, remarks } = req.body;
    
    if (!roomId || !date || !timeSlot || !people || !phone) {
      return res.status(400).json({ success: false, code: 1001, message: '缺少必要参数' });
    }

    const result = await roomReservationService.reserveRoom(
      req.userId, roomId, date, timeSlot, people, phone, remarks
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.post('/rooms/reservation/:reservationNo/confirm', requireAuth, async (req, res) => {
  try {
    const { reservationNo } = req.params;
    const result = await roomReservationService.confirmReservation(reservationNo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.post('/rooms/reservation/:reservationNo/cancel', requireAuth, async (req, res) => {
  try {
    const { reservationNo } = req.params;
    const result = await roomReservationService.cancelReservation(reservationNo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/rooms/reservations', requireAuth, async (req, res) => {
  try {
    const reservations = await roomReservationService.getUserReservations(req.userId);
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { status } = req.query;
    const events = await eventService.getAllEvents(status || 'active');
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/events/current', async (req, res) => {
  try {
    const events = await eventService.getCurrentEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/events/upcoming', async (req, res) => {
  try {
    const events = await eventService.getUpcomingEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await eventService.getEventById(eventId);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.post('/events', requireAuth, async (req, res) => {
  try {
    const { name, description, start_date, end_date, type, discount, conditions, image_url } = req.body;
    
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, code: 1001, message: '缺少必要参数' });
    }

    const result = await eventService.createEvent({
      name, description, start_date, end_date, type, discount, conditions, image_url
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.put('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await eventService.updateEvent(eventId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

router.delete('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await eventService.deleteEvent(eventId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, code: 1002, message: error.message });
  }
});

module.exports = router;