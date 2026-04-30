import MoodLog from '../models/MoodLog.js';
import User from '../models/User.js';

describe('Mood Logging - Model Tests', () => {
    let userId;

    beforeEach(async () => {
        const user = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        userId = user._id;
    });

    describe('Mood Creation & Validation', () => {
        it('should create a mood with all mood types', async () => {
            const moods = ['joyful', 'happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'energised'];
            const results = [];

            for (const moodType of moods) {
                const startTime = Date.now();
                const mood = await MoodLog.create({
                    userId,
                    mood: moodType,
                    energy: 3,
                    note: `Testing ${moodType}`,
                    date: new Date().toISOString().split('T')[0]
                });
                const duration = Date.now() - startTime;

                results.push(mood);
                expect(mood.mood).toBe(moodType);
                expect(duration).toBeLessThan(300);
            }

            expect(results.length).toBe(8);
        });

        it('should capture timestamp on creation', async () => {
            const beforeTime = Date.now();
            const mood = await MoodLog.create({
                userId,
                mood: 'happy',
                energy: 3,
                date: new Date().toISOString().split('T')[0]
            });
            const afterTime = Date.now();

            expect(mood.createdAt).toBeDefined();
            expect(mood.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
            expect(mood.createdAt.getTime()).toBeLessThanOrEqual(afterTime);
        });

        it('should validate energy scale (1-5)', async () => {
            try {
                await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy: 0,
                    date: new Date().toISOString().split('T')[0]
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }

            try {
                await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy: 6,
                    date: new Date().toISOString().split('T')[0]
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should allow valid energy levels (1-5)', async () => {
            for (let i = 1; i <= 5; i++) {
                const mood = await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy: i,
                    date: new Date().toISOString().split('T')[0]
                });
                expect(mood.energy).toBe(i);
            }
        });

        it('should require mood type', async () => {
            try {
                await MoodLog.create({
                    userId,
                    energy: 3,
                    date: new Date().toISOString().split('T')[0]
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should require date', async () => {
            try {
                await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy: 3
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });
    });

    describe('Mood Retrieval', () => {
        it('should retrieve moods by user', async () => {
            const today = new Date().toISOString().split('T')[0];

            await MoodLog.create({
                userId,
                mood: 'happy',
                energy: 4,
                date: today
            });
            await MoodLog.create({
                userId,
                mood: 'calm',
                energy: 2,
                date: today,
                timeOfDay: 'evening'
            });

            const moods = await MoodLog.find({ userId });
            expect(moods.length).toBe(2);
        });

        it('should retrieve moods sorted by timestamp (newest first)', async () => {
            const today = new Date().toISOString().split('T')[0];

            const mood1 = await MoodLog.create({
                userId,
                mood: 'happy',
                energy: 4,
                date: today
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const mood2 = await MoodLog.create({
                userId,
                mood: 'calm',
                energy: 2,
                date: today,
                timeOfDay: 'evening'
            });

            const moods = await MoodLog.find({ userId }).sort({ createdAt: -1 });
            expect(moods[0]._id.toString()).toBe(mood2._id.toString());
            expect(moods[1]._id.toString()).toBe(mood1._id.toString());
        });

        it('should return empty array for user with no moods', async () => {
            const moods = await MoodLog.find({ userId });
            expect(moods.length).toBe(0);
        });
    });

    describe('Mood Statistics', () => {
        it('should count total moods', async () => {
            const today = new Date().toISOString().split('T')[0];

            for (let i = 0; i < 5; i++) {
                await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy: Math.floor(Math.random() * 5) + 1,
                    date: today
                });
            }

            const count = await MoodLog.countDocuments({ userId });
            expect(count).toBe(5);
        });

        it('should calculate average energy level', async () => {
            const today = new Date().toISOString().split('T')[0];
            const energyLevels = [1, 2, 3, 4, 5];

            for (const energy of energyLevels) {
                await MoodLog.create({
                    userId,
                    mood: 'happy',
                    energy,
                    date: today
                });
            }

            const moods = await MoodLog.find({ userId });
            const avgEnergy = moods.reduce((sum, m) => sum + m.energy, 0) / moods.length;
            expect(avgEnergy).toBe(3);
        });

        it('should identify most common mood', async () => {
            const today = new Date().toISOString().split('T')[0];
            const moodCounts = { happy: 5, calm: 3, sad: 2 };

            for (const [mood, count] of Object.entries(moodCounts)) {
                for (let i = 0; i < count; i++) {
                    await MoodLog.create({
                        userId,
                        mood,
                        energy: 3,
                        date: today
                    });
                }
            }

            const moods = await MoodLog.find({ userId });
            const moodTally = {};
            moods.forEach(m => {
                moodTally[m.mood] = (moodTally[m.mood] || 0) + 1;
            });

            const mostCommon = Object.entries(moodTally).sort((a, b) => b[1] - a[1])[0];
            expect(mostCommon[0]).toBe('happy');
            expect(mostCommon[1]).toBe(5);
        });
    });

    describe('Mood Trends', () => {
        it('should track mood changes over time', async () => {
            const today = new Date().toISOString().split('T')[0];
            const moods = [
                { mood: 'sad', energy: 1 },
                { mood: 'calm', energy: 2 },
                { mood: 'happy', energy: 4 },
                { mood: 'energised', energy: 5 }
            ];

            for (const m of moods) {
                await MoodLog.create({
                    userId,
                    ...m,
                    date: today
                });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const recorded = await MoodLog.find({ userId }).sort({ createdAt: 1 });
            expect(recorded.length).toBe(4);
            expect(recorded[0].mood).toBe('sad');
            expect(recorded[3].mood).toBe('energised');
        });
    });

    describe('Mood Deletion', () => {
        it('should delete a mood entry', async () => {
            const today = new Date().toISOString().split('T')[0];

            const mood = await MoodLog.create({
                userId,
                mood: 'happy',
                energy: 4,
                date: today
            });

            await MoodLog.findByIdAndDelete(mood._id);
            const found = await MoodLog.findById(mood._id);
            expect(found).toBeNull();
        });

        it('should not affect other moods when deleting one', async () => {
            const today = new Date().toISOString().split('T')[0];

            const mood1 = await MoodLog.create({
                userId,
                mood: 'happy',
                energy: 4,
                date: today
            });
            const mood2 = await MoodLog.create({
                userId,
                mood: 'calm',
                energy: 2,
                date: today,
                timeOfDay: 'evening'
            });

            await MoodLog.findByIdAndDelete(mood1._id);
            const remaining = await MoodLog.find({ userId });
            expect(remaining.length).toBe(1);
            expect(remaining[0]._id.toString()).toBe(mood2._id.toString());
        });
    });
});
