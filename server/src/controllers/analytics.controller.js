import { Property } from '../models/Property.model.js';
import { User } from '../models/User.model.js';
import { Lease } from '../models/Lease.model.js';
import { RentPayment } from '../models/RentPayment.model.js';
import { MaintenanceTicket } from '../models/MaintenanceTicket.model.js';
import { AreaTrend } from '../models/AreaTrend.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { subMonths, format, startOfMonth } from 'date-fns';

// ── ADMIN OVERVIEW ────────────────────────────────────────
export const getAdminOverview = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const activeProperties = await Property.countDocuments({ status: 'ACTIVE' });
    const rentedProperties = await Property.countDocuments({ status: 'RENTED' });

    const totalUsers = await User.countDocuments();
    const ownerCount = await User.countDocuments({ role: 'OWNER' });
    const tenantCount = await User.countDocuments({ role: 'TENANT' });

    const payments = await RentPayment.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = payments[0]?.total || 0;

    const activeTickets = await MaintenanceTicket.countDocuments({
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    return sendSuccess(res, 200, 'Admin overview analytics retrieved', {
      properties: { total: totalProperties, active: activeProperties, rented: rentedProperties },
      users: { total: totalUsers, owners: ownerCount, tenants: tenantCount },
      revenue: totalRevenue,
      maintenance: { activeTickets },
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch admin overview', err.message);
  }
};

// ── OWNER OVERVIEW ────────────────────────────────────────
export const getOwnerOverview = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const properties = await Property.find({ owner: ownerId });
    const totalProperties = properties.length;
    const rentedProperties = properties.filter((p) => p.status === 'RENTED').length;
    const activeProperties = properties.filter((p) => p.status === 'ACTIVE').length;

    const activeLeases = await Lease.countDocuments({ owner: ownerId, status: 'ACTIVE' });

    // Calculate occupancy rate
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

    // Sum monthly rent collection
    const payments = await RentPayment.aggregate([
      { $match: { owner: ownerId, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalEarnings = payments[0]?.total || 0;

    const pendingTickets = await MaintenanceTicket.countDocuments({
      owner: ownerId,
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    return sendSuccess(res, 200, 'Owner overview analytics retrieved', {
      totalProperties,
      rentedProperties,
      activeProperties,
      activeLeases,
      occupancyRate: Math.round(occupancyRate),
      totalEarnings,
      pendingTickets,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch owner overview', err.message);
  }
};

// ── OWNER REVENUE (6-Month Trend for Recharts) ─────────────
export const getOwnerRevenueTrend = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const data = [];

    // Construct the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(today, i);
      const year = targetMonth.getFullYear();
      const monthIndex = targetMonth.getMonth() + 1; // 1-indexed
      const monthLabel = format(targetMonth, 'MMM yy');

      // Aggregate payments completed for this month
      const completedPayment = await RentPayment.aggregate([
        {
          $match: {
            owner: ownerId,
            status: 'COMPLETED',
            forMonth: monthIndex,
            forYear: year,
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);

      // Expected revenue from all active leases for this owner
      const activeLeases = await Lease.find({
        owner: ownerId,
        status: 'ACTIVE',
        startDate: { $lte: targetMonth },
        endDate: { $gte: targetMonth },
      }).select('monthlyRent');

      const expectedRevenue = activeLeases.reduce((sum, l) => sum + l.monthlyRent, 0);

      data.push({
        month: monthLabel,
        expected: expectedRevenue,
        actual: completedPayment[0]?.total || 0,
      });
    }

    return sendSuccess(res, 200, 'Owner revenue trends retrieved', data);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch revenue trends', err.message);
  }
};

// ── OWNER OCCUPANCY ───────────────────────────────────────
export const getOwnerOccupancy = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const properties = await Property.find({ owner: ownerId }).select('propertyType status');
    const data = properties.reduce((acc, p) => {
      const type = p.propertyType;
      if (!acc[type]) {
        acc[type] = { type, total: 0, rented: 0 };
      }
      acc[type].total += 1;
      if (p.status === 'RENTED') {
        acc[type].rented += 1;
      }
      return acc;
    }, {});

    const result = Object.values(data).map((item) => ({
      ...item,
      occupancyRate: item.total > 0 ? Math.round((item.rented / item.total) * 100) : 0,
    }));

    return sendSuccess(res, 200, 'Occupancy data retrieved', result);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch occupancy details', err.message);
  }
};

// ── AREA TRENDS ───────────────────────────────────────────
export const getAreaTrends = async (req, res) => {
  try {
    const { city, area } = req.query;

    if (!city || !area) {
      return sendError(res, 400, 'City and Area query params are required');
    }

    const trends = await AreaTrend.find({
      city: new RegExp(`^${city}$`, 'i'),
      area: new RegExp(`^${area}$`, 'i'),
    }).sort({ year: -1, month: -1 });

    return sendSuccess(res, 200, 'Area trends retrieved', trends);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch area trends', err.message);
  }
};

// ── CITY ANALYTICS ────────────────────────────────────────
export const getCityAnalytics = async (req, res) => {
  try {
    const { city } = req.params;

    const trends = await AreaTrend.find({
      city: new RegExp(`^${city}$`, 'i'),
    }).sort({ year: -1, month: -1 });

    return sendSuccess(res, 200, `Analytics for city ${city} retrieved`, trends);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch city analytics', err.message);
  }
};
