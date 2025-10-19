import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Position } from 'src/positions/entities/position.entity';

@Schema({ timestamps: true })
export class Application extends Document {
    @Prop({ required: true })
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    phone: string;

    @Prop()
    availableFrom?: string;

    @Prop()
    location?: string;

    @Prop()
    expectedSalary?: number;

    @Prop({ type: Object })
    files: Record<string, string | null>;

    @Prop({ default: 'pending' })
    status: 'pending' | 'approved' | 'rejected' | 'contacted';

    @Prop({ type: Types.ObjectId, ref: 'Position', required: false })
    positionId?: Position | Types.ObjectId;
}


export const ApplicationSchema = SchemaFactory.createForClass(Application);
