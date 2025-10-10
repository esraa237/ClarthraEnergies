// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// @Schema({ timestamps: true })
// export class Configuration extends Document {
//   @Prop({ type: Object, default: {} })
//   data: Record<string, any>;
// }

// export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
import { Schema, Document } from 'mongoose';

export interface IConfiguration extends Document {
  data: {
    configObj: Record<string, any>; // بيانات الفرونت
    images?: Record<string, string>; // لينكات الصور
    videos?: Record<string, string>; // لينكات الفيديو
  };
}

export const ConfigurationSchema = new Schema<IConfiguration>({
  data: {
    configObj: { type: Object, required: true },
    images: { type: Object, default: {} },
    videos: { type: Object, default: {} },
  },
});
