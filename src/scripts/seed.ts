import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local from project root
config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function seed() {
  console.log('🌱 Seeding database...');
  
  const client = await pool.connect();
  
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const memberPassword = await bcrypt.hash('Member@123', 12);

    // Create admin user if not exists
    const adminResult = await client.query(`
      INSERT INTO users (id, name, email, password, phone, role, "isBlocked", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Admin User', 'admin@fitsense.com', $1, '+1234567890', 'ADMIN', false, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `, [adminPassword]);
    
    if (adminResult.rows[0]) {
      console.log('✅ Created admin user: admin@fitsense.com (password: Admin@123)');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create sample member users
    const members = [
      { name: 'John Doe', email: 'john@example.com', phone: '+1234567891' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567892' },
      { name: 'Test Member', email: 'member@fitsense.com', phone: '+1234567893' },
    ];

    for (const member of members) {
      const result = await client.query(`
        INSERT INTO users (id, name, email, password, phone, role, "isBlocked", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'MEMBER', false, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email
      `, [member.name, member.email, memberPassword, member.phone]);
      
      if (result.rows[0]) {
        console.log(`✅ Created member: ${member.email} (password: Member@123)`);
      } else {
        console.log(`ℹ️ Member ${member.email} already exists`);
      }
    }

    // Create sample membership plans if not exist
    const plans = [
      { name: 'Basic Plan', price: 29.99, durationDays: 30, description: 'Access to gym facilities', features: { gymAccess: true, groupClasses: false, personalTrainer: false } },
      { name: 'Premium Plan', price: 59.99, durationDays: 30, description: 'Full access with group classes', features: { gymAccess: true, groupClasses: true, personalTrainer: false, dietPlan: true } },
      { name: 'VIP Plan', price: 99.99, durationDays: 30, description: 'Complete fitness package', features: { gymAccess: true, groupClasses: true, personalTrainer: true, dietPlan: true, aiWorkouts: true } },
    ];

    for (const plan of plans) {
      // Check if plan exists first
      const existing = await client.query(`SELECT id FROM plans WHERE name = $1`, [plan.name]);
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO plans (id, name, price, "durationDays", description, features, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        `, [plan.name, plan.price, plan.durationDays, plan.description, JSON.stringify(plan.features)]);
        console.log(`✅ Created plan: ${plan.name}`);
      } else {
        console.log(`ℹ️ Plan ${plan.name} already exists`);
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log('\n📋 Test credentials:');
    console.log('   Admin: admin@fitsense.com / Admin@123');
    console.log('   Member: member@fitsense.com / Member@123');

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
