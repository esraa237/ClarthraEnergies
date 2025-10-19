// entities/position.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Position extends Document {
    @ApiProperty({ example: 'Frontend Developer' })
    @Prop({ required: true })
    name: string;

    @ApiProperty({ example: 'Cairo, Egypt' })
    @Prop({ required: true })
    location: string;

    @ApiProperty({ example: 'Full-time', enum:  ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract','Temporary']  })
    @Prop({
        required: true,
        enum:  ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract','Temporary'] ,
    })
    type: string;

    @ApiProperty({ example: 'Competitive salary and flexible hours', required: false })
    @Prop()
    whatWeOffer?: string;

    @ApiProperty({ example: 'Expanding our web development team', required: false })
    @Prop()
    whyWeAreLooking?: string;

    @ApiProperty({ example: 'Develop responsive web pages', required: false })
    @Prop()
    responsibilities?: string;

    @ApiProperty({ example: 'HTML, CSS, React', required: false })
    @Prop()
    skills?: string;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

// Virtual field to populate related applications
PositionSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'positionId',
});