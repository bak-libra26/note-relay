// types.ts

export interface AutoPushSyncSettings {
	serverUrl: string;
	syncEndpoint: string;
	syncPassword: string;
	enableFileId: boolean;
	fileIdFieldName: string;
	contentFieldName: string;
	excludePatterns?: string[]; // 예외 패턴 (glob, 경로, 파일명 등)
	autoSyncOnModify: boolean,
	includeFrontMatterInContent: boolean,
	sendFileContent: boolean;
}

export const DEFAULT_SETTINGS: AutoPushSyncSettings = {
	serverUrl: '',
	syncEndpoint: '',
	syncPassword: '',
	enableFileId: false,
	fileIdFieldName: 'fileId',
	contentFieldName: 'content',
	excludePatterns: [],
	autoSyncOnModify: false,
	includeFrontMatterInContent: false,
	sendFileContent: true,
};
