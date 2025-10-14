import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Contact extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  organization: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  areaOfInterest: string;

  @Prop({ required: true })
  representation: string;

  @Prop({ required: true })
  message: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
