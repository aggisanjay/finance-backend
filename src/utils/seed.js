import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { FinancialRecord } from '../models/FinancialRecord.js';

const seedUsers = [
  { name: 'Admin User', email: 'admin@finance.com', password: 'admin123', role: 'admin', status: 'active' },
  { name: 'Analyst User', email: 'analyst@finance.com', password: 'analyst123', role: 'analyst', status: 'active' },
  { name: 'Viewer User', email: 'viewer@finance.com', password: 'viewer123', role: 'viewer', status: 'active' },
  { name: 'Inactive User', email: 'inactive@finance.com', password: 'inactive123', role: 'viewer', status: 'inactive' },
];

const generateRecords = (userId, count = 50) => {
  const records = [];
  const types = ['income', 'expense'];
  const incomeCategories = ['salary', 'freelance', 'investment'];
  const expenseCategories = [
    'food', 'transport', 'utilities', 'entertainment', 'healthcare',
    'education', 'shopping', 'rent', 'insurance', 'tax', 'other',
  ];
  const descriptions = {
    salary: ['Monthly salary', 'Bonus payment', 'Overtime pay'],
    freelance: ['Web development project', 'Design work', 'Consulting fee'],
    investment: ['Stock dividends', 'Mutual fund returns', 'Real estate income'],
    food: ['Groceries', 'Restaurant dinner', 'Coffee shop', 'Lunch at work'],
    transport: ['Gas station', 'Uber ride', 'Monthly metro pass', 'Car maintenance'],
    utilities: ['Electricity bill', 'Water bill', 'Internet bill', 'Phone bill'],
    entertainment: ['Movie tickets', 'Netflix subscription', 'Concert tickets', 'Gaming'],
    healthcare: ['Doctor visit', 'Pharmacy', 'Dental checkup', 'Lab tests'],
    education: ['Online course', 'Books', 'Workshop fee', 'Certification exam'],
    shopping: ['Clothing', 'Electronics', 'Home decor', 'Gifts'],
    rent: ['Monthly rent', 'Parking space rent'],
    insurance: ['Health insurance', 'Car insurance', 'Life insurance'],
    tax: ['Income tax', 'Property tax'],
    other: ['Miscellaneous', 'Donation', 'Subscription'],
  };

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const categoryList = type === 'income' ? incomeCategories : expenseCategories;
    const category = categoryList[Math.floor(Math.random() * categoryList.length)];
    const descList = descriptions[category] || ['General transaction'];
    const description = descList[Math.floor(Math.random() * descList.length)];

    const amount =
      type === 'income'
        ? parseFloat((Math.random() * 5000 + 500).toFixed(2))
        : parseFloat((Math.random() * 500 + 5).toFixed(2));

    const now = new Date();
    const pastDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    const randomDate = new Date(
      pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())
    );

    records.push({ amount, type, category, date: randomDate, description, createdBy: userId });
  }

  return records;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.name} (${user.email}) [${user.role}]`);
    }

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const records = generateRecords(adminUser._id, 80);
    await FinancialRecord.insertMany(records);
    console.log(`\n💰 Created ${records.length} financial records`);

    const analystUser = createdUsers.find((u) => u.role === 'analyst');
    const analystRecords = generateRecords(analystUser._id, 30);
    await FinancialRecord.insertMany(analystRecords);
    console.log(`💰 Created ${analystRecords.length} additional financial records`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:    admin@finance.com    / admin123');
    console.log('Analyst:  analyst@finance.com  / analyst123');
    console.log('Viewer:   viewer@finance.com   / viewer123');
    console.log('Inactive: inactive@finance.com / inactive123');
    console.log('─────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seed();

