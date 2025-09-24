import { User } from '../types';
export declare class UserStorage {
    private dataDir;
    private usersFile;
    constructor();
    private ensureDataDir;
    private readUsers;
    private writeUsers;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
    update(id: string, userData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null>;
    delete(id: string): Promise<boolean>;
    getAll(): Promise<User[]>;
}
export declare const userStorage: UserStorage;
//# sourceMappingURL=userStorage.d.ts.map