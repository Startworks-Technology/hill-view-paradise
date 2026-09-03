/**
 * ==============================================================================
 * File: src/services/seedService.js
 * Description: Initial Sample Dataset Seeding Utility (Villas & Plots)
 * 
 * Rules:
 * 1. Villas: Fixed ₹3,000 / month.
 * 2. Plots: Plot Size (in Sq. Yards) * ₹3 / month.
 * 3. Strictly scalar Firestore types (ZERO ARRAYS).
 * ==============================================================================
 */

import { createResident, getResidents } from './residentService';
import { createCollection } from './collectionService';
import { createExpense } from './expenseService';

/**
 * Standard realistic property seed profiles for Hill View Paradise.
 */
export const SAMPLE_PROPERTIES = [
  { villaNumber: 'Villa-101', residentName: 'Ravi Kumar', propertyType: 'Villa', plotSize: 0, phone: '9876543210', email: 'ravi.kumar@example.com' },
  { villaNumber: 'Villa-102', residentName: 'Anita Sharma', propertyType: 'Villa', plotSize: 0, phone: '9876543211', email: 'anita.sharma@example.com' },
  { villaNumber: 'Villa-103', residentName: 'Vikram Patel', propertyType: 'Villa', plotSize: 0, phone: '9876543212', email: 'vikram.patel@example.com' },
  { villaNumber: 'Villa-104', residentName: 'Sneha Deshmukh', propertyType: 'Villa', plotSize: 0, phone: '9876543213', email: 'sneha.d@example.com' },
  { villaNumber: 'Plot-42', residentName: 'Rajesh Kulkarni', propertyType: 'Plot', plotSize: 500, phone: '9876543214', email: 'rajesh.k@example.com' }, // 500 * 3 = 1500
  { villaNumber: 'Plot-43', residentName: 'Pooja Hegde', propertyType: 'Plot', plotSize: 800, phone: '9876543215', email: 'pooja.h@example.com' },       // 800 * 3 = 2400
  { villaNumber: 'Plot-44', residentName: 'Sanjay Verma', propertyType: 'Plot', plotSize: 1000, phone: '9876543216', email: 'sanjay.v@example.com' },    // 1000 * 3 = 3000
  { villaNumber: 'Plot-45', residentName: 'Amit Joshi', propertyType: 'Plot', plotSize: 600, phone: '9876543217', email: 'amit.j@example.com' },        // 600 * 3 = 1800
];

/**
 * Executes one-time database initialization with sample dataset.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const seedSampleData = async () => {
  try {
    // Check if data already exists to avoid unintended duplicates
    const existingResidents = await getResidents();
    if (existingResidents.length > 0) {
      return { success: false, message: 'Database already contains property records.' };
    }

    // 1. Seed Villas & Plots
    const createdResidents = [];
    for (const p of SAMPLE_PROPERTIES) {
      const created = await createResident(p);
      createdResidents.push(created);
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // 2. Seed Monthly Collections
    for (let i = 0; i < createdResidents.length; i++) {
      const res = createdResidents[i];
      const isPaid = i < createdResidents.length - 2; // Mark 6 as Paid and 2 as Pending
      const amount = res.monthlyMaintenance || (res.propertyType === 'Plot' ? Number(res.plotSize) * 3 : 3000);

      await createCollection({
        residentId: res.id,
        flatNumber: res.villaNumber || res.flatNumber,
        residentName: res.residentName,
        amount: amount,
        month: currentMonth,
        year: currentYear,
        paidDate: isPaid ? new Date().toISOString() : null,
        status: isPaid ? 'Paid' : 'Pending',
        paymentMode: isPaid ? (i % 2 === 0 ? 'UPI' : 'Bank Transfer') : 'UPI',
        notes: isPaid ? 'Paid on time' : 'Pending reminder sent',
      });
    }

    // 3. Seed Realistic Monthly Expenses
    const sampleExpenses = [
      { category: 'Electricity', description: 'Street lights & common pump electricity bill', amount: 4800, expenseDate: new Date().toISOString(), paymentMode: 'Bank Transfer', notes: 'MSEDCL Bill' },
      { category: 'Security', description: 'Monthly security guard agency charges', amount: 7500, expenseDate: new Date().toISOString(), paymentMode: 'Bank Transfer', notes: '2 guards 24/7' },
      { category: 'Cleaning', description: 'Daily road sweep & waste collection', amount: 3200, expenseDate: new Date().toISOString(), paymentMode: 'UPI', notes: 'CleanCare Services' },
      { category: 'Gardening', description: 'Avenue trees maintenance & lawn trim', amount: 1200, expenseDate: new Date().toISOString(), paymentMode: 'Cash', notes: 'GreenThumb Agency' },
      { category: 'Water', description: 'Water pipeline maintenance & filter change', amount: 1500, expenseDate: new Date().toISOString(), paymentMode: 'UPI', notes: 'Quarterly overhaul' },
    ];

    for (const exp of sampleExpenses) {
      await createExpense(exp);
    }

    return { success: true, message: 'Sample Villas, Plots, collections, and expenses seeded successfully!' };
  } catch (error) {
    console.error('Failed to seed sample data:', error);
    throw error;
  }
};
