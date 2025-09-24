export declare class NotebookStorage {
    private static data;
    private static loaded;
    static load(): any[];
    static save(): void;
    static getAll(): any[];
    static add(notebook: any): any;
    static update(id: string, updates: any): any;
    static delete(id: string): any;
}
export declare class NoteStorage {
    private static data;
    private static loaded;
    static load(): any[];
    static save(): void;
    static getAll(): any[];
    static add(note: any): any;
    static update(id: string, updates: any): any;
    static delete(id: string): any;
}
//# sourceMappingURL=storage.d.ts.map