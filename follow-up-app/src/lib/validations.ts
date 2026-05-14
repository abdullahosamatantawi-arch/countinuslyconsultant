import { z } from 'zod';

/**
 * Validation schema for the Consultant Registration form.
 * Ensures data integrity before saving to Supabase and sending to n8n.
 */
export const consultantApplicationSchema = z.object({
  company_name: z.string().min(3, { message: 'يجب أن يكون اسم المكتب 3 أحرف على الأقل' }),
  license_number: z.string().min(5, { message: 'رقم الرخصة غير صالح' }),
  contact_person: z.string().min(3, { message: 'الرجاء إدخال الاسم الثلاثي للمسؤول' }),
  email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
  phone: z.string().regex(/^[0-9\s+]{8,}$/, { message: 'رقم الهاتف غير صحيح (8 أرقام على الأقل)' }),
  specialization: z.string().optional().or(z.literal('')),
  experience_years: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().optional()
  ),
});

export type ConsultantApplicationInput = z.infer<typeof consultantApplicationSchema>;
