import { Schema, Document } from 'mongoose';

export interface IConfiguration extends Document {
  data: {
    configObj: Record<string, any>; 
    images?: Record<string, string>; 
    videos?: Record<string, string>; 
  };
}

export const ConfigurationSchema = new Schema<IConfiguration>({
  data: {
    configObj: { type: Object, required: true },
    images: { type: Object, default: {} },
    videos: { type: Object, default: {} },
  },
});
