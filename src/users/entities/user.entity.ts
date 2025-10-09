import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/role.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  userName?: string;

  @Prop()
  fullName?: string;

  @Prop()
  password?: string;

  @Prop({ enum: Role, default: Role.ADMIN })
  role: Role;

  @Prop({ default: false })
  isProfileCompleted: boolean;

  @Prop()
  profileCompletionToken?: string;

  @Prop()
  profileCompletionTokenExpiresAt?: Date;

  @Prop()
  newEmailPending?: string;

  @Prop()
  emailUpdateToken?: string;

  @Prop()
  emailUpdateTokenExpiresAt?: Date;

  @Prop({ type: String })
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordTokenExpiresAt?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
