import { Schema, Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  data: {
    serviceObj: Record<string, any>;
    images?: Record<string, string>;
  };
}

export const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true, unique: true },
  data: {
    serviceObj: { type: Object, required: true },
    images: { type: Object, default: {} },
  },
});
