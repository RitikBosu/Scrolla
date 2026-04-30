import User from '../models/User.js';
import jwt from 'jsonwebtoken';

describe('Authentication - User Model Tests', () => {
    describe('User Registration & Validation', () => {
        it('should create a new user with valid data', async () => {
            const startTime = Date.now();
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            const duration = Date.now() - startTime;

            expect(user).toBeDefined();
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user._id).toBeDefined();
            expect(duration).toBeLessThan(500);
        });

        it('should fail with invalid email', async () => {
            try {
                await User.create({
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'password123'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should fail with short username (min 3 chars)', async () => {
            try {
                await User.create({
                    username: 'ab',
                    email: 'test@example.com',
                    password: 'password123'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should fail with long username (max 30 chars)', async () => {
            try {
                await User.create({
                    username: 'a'.repeat(31),
                    email: 'test@example.com',
                    password: 'password123'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should fail with short password (min 6 chars)', async () => {
            try {
                await User.create({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '12345'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should prevent duplicate email', async () => {
            await User.create({
                username: 'user1',
                email: 'test@example.com',
                password: 'password123'
            });

            try {
                await User.create({
                    username: 'user2',
                    email: 'test@example.com',
                    password: 'password123'
                });
                fail('Should have thrown duplicate error');
            } catch (error) {
                expect(error.code).toBe(11000);
            }
        });

        it('should prevent duplicate username', async () => {
            await User.create({
                username: 'testuser',
                email: 'test1@example.com',
                password: 'password123'
            });

            try {
                await User.create({
                    username: 'testuser',
                    email: 'test2@example.com',
                    password: 'password123'
                });
                fail('Should have thrown duplicate error');
            } catch (error) {
                expect(error.code).toBe(11000);
            }
        });
    });

    describe('User Password Security', () => {
        it('should hash password before saving', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(20);
        });

        it('should allow password comparison', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('User Profile Attributes', () => {
        it('should create user with default avatar', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            expect(user.avatar).toBeDefined();
            expect(user.avatar).toContain('dicebear');
        });

        it('should allow bio up to 200 characters', async () => {
            const bio = 'a'.repeat(200);
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                bio: bio
            });

            expect(user.bio).toBe(bio);
        });

        it('should reject bio over 200 characters', async () => {
            try {
                await User.create({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    bio: 'a'.repeat(201)
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });
    });

    describe('User Retrieval', () => {
        it('should retrieve user by email', async () => {
            const created = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const found = await User.findOne({ email: 'test@example.com' });
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should retrieve user by username', async () => {
            const created = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const found = await User.findOne({ username: 'testuser' });
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null for non-existent user', async () => {
            const found = await User.findOne({ email: 'nonexistent@example.com' });
            expect(found).toBeNull();
        });
    });
});
