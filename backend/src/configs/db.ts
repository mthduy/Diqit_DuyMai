import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Build a parsed configuration object for DB usage across the app
export const dbConfig = {
  connectionString: (process.env.MONGODB_CONNECTIONSTRING || '').trim(),
  // optional mongoose options you might want to centralize
  options: {
    // example options; consumer can spread/override as needed
    useNewUrlParser: true as const,
    useUnifiedTopology: true as const,
  },
  // debug flag to enable mongoose debug logging
  debug: (process.env.MONGO_DEBUG || 'false').toLowerCase() === 'true',
};

export const connectDB = async () => {
  if (!dbConfig.connectionString) {
    console.error('MONGODB_CONNECTIONSTRING is not set in environment');
    process.exit(1);
  }

  // optional: enable mongoose debug if requested
  mongoose.set('debug', dbConfig.debug);

  try {
    await mongoose.connect(dbConfig.connectionString, dbConfig.options as any);
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection error: ', error);
    process.exit(1);
  }
};

export default dbConfig;
