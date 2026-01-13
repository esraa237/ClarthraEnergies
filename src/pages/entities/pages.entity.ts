import { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  title: string;
  data: {
    pageObj: Record<string, any>;
    images?: Record<string, string>;
  };
}

export const PageSchema = new Schema<IPage>({
  title: { type: String, required: true, unique: true },
  data: {
    pageObj: { type: Object, required: true },
    images: { type: Object, default: {} },
  },
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongooseI18nLocalize = require('mongoose-i18n-localize');
PageSchema.plugin(mongooseI18nLocalize, {
  locales: ['en', 'fr', 'zh'],
});
