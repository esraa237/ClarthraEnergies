import { IsOptional } from 'class-validator';

export class PageDto {
    title: string;
    pageObj: Record<string, any>;
    @IsOptional()
    images?: Record<string, string>; // optional
}
