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

    @Prop({ required: true, lowercase: true, trim: true })
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

// One application per email per position.
// Partial index: only applies when positionId is an actual ObjectId, so Open
// Applications (positionId missing OR null) are never constrained.
ApplicationSchema.index(
    { email: 1, positionId: 1 },
    {
        unique: true,
        name: 'unique_email_per_position',
        partialFilterExpression: { positionId: { $type: 'objectId' } },
    },
);