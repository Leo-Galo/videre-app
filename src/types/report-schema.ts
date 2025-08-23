
import { z } from 'zod';

export const reportGroups = [
  {
    group: "Ventas",
    reports: [
      { value: "detailed_sales", label: "Detalle de Facturas" },
      { value: "sales_by_salesperson", label: "Ranking por Asesor" },
    ],
  },
  {
    group: "Inventario",
    reports: [
      { value: "inventory_summary", label: "Resumen y Valoración" },
      { value: "inventory_pricing", label: "Precios y Costos" },
      { value: "popular_products", label: "Productos Populares (Marketing)" },
    ],
  },
  {
    group: "Pacientes y CRM",
    reports: [
      { value: "patient_list", label: "Listado General" },
      { value: "patient_prescriptions", label: "Prescripciones" },
      { value: "patient_visit_frequency", label: "Frecuencia de Visitas" },
      { value: "marketing_birthdays", label: "Cumpleaños del Periodo (Marketing)" },
      { value: "marketing_follow_ups", label: "Seguimientos Recomendados (Marketing)" },
    ],
  },
  {
    group: "Financiero",
    reports: [
      { value: "financial_expenses", label: "Reporte de Gastos", plan: 'Premium' },
      { value: "monthly_goal_compliance", label: "Cumplimiento de Meta Mensual", plan: 'Premium' },
    ],
  },
  {
    group: "Proveedores",
    reports: [
      { value: "supplier_purchases", label: "Resumen de Compras", plan: 'Pro' },
    ],
  }
] as const;

// Flatten all report values for validation
const allReportValues = reportGroups.flatMap(g => g.reports.map(r => r.value)) as [string, ...string[]];

export const generateReportSchema = z.object({
  reportType: z.enum(allReportValues, {
    required_error: "Debe seleccionar un tipo de reporte.",
  }),
  dateRange: z.object({
      from: z.date({ required_error: "La fecha de inicio es requerida."}),
      to: z.date({ required_error: "La fecha de fin es requerida."})
  }, { required_error: "El rango de fechas es requerido."})
  .refine(data => data.to >= data.from, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["to"],
  }),
  // Mantener estos para la lógica de onSubmit, pero no en el formulario visible
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});
