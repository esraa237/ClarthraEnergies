import { Schema, Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  data: {
    serviceObj: Record<string, any>;
    images?: Record<string, string>;
  };
}

export const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true, unique: true, i18n: true },
  data: {
    serviceObj: { type: Object, required: true },
    images: { type: Object, default: {} },
  },
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongooseI18nLocalize = require('mongoose-i18n-localize');
ServiceSchema.plugin(mongooseI18nLocalize, {
  locales: ['en', 'fr', 'zh'],
});
