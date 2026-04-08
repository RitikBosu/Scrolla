import { motion } from 'framer-motion';

const SkeletonPostCard = () => {
  const shimmerVariants = {
    loading: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <motion.div
      className="post-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <motion.div
            className="w-12 h-12 rounded-full"
            variants={shimmerVariants}
            animate="loading"
            style={{
              backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          
          {/* Name and time skeleton */}
          <div className="flex-1">
            <motion.div
              className="h-5 rounded mb-2 w-32"
              variants={shimmerVariants}
              animate="loading"
              style={{
                backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
                backgroundSize: '200% 100%',
              }}
            />
            <motion.div
              className="h-4 rounded w-24"
              variants={shimmerVariants}
              animate="loading"
              style={{
                backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Mood badge skeleton */}
      <motion.div
        className="h-6 rounded w-20 mb-3"
        variants={shimmerVariants}
        animate="loading"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Content skeleton */}
      <div className="space-y-2 mb-4">
        <motion.div
          className="h-4 rounded w-full"
          variants={shimmerVariants}
          animate="loading"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
        <motion.div
          className="h-4 rounded w-5/6"
          variants={shimmerVariants}
          animate="loading"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Image skeleton */}
      <motion.div
        className="h-64 rounded-lg mb-4"
        variants={shimmerVariants}
        animate="loading"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Action buttons skeleton */}
      <div className="flex gap-6 pt-4 border-t border-gray-700">
        <motion.div
          className="h-5 rounded w-12"
          variants={shimmerVariants}
          animate="loading"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
        <motion.div
          className="h-5 rounded w-12"
          variants={shimmerVariants}
          animate="loading"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
        <motion.div
          className="h-5 rounded w-12"
          variants={shimmerVariants}
          animate="loading"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--feed-border) 0%, var(--feed-surface) 50%, var(--feed-border) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </motion.div>
  );
};

export default SkeletonPostCard;
