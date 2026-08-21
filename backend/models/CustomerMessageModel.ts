import prisma from '../config/prisma.js';

export const CustomerMessageModel = {
  /**
   * Get all messages for a specific customer, newest first.
   */
  getMessagesByCustomer: async (customerId: string) => {
    return prisma.customerMessage.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get a single message by ID.
   */
  getMessageById: async (id: string) => {
    return prisma.customerMessage.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, customerName: true, agentId: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Create a message on a customer.
   */
  createMessage: async (data: { customerId: string; text: string; createdById: string }) => {
    return prisma.customerMessage.create({
      data: {
        customerId: data.customerId,
        text: data.text,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Delete a message by ID.
   */
  deleteMessage: async (id: string) => {
    try {
      await prisma.customerMessage.delete({ where: { id } });
      return true;
    } catch {
      return null;
    }
  },
};
