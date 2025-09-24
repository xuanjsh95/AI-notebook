export interface ApiConfig {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ApiConfigStorage {
    private dataDir;
    private configsFile;
    constructor();
    private ensureDataDir;
    private readConfigs;
    private writeConfigs;
    getConfigsByUserId(userId: string): Promise<ApiConfig[]>;
    getConfigById(id: string, userId?: string): Promise<ApiConfig | null>;
    createConfig(configData: Omit<ApiConfig, 'id'>): Promise<ApiConfig>;
    updateConfig(id: string, updates: Partial<Omit<ApiConfig, 'id' | 'userId' | 'createdAt'>>, userId: string): Promise<ApiConfig | null>;
    deleteConfig(id: string, userId: string): Promise<boolean>;
    isNameExists(name: string, userId: string, excludeId?: string): Promise<boolean>;
    getConfigStats(userId: string): Promise<{
        totalConfigs: number;
        totalModels: number;
        providers: string[];
    }>;
    cleanupConfigs(): Promise<number>;
}
//# sourceMappingURL=apiConfigStorage.d.ts.map