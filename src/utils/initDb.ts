import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { UserRole, UserStatus } from '@/types/enums';

export const initializeDatabase = async () => {
  try {
    console.log('Initializing Database...');

    // Create Demo Admin if not exists
    const adminEmail = 'admin@secondbrain.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        phone: '0000000000',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phoneVerified: true
      });
      console.log(`- Demo Admin created: ${adminEmail} / Admin@123`);
    }

    console.log('Database Initialization complete.');
  } catch (error) {
    console.error('Database Initialization failed:', error);
  }
};
