// types.ts

export interface AutoPushSyncSettings {
	server_url: string;
	sync_endpoint: string;
	sync_password: string;
	enable_file_id: boolean;
	file_id_field_name: string;
	file_name_field_name: string;
	file_content_field_name: string;
	exclude_patterns?: string[]; // 예외 패턴 (glob, 경로, 파일명 등)
	auto_sync_on_modify: boolean;
	include_front_matter_in_content: boolean;
	send_file_content: boolean;

	// 인증 관련 필드 추가
	auth_type?: "none" | "basic" | "token";
	basic_username?: string;
	basic_password?: string;
	auth_token?: string;
}

export const DEFAULT_SETTINGS: AutoPushSyncSettings = {
	server_url: '',
	sync_endpoint: '',
	sync_password: '',
	enable_file_id: false,
	file_id_field_name: 'file_id',
	file_name_field_name: 'file_name',
	file_content_field_name: 'content',
	exclude_patterns: [],
	auto_sync_on_modify: false,
	include_front_matter_in_content: false,
	send_file_content: true,

	// 인증 관련 기본값 추가
	auth_type: "none",
	basic_username: '',
	basic_password: '',
	auth_token: '',
};
