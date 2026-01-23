import type { VehicleStatus } from '~/models/Vehicle'

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('fr-FR').format(mileage) + ' km'
}

export function getStatusLabel(status: VehicleStatus): string {
  const labels: Record<VehicleStatus, string> = {
    excellent: 'Excellent',
    good: 'Bon',
    warning: 'Attention',
    critical: 'Critique'
  }
  return labels[status]
}

export function getStatusColor(status: VehicleStatus): string {
  const colors: Record<VehicleStatus, string> = {
    excellent: '#22c55e',
    good: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444'
  }
  return colors[status]
}
