// Seed initial users with roles
require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, Therapist } = require('../src/models');
const { sequelize } = require('../src/config/db');

async function seedUsers() {
    try {
        await sequelize.sync();
        
        console.log('Seeding users...');
        
        // Hash passwords
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create admin user
        const [adminUser, adminCreated] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                password: hashedPassword,
                role: 'admin',
            }
        });
        console.log(adminCreated ? '✓ Admin user created' : '- Admin user already exists');
        
        // Create doctor user
        const [doctorUser, doctorCreated] = await User.findOrCreate({
            where: { username: 'doctor' },
            defaults: {
                password: await bcrypt.hash('doctor123', 10),
                role: 'doctor',
            }
        });
        console.log(doctorCreated ? '✓ Doctor user created' : '- Doctor user already exists');
        
        // Create secretary user
        const [secretaryUser, secretaryCreated] = await User.findOrCreate({
            where: { username: 'secretary' },
            defaults: {
                password: await bcrypt.hash('secretary123', 10),
                role: 'secretary',
            }
        });
        console.log(secretaryCreated ? '✓ Secretary user created' : '- Secretary user already exists');
        
        // Get therapists and create accounts for them
        const therapists = await Therapist.findAll();
        
        for (const therapist of therapists) {
            const username = therapist.name.toLowerCase().replace(/\s+/g, '.');
            const [therapistUser, created] = await User.findOrCreate({
                where: { username },
                defaults: {
                    password: await bcrypt.hash('therapist123', 10),
                    role: 'therapist',
                    therapistId: therapist.id,
                }
            });
            console.log(created ? `✓ Therapist user created: ${username}` : `- Therapist user already exists: ${username}`);
        }
        
        console.log('\n=== Login Credentials ===');
        console.log('Admin: username=admin, password=admin123');
        console.log('Doctor: username=doctor, password=doctor123');
        console.log('Secretary: username=secretary, password=secretary123');
        console.log('Therapists: username=[therapist.name in lowercase with dots], password=therapist123');
        console.log('  Examples: ana.morales, carlos.vega, maría.ruiz');
        
        await sequelize.close();
        console.log('\n✓ Users seeded successfully!');
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
