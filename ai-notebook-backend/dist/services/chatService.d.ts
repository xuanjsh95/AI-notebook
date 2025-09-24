export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ChatModel {
    id: string;
    name: string;
    provider: string;
    description?: string;
}
export interface SendMessageRequest {
    message: string;
    model: string;
    history: ChatMessage[];
    userId?: string;
}
export interface SendMessageResponse {
    content: string;
    model: string;
}
export declare class ChatService {
    private apiConfigStorage;
    constructor();
    sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
    getAvailableModels(userId: string): Promise<ChatModel[]>;
    private getModelDisplayName;
    private getProviderFromUrl;
    private getModelDescription;
    private getDefaultModels;
    testApiConfig(config: {
        baseUrl: string;
        apiKey: string;
        model: string;
    }): Promise<boolean>;
}
//# sourceMappingURL=chatService.d.ts.map