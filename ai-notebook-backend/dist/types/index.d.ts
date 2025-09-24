export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
}
export interface AuthResponse {
    token: string;
    refresh_token: string;
    user: Omit<User, 'password'>;
}
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=index.d.ts.map