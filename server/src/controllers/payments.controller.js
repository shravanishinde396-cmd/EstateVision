import Razorpay from 'razorpay';
import crypto   from 'crypto';
import { RentPayment } from '../models/RentPayment.model.js';
import { Lease }       from '../models/Lease.model.js';
import { Property }    from '../models/Property.model.js';
import { Notification } from '../models/Notification.model.js';
import { emailService } from '../services/email.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { io } from '../../server.js'; // Socket.IO instance

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// STEP 1: Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { leaseId, month, year } = req.body;
    const tenantId = req.user.id;

    const lease = await Lease.findById(leaseId)
      .populate('property', 'address title rentAmount')
      .populate('owner', 'email firstName');

    if (!lease) return sendError(res, 404, 'Lease not found');
    if (lease.tenant.toString() !== tenantId) return sendError(res, 403, 'Not your lease');
    if (lease.status !== 'ACTIVE') return sendError(res, 400, 'Lease is not active');

    // Prevent duplicate payments
    const existing = await RentPayment.findOne({
      lease: leaseId, forMonth: month, forYear: year, status: 'COMPLETED',
    });
    if (existing) return sendError(res, 409, 'Rent already paid for this period');

    // Calculate late fee (₹50/day after the 5th)
    const dueDate = new Date(year, month - 1, lease.rentDueDay || 5);
    const today   = new Date();
    const daysLate = today > dueDate
      ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
      : 0;
    const lateFee    = daysLate * 50;
    const totalAmount = lease.monthlyRent + lateFee;

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `rent_${leaseId}_${month}_${year}_${Date.now()}`,
      notes: { leaseId, tenantId, month: String(month), year: String(year) },
    });

    // Upsert pending payment record
    const payment = await RentPayment.findOneAndUpdate(
      { lease: leaseId, forMonth: month, forYear: year, status: 'PENDING' },
      {
        $setOnInsert: {
          lease:           leaseId,
          tenant:          tenantId,
          owner:           lease.owner._id,
          property:        lease.property._id,
          amount:          lease.monthlyRent,
          lateFee,
          totalAmount,
          status:          'PENDING',
          forMonth:        month,
          forYear:         year,
          dueDate,
        },
        $set: { razorpayOrderId: order.id },
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, 200, 'Order created', {
      orderId:     order.id,
      amount:      totalAmount,
      currency:    'INR',
      key:         process.env.RAZORPAY_KEY_ID,
      paymentId:   payment._id,
      lateFee,
      daysLate,
      prefill: { name: req.user.fullName, email: req.user.email },
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to create order', err.message);
  }
};

// STEP 2: Verify Payment Signature
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Cryptographic signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return sendError(res, 400, 'Payment signature verification failed');
    }

    // Fetch Razorpay payment details for method info
    const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);

    // Update payment to COMPLETED
    const payment = await RentPayment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          razorpayPaymentId,
          razorpaySignature,
          status:        'COMPLETED',
          paidAt:        new Date(),
          paymentMethod: rzpPayment.method, // upi / card / netbanking
        },
      },
      { new: true }
    )
    .populate({ path: 'lease', populate: { path: 'property', select: 'address title' } })
    .populate('tenant', 'email firstName lastName')
    .populate('owner', 'email firstName');

    if (!payment) return sendError(res, 404, 'Payment record not found');

    // Update lease tracking
    await Lease.findByIdAndUpdate(payment.lease._id, {
      lastRentPaidAt: new Date(),
      nextDueDate: new Date(payment.forYear, payment.forMonth, payment.lease.rentDueDay || 5),
    });

    // Send receipt email (queued, non-blocking)
    emailService.sendRentReceipt({
      to: payment.tenant.email,
      tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
      propertyAddress: payment.lease.property.address,
      amount: payment.totalAmount,
      lateFee: payment.lateFee,
      month: payment.forMonth,
      year: payment.forYear,
      paymentId: razorpayPaymentId,
      paidAt: payment.paidAt,
    }).catch(err => console.error('Rent receipt email failed:', err.message));

    // Create in-app notification
    const notification = await Notification.create({
      user: payment.tenant._id,
      type: 'RENT_RECEIVED',
      title: 'Rent Payment Confirmed ✅',
      message: `Your rent of ₹${payment.totalAmount.toLocaleString('en-IN')} for ${payment.forMonth}/${payment.forYear} has been received.`,
      actionUrl: `/tenant/payments/${payment._id}`,
      metadata: { paymentId: payment._id, amount: payment.totalAmount },
    });

    // Push real-time notification via Socket.IO
    if (io) {
      io.to(`user:${payment.tenant._id}`).emit('notification:new', notification);
    }

    // Notify owner
    const ownerNotification = await Notification.create({
      user: payment.owner._id,
      type: 'RENT_RECEIVED',
      title: `Rent Received from ${payment.tenant.firstName}`,
      message: `₹${payment.totalAmount.toLocaleString('en-IN')} received for ${payment.lease.property.title}`,
      actionUrl: `/owner/revenue`,
      metadata: { paymentId: payment._id },
    });
    if (io) {
      io.to(`user:${payment.owner._id}`).emit('notification:new', ownerNotification);
    }

    return sendSuccess(res, 200, 'Payment verified successfully', { payment });
  } catch (err) {
    return sendError(res, 500, 'Payment verification failed', err.message);
  }
};

