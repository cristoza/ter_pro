/**
 * Seed script — creates default users for a fresh installation.
 * Run with: npm run seed
 *
 * Safe to run multiple times — skips users that already exist.
 * CHANGE PASSWORDS before going to production.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');
const { User } = require('../models');

const SALT_ROUNDS = 10;

const DEFAULT_USERS = [
    { username: 'admin',     password: 'admin123',     role: 'admin' },
    { username: 'doctor',    password: 'doctor123',    role: 'doctor' },
    { username: 'secretary', password: 'secretary123', role: 'secretary' },
];

async function seed() {
    await connectDB();

    console.log('Seeding default users...\n');

    for (const userData of DEFAULT_USERS) {
        const existing = await User.findOne({ where: { username: userData.username } });

        if (existing) {
            console.log(`  SKIP  "${userData.username}" — already exists`);
            continue;
        }

        const hashed = await bcrypt.hash(userData.password, SALT_ROUNDS);
        await User.create({
            username: userData.username,
            password: hashed,
            role: userData.role,
        });

        console.log(`  OK    "${userData.username}" (${userData.role})`);
    }

    console.log('\nSeed complete.');
    console.log('IMPORTANT: Change all default passwords before going to production!\n');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
