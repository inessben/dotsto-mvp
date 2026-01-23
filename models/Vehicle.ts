export type VehicleStatus = 'excellent' | 'good' | 'warning' | 'critical'
export type InspectionStatus = 'valid' | 'expiring' | 'expired'

export interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  status: VehicleStatus
  ecoScore: number
  technicalInspection: {
    status: InspectionStatus
    nextDate: string
  }
  insurance: {
    status: InspectionStatus
    expiryDate: string
  }
  maintenance: {
    status: string
    mileage: number
  }
}
