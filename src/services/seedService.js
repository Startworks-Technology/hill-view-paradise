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
import { createMediaItem, setMonthlyDriveFolder } from './galleryService';

/**
 * Standard realistic property seed profiles for Hill View Paradise.
 */
export const SAMPLE_PROPERTIES = [
  { villaNumber: 'Villa-101', residentName: 'Ravi Kumar', propertyType: 'Villa', plotSize: 0, phone: '9876543210', email: 'ravi.kumar@example.com', outstandingBalance: 0 },
  { villaNumber: 'Villa-102', residentName: 'Anita Sharma', propertyType: 'Villa', plotSize: 0, phone: '9876543211', email: 'anita.sharma@example.com', outstandingBalance: 3000 },
  { villaNumber: 'Villa-103', residentName: 'Vikram Patel', propertyType: 'Villa', plotSize: 0, phone: '9876543212', email: 'vikram.patel@example.com', outstandingBalance: 0 },
  { villaNumber: 'Villa-104', residentName: 'Sneha Deshmukh', propertyType: 'Villa', plotSize: 0, phone: '9876543213', email: 'sneha.d@example.com', outstandingBalance: 6000 },
  { villaNumber: 'Plot-42', residentName: 'Rajesh Kulkarni', propertyType: 'Plot', plotSize: 500, phone: '9876543214', email: 'rajesh.k@example.com', outstandingBalance: 0 }, // 500 * 3 = 1500
  { villaNumber: 'Plot-43', residentName: 'Pooja Hegde', propertyType: 'Plot', plotSize: 800, phone: '9876543215', email: 'pooja.h@example.com', outstandingBalance: 2400 },       // 800 * 3 = 2400
  { villaNumber: 'Plot-44', residentName: 'Sanjay Verma', propertyType: 'Plot', plotSize: 1000, phone: '9876543216', email: 'sanjay.v@example.com', outstandingBalance: 0 },    // 1000 * 3 = 3000
  { villaNumber: 'Plot-45', residentName: 'Amit Joshi', propertyType: 'Plot', plotSize: 600, phone: '9876543217', email: 'amit.j@example.com', outstandingBalance: 1800 },        // 600 * 3 = 1800
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

    // 4. Seed Gallery Media & Monthly Shared Drive Folder
    await setMonthlyDriveFolder(
      currentMonth,
      currentYear,
      'https://drive.google.com/drive/folders/1HVP_SharedDrive_MonthlyGalleryFolderExample',
      `Hill View Paradise - ${currentMonth}/${currentYear} Media Folder`
    );

    const sampleMedia = [
      {
        title: 'Independence Day Celebrations & Flag Hoisting',
        description: 'Society members gathering at the central park for 15th August celebrations and cultural programs.',
        mediaType: 'image',
        driveLink: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
        album: 'Festivals & Celebrations',
        month: currentMonth,
        year: currentYear,
        eventDate: new Date().toISOString().split('T')[0],
      },
      {
        title: 'Clubhouse Landscaping & Lawn Beautification',
        description: 'Completed avenue tree plantations, flowering shrubs, and fresh lawn grass around clubhouse perimeter.',
        mediaType: 'image',
        driveLink: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
        album: 'Landscaping & Gardens',
        month: currentMonth,
        year: currentYear,
        eventDate: new Date().toISOString().split('T')[0],
      },
      {
        title: 'Monsoon Tree Plantation Drive Highlights',
        description: 'Short video highlights from our annual community sapling plantation drive near the north boundary wall.',
        mediaType: 'video',
        driveLink: 'https://drive.google.com/file/d/1ExampleDriveVideoId998877/view?usp=sharing',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        album: 'Landscaping & Gardens',
        month: currentMonth,
        year: currentYear,
        eventDate: new Date().toISOString().split('T')[0],
      },
      {
        title: 'Solar Street Lights Installation Completed',
        description: 'New eco-friendly solar street lights installed across all society internal avenues and entry gates.',
        mediaType: 'image',
        driveLink: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
        album: 'Maintenance & Infrastructure',
        month: currentMonth,
        year: currentYear,
        eventDate: new Date().toISOString().split('T')[0],
      },
    ];

    for (const media of sampleMedia) {
      await createMediaItem(media);
    }

    return { success: true, message: 'Sample dataset, collections, expenses, and media gallery initialized successfully!' };
  } catch (error) {
    console.error('Failed to seed sample data:', error);
    throw error;
  }
};
