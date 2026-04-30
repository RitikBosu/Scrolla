import Post from '../models/Post.js';
import User from '../models/User.js';

describe('Post Creation & Feed - Model Tests', () => {
    let userId, user2Id;

    beforeEach(async () => {
        const user = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        const user2 = await User.create({
            username: 'testuser2',
            email: 'test2@example.com',
            password: 'password123'
        });
        userId = user._id;
        user2Id = user2._id;
    });

    describe('Post Creation', () => {
        it('should create a post with text', async () => {
            const startTime = Date.now();
            const post = await Post.create({
                author: userId,
                content: 'My first post!',
                mood: 'calm'
            });
            const duration = Date.now() - startTime;

            expect(post._id).toBeDefined();
            expect(post.content).toBe('My first post!');
            expect(post.author.toString()).toBe(userId.toString());
            expect(post.mood).toBe('calm');
            expect(duration).toBeLessThan(500);
        });

        it('should create a post with images', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Beautiful sunset',
                images: [{
                    url: 'https://example.com/image.jpg',
                    filter: 'none'
                }],
                mood: 'calm'
            });

            expect(post.images[0].url).toBe('https://example.com/image.jpg');
        });

        it('should create post with all mood types', async () => {
            const moods = ['all', 'calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss'];

            for (const mood of moods) {
                const post = await Post.create({
                    author: userId,
                    content: `Post with ${mood} mood`,
                    mood
                });
                expect(post.mood).toBe(mood);
            }
        });

        it('should capture metadata on creation', async () => {
            const beforeTime = Date.now();
            const post = await Post.create({
                author: userId,
                content: 'Test post',
                mood: 'calm'
            });
            const afterTime = Date.now();

            expect(post.createdAt).toBeDefined();
            expect(post.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
            expect(post.createdAt.getTime()).toBeLessThanOrEqual(afterTime);
        });

        it('should require content', async () => {
            try {
                await Post.create({
                    author: userId,
                    mood: 'calm'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });

        it('should require author', async () => {
            try {
                await Post.create({
                    content: 'Test post',
                    mood: 'calm'
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).toBe('ValidationError');
            }
        });
    });

    describe('Feed Generation', () => {
        it('should retrieve feed in <500ms', async () => {
            for (let i = 0; i < 20; i++) {
                await Post.create({
                    author: userId,
                    content: `Post ${i}`,
                    mood: 'calm'
                });
            }

            const startTime = Date.now();
            const feed = await Post.find().sort({ createdAt: -1 });
            const duration = Date.now() - startTime;

            expect(feed.length).toBe(20);
            expect(duration).toBeLessThan(500);
        });

        it('should filter feed by mood', async () => {
            await Post.create({
                author: userId,
                content: 'Calm post',
                mood: 'calm'
            });
            await Post.create({
                author: user2Id,
                content: 'Energetic post',
                mood: 'energetic'
            });

            const calmPosts = await Post.find({ mood: 'calm' });
            expect(calmPosts.length).toBe(1);
            expect(calmPosts[0].mood).toBe('calm');
        });

        it('should return posts sorted by timestamp (newest first)', async () => {
            const post1 = await Post.create({
                author: userId,
                content: 'First post',
                mood: 'calm'
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const post2 = await Post.create({
                author: userId,
                content: 'Second post',
                mood: 'calm'
            });

            const feed = await Post.find().sort({ createdAt: -1 });
            expect(feed[0]._id.toString()).toBe(post2._id.toString());
            expect(feed[1]._id.toString()).toBe(post1._id.toString());
        });

        it('should handle empty feed', async () => {
            const feed = await Post.find();
            expect(feed.length).toBe(0);
        });

        it('should retrieve posts with author info', async () => {
            await Post.create({
                author: userId,
                content: 'Test post',
                mood: 'calm'
            });

            const posts = await Post.find().populate('author');
            expect(posts[0].author.username).toBe('testuser');
            expect(posts[0].author.email).toBe('test@example.com');
        });
    });

    describe('Post Engagement - Like Count', () => {
        it('should track like count', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Test post',
                mood: 'calm',
                likeCount: 0
            });

            post.likeCount = 5;
            await post.save();

            const updated = await Post.findById(post._id);
            expect(updated.likeCount).toBe(5);
        });

        it('should increment like count', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Test post',
                mood: 'calm',
                likeCount: 0
            });

            post.likeCount += 1;
            await post.save();

            const updated = await Post.findById(post._id);
            expect(updated.likeCount).toBe(1);
        });
    });

    describe('Post Updates', () => {
        it('should update post content', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Original content',
                mood: 'calm'
            });

            post.content = 'Updated content';
            await post.save();

            const updated = await Post.findById(post._id);
            expect(updated.content).toBe('Updated content');
        });

        it('should not change createdAt on update', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Original',
                mood: 'calm'
            });

            const originalCreatedAt = post.createdAt;
            await new Promise(resolve => setTimeout(resolve, 100));

            post.content = 'Updated';
            await post.save();

            const updated = await Post.findById(post._id);
            expect(updated.createdAt).toEqual(originalCreatedAt);
        });
    });

    describe('Post Deletion', () => {
        it('should delete a post', async () => {
            const post = await Post.create({
                author: userId,
                content: 'Test post',
                mood: 'calm'
            });

            await Post.findByIdAndDelete(post._id);
            const found = await Post.findById(post._id);
            expect(found).toBeNull();
        });

        it('should not affect other posts', async () => {
            const post1 = await Post.create({
                author: userId,
                content: 'Post 1',
                mood: 'calm'
            });
            const post2 = await Post.create({
                author: userId,
                content: 'Post 2',
                mood: 'calm'
            });

            await Post.findByIdAndDelete(post1._id);
            const remaining = await Post.find();
            expect(remaining.length).toBe(1);
            expect(remaining[0]._id.toString()).toBe(post2._id.toString());
        });
    });

    describe('Performance Tests', () => {
        it('should handle querying 100+ posts efficiently', async () => {
            for (let i = 0; i < 100; i++) {
                await Post.create({
                    author: i % 2 === 0 ? userId : user2Id,
                    content: `Post ${i}`,
                    mood: ['calm', 'energetic', 'motivated', 'discuss'][i % 4]
                });
            }

            const startTime = Date.now();
            const posts = await Post.find().sort({ createdAt: -1 });
            const duration = Date.now() - startTime;

            expect(posts.length).toBe(100);
            expect(duration).toBeLessThan(1000);
        });

        it('should handle concurrent post creation', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    Post.create({
                        author: userId,
                        content: `Concurrent post ${i}`,
                        mood: 'calm'
                    })
                );
            }

            const startTime = Date.now();
            const results = await Promise.all(promises);
            const duration = Date.now() - startTime;

            expect(results.length).toBe(10);
            expect(duration).toBeLessThan(2000);
        });
    });
});
