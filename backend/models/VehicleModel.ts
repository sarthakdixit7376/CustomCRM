import prisma from '../config/prisma.js';
import { fetchVehicleGovData, mapVehicleGovFields } from '../services/vehicleGovService.js';

export const VehicleModel = {
  getVehiclesByCustomerId: async (customerId: string) => {
    return prisma.vehicle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  },

  getVehicleById: async (id: string) => {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { customer: { select: { id: true, agentId: true } }, policies: true },
    });
  },

  createVehicle: async (customerId: string, carNumber: string) => {
    const govData = await fetchVehicleGovData(carNumber);
    const vehicleFields = mapVehicleGovFields(govData);

    return prisma.vehicle.create({
      data: {
        customerId,
        ...vehicleFields,
        misparRechev: vehicleFields.misparRechev ?? carNumber,
      },
    });
  },

  updateVehicle: async (id: string, data: any) => {
    const { id: _id, customerId: _customerId, createdAt: _createdAt, ...vehicleData } = data;
    return prisma.vehicle.update({
      where: { id },
      data: vehicleData,
    });
  },

  /** Cascades to delete any policies linked to this car (enforced at the DB level via onDelete: Cascade). */
  deleteVehicle: async (id: string) => {
    return prisma.vehicle.delete({ where: { id } });
  },
};
