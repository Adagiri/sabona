import { UserStatus, LEVEL, UserType } from '@prisma/client';

export class EditUserResponseDTO {
    data: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        status: UserStatus;
        level: LEVEL | null;
        type: UserType;
        updatedAt: Date;
    };
    message: string;
    changesApplied?: string[]; // List of fields that were changed
}

export class ChangePhoneResponseDTO {
    data: {
        userId: string;
        oldPhone: string | null;
        newPhone: string;
        changedAt: Date;
    };
    message: string;
}

export class ChangeEmailResponseDTO {
    data: {
        userId: string;
        oldEmail: string | null;
        newEmail: string;
        changedAt: Date;
    };
    message: string;
}
