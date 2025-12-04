import { IsString, IsOptional, IsEnum, IsNotEmpty, MinLength, MaxLength, IsEmail } from 'class-validator';
import { UserStatus, LEVEL } from '@prisma/client';

export class EditUserRequestDTO {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string; // Validation will be done in service layer for Saudi format

    @IsOptional()
    @IsEnum(UserStatus, { message: 'Invalid status' })
    status?: UserStatus;

    @IsOptional()
    @IsEnum(LEVEL, { message: 'Invalid level' })
    level?: LEVEL;
}

export class ChangePhoneRequestDTO {
    @IsNotEmpty({ message: 'New phone number is required' })
    @IsString()
    newPhone: string;

    @IsNotEmpty({ message: 'Reason for phone change is required' })
    @IsString()
    @MinLength(10, { message: 'Reason must be at least 10 characters long' })
    @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
    reason: string;
}

export class ChangeEmailRequestDTO {
    @IsNotEmpty({ message: 'New email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    newEmail: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
    reason?: string;
}