// STEP 3: Razorpay Webhook (raw body)
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body      = req.body; // raw Buffer

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body.toString());

    switch (event.event) {
      case 'payment.failed': {
        const { order_id, error_description } = event.payload.payment.entity;
        await RentPayment.findOneAndUpdate(
          { razorpayOrderId: order_id },
          { status: 'FAILED', failureReason: error_description }
        );
        break;
      }
      case 'refund.created': {
        const { payment_id } = event.payload.refund.entity;
        await RentPayment.findOneAndUpdate(
          { razorpayPaymentId: payment_id },
          { status: 'REFUNDED' }
        );
        break;
      }
    }

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ── GET PAYMENT HISTORY ───────────────────────────────────
export const getPaymentHistory = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'TENANT') {
      query = { tenant: req.user.id };
    } else if (req.user.role === 'OWNER') {
      query = { owner: req.user.id };
    }

    const payments = await RentPayment.find(query)
      .populate('property', 'title address city')
      .populate('tenant', 'firstName lastName email')
      .populate('lease', 'startDate endDate')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Payment history retrieved', payments);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve payment history', err.message);
  }
};

// ── GET RECEIPT ───────────────────────────────────────────
export const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await RentPayment.findById(id)
      .populate('property', 'title address city pincode state')
      .populate('tenant', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email')
      .populate('lease', 'startDate endDate rentDueDay');

    if (!payment) return sendError(res, 404, 'Payment record not found');

    // Auth check
    if (
      payment.tenant._id.toString() !== req.user.id &&
      payment.owner._id.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return sendError(res, 403, 'Unauthorized access to this receipt');
    }

    return sendSuccess(res, 200, 'Payment receipt retrieved', payment);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch receipt', err.message);
  }
};

// ── GET REVENUE ANALYTICS ─────────────────────────────────
export const getRevenueAnalytics = async (req, res) => {
  try {
    const query = { status: 'COMPLETED' };
    if (req.user.role === 'OWNER') {
      query.owner = req.user.id;
    }

    const payments = await RentPayment.find(query).select('totalAmount paidAt forMonth forYear');

    // Aggregate monthly revenue
    const revenueMap = {};
    payments.forEach((p) => {
      const key = `${p.forYear}-${String(p.forMonth).padStart(2, '0')}`;
      if (!revenueMap[key]) {
        revenueMap[key] = 0;
      }
      revenueMap[key] += p.totalAmount;
    });

    const monthlyAnalytics = Object.keys(revenueMap).map((key) => ({
      month: key,
      revenue: revenueMap[key],
    })).sort((a, b) => a.month.localeCompare(b.month));

    return sendSuccess(res, 200, 'Revenue analytics retrieved', monthlyAnalytics);
  } catch (err) {
    return sendError(res, 500, 'Failed to get revenue analytics', err.message);
  }
};
