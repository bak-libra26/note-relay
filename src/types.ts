// types.ts

/**
 * The default field name used for note unique identifiers in frontmatter.
 */
export const DEFAULT_NOTE_ID_FIELD_NAME = "file_id";

/**
 * Supported authentication types for server sync.
 */
export const AUTH_TYPE = {
	NONE: "none",
	BASIC: "basic",
	TOKEN: "token"
} as const;

export type AuthType = typeof AUTH_TYPE[keyof typeof AUTH_TYPE];

/**
 * Settings interface for NoteRelay plugin.
 */
export interface NoteRelaySettings {
	server_url: string;
	sync_endpoint: string;
	note_id_field_name: string;
	exclude_patterns: string[]; // Glob patterns for files/folders to exclude from sync
	auto_sync_on_modify: boolean;

	// Authentication fields
	auth_type: AuthType;
	basic_username?: string;
	basic_password?: string;
	auth_token?: string;

	// If true, update note ID in frontmatter from server response after upload
	overwrite_file_id_from_response: boolean;
}

/**
 * Default settings for NoteRelay plugin.
 */
export const DEFAULT_SETTINGS: NoteRelaySettings = {
	server_url: "",
	sync_endpoint: "",
	note_id_field_name: DEFAULT_NOTE_ID_FIELD_NAME,
	exclude_patterns: [],
	auto_sync_on_modify: false,

	auth_type: AUTH_TYPE.NONE,
	basic_username: "",
	basic_password: "",
	auth_token: "",
	overwrite_file_id_from_response: false
};
