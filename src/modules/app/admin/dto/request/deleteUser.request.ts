import { IsOptional, IsString } from 'class-validator';

export class DeleteUserRequestDTO {
    @IsString()
    @IsOptional()
    reason?: string;
}
