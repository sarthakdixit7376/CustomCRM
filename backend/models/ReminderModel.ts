import prisma from '../config/prisma.js';

/** undefined -> undefined (skip field), '' / null -> null (clear), else -> Date */
const toDate = (value: any): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
};

export const ReminderModel = {
  /**
   * Get all reminders. Admin sees all; agents see only their customers' reminders.
   */
  getReminders: async (agentId?: string) => {
    return prisma.reminder.findMany({
      where: agentId ? { customer: { agentId } } : undefined,
      orderBy: { remindAt: 'asc' },
      include: {
        customer: { select: { id: true, customerName: true } },
        policy: { select: { id: true, policyNumber: true, policyType: true, endDate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get due/overdue unread reminders (remindAt <= now, isRead = false).
   */
  getDueReminders: async (agentId?: string) => {
    return prisma.reminder.findMany({
      where: {
        remindAt: { lte: new Date() },
        isRead: false,
        ...(agentId ? { customer: { agentId } } : {}),
      },
      orderBy: { remindAt: 'asc' },
      include: {
        customer: { select: { id: true, customerName: true } },
        policy: { select: { id: true, policyNumber: true, policyType: true } },
      },
    });
  },

  /**
   * Get reminders for a specific customer.
   */
  getRemindersByCustomer: async (customerId: string) => {
    return prisma.reminder.findMany({
      where: { customerId },
      orderBy: { remindAt: 'asc' },
      include: {
        policy: { select: { id: true, policyNumber: true, policyType: true, endDate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get a single reminder by ID.
   */
  getReminderById: async (id: string) => {
    return prisma.reminder.findUnique({
      where: { id },
      include: {
        customer: true,
        policy: true,
      },
    });
  },

  /**
   * Create a manual reminder.
   */
  createReminder: async (data: {
    customerId: string;
    text: string;
    remindAt: string | Date;
    createdById: string;
    policyId?: string;
  }) => {
    return prisma.reminder.create({
      data: {
        customerId: data.customerId,
        text: data.text,
        remindAt: new Date(data.remindAt),
        createdById: data.createdById,
        policyId: data.policyId || null,
        isAuto: false,
        isRead: false,
      },
      include: {
        customer: { select: { id: true, customerName: true } },
        policy: { select: { id: true, policyNumber: true, policyType: true, endDate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Update a reminder (text, remindAt). Resets isRead to false if date is moved to the future.
   */
  updateReminder: async (id: string, data: { text?: string; remindAt?: string | Date }) => {
    const updateData: any = {};
    if (data.text !== undefined) updateData.text = data.text;
    if (data.remindAt !== undefined) {
      const newDate = new Date(data.remindAt);
      updateData.remindAt = newDate;
      // If date is moved to the future, automatically un-read it
      if (newDate > new Date()) {
        updateData.isRead = false;
      }
    }

    return prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, customerName: true } },
        policy: { select: { id: true, policyNumber: true, policyType: true, endDate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Auto-create or update a "1 month before policy end date" reminder.
   * Uses upsert keyed on policyId + isAuto.
   */
  upsertPolicyReminder: async (
    policyId: string,
    customerId: string,
    endDate: Date,
    createdById: string,
    policyNumber: string,
    customerName: string
  ) => {
    // Calculate 1 calendar month before endDate
    const remindAt = new Date(endDate);
    remindAt.setMonth(remindAt.getMonth() - 1);

    // If the reminder date is already in the past, still create it (it will show as overdue)
    const text = `Policy ${policyNumber} for ${customerName} expires on ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;

    // Check if an auto-reminder for this policy already exists
    const existing = await prisma.reminder.findFirst({
      where: { policyId, isAuto: true },
    });

    if (existing) {
      return prisma.reminder.update({
        where: { id: existing.id },
        data: {
          text,
          remindAt,
          isRead: remindAt > new Date() ? false : existing.isRead,
        },
      });
    }

    return prisma.reminder.create({
      data: {
        customerId,
        policyId,
        createdById,
        text,
        remindAt,
        isAuto: true,
        isRead: false,
      },
    });
  },

  /**
   * Mark a single reminder as read.
   */
  markAsRead: async (id: string) => {
    return prisma.reminder.update({
      where: { id },
      data: { isRead: true },
    });
  },

  /**
   * Mark all due reminders as read for a given user's customers.
   */
  markAllAsRead: async (agentId?: string) => {
    return prisma.reminder.updateMany({
      where: {
        remindAt: { lte: new Date() },
        isRead: false,
        ...(agentId ? { customer: { agentId } } : {}),
      },
      data: { isRead: true },
    });
  },

  /**
   * Delete a reminder by ID.
   */
  deleteReminder: async (id: string) => {
    try {
      await prisma.reminder.delete({ where: { id } });
      return true;
    } catch {
      return null;
    }
  },
};
