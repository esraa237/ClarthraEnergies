import { IsOptional, IsString } from 'class-validator';

export class ConfigurationDto {
    configObj: Record<string, any>;
    @IsOptional()
    images?: Record<string, string>; // optional
    @IsOptional()
    videos?: Record<string, string>; // optional
}
