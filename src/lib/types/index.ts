export type Banner = {
	id: string;
	type: string;
	title?: string;
	content: string;
	url?: string;
	dismissible?: boolean;
	timestamp: number;
};

export enum TTS_RESPONSE_SPLIT {
	PUNCTUATION = 'punctuation',
	PARAGRAPHS = 'paragraphs',
	NONE = 'none'
}

// For Message type
export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: number;
    groupId?: string;
    attachments?: FileMetadata[];
}

// For file handling
export interface FileMetadata {
    id: string;
    name: string;
    type: 'image' | 'document' | 'audio';
    url: string;
    status?: 'uploading' | 'uploaded';
}

// For group management
export interface Group {
    id: string;
    name: string;
    members: User[];
    createdAt: number;
}

// For user management
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}