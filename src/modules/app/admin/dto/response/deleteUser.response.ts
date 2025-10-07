export class DeleteUserResponseDTO {
    message: string;
    data: {
        userId: string;
        userType: string;
        phoneFreed: boolean;
        emailFreed: boolean;
        deletedPhone?: string;
    };
}
