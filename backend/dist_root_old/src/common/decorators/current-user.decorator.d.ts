import { UserRole } from '@prisma/client';
export interface CurrentUserPayload {
    sub: string;
    email: string;
    role: UserRole;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
