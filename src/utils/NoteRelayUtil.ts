// utils/NoteRelayUtil.ts

import { TFile, Notice, Plugin } from "obsidian";
import { HttpUtil } from "./HttpUtil";
import { v4 as uuidv4 } from "uuid";
import * as yaml from "js-yaml";
import { minimatch } from "minimatch";
import { NoteRelaySettings } from "../types";

/**
 * Utility class for handling note relay operations:
 * frontmatter parsing/assembly, file exclusion, server sync, etc.
 */
export class NoteRelayUtil {
	private plugin: Plugin & { settings: NoteRelaySettings };

	constructor(plugin: Plugin & { settings: NoteRelaySettings }) {
		this.plugin = plugin;
	}

	/**
	 * Main entry point: Uploads a note to the remote server and, if configured,
	 * updates the note's identifier in the frontmatter based on the server response.
	 * @param file The note file to relay.
	 */
	async relayNote(file: TFile): Promise<void> {
		const settings = this.plugin.settings;
		const {
			server_url,
			sync_endpoint,
			auth_type,
			basic_username,
			basic_password,
			auth_token,
			note_id_field_name,
			overwrite_file_id_from_response
		} = settings;

		if (!server_url || !sync_endpoint) {
			new Notice("Server information is not configured.");
			return;
		}

		// 1. Get or create the note's unique identifier from frontmatter
		const fileId = await this.getOrCreateFileId(file, note_id_field_name ?? "note_id");
		const url = HttpUtil.buildRelayUrl(server_url, sync_endpoint, fileId);

		// 2. Prepare headers and form data for upload
		const headers = HttpUtil.getHeaders({
			auth_type: auth_type ?? "none",
			basic_username,
			basic_password,
			auth_token
		});

		// 3. Read file as binary and create form data
		const fileArrayBuffer = await this.plugin.app.vault.readBinary(file);
		const formData = HttpUtil.createFileFormData(fileArrayBuffer, file.name);

		// 4. Upload file and handle server response
		const response = await HttpUtil.uploadFile(url, formData, headers);

		if (overwrite_file_id_from_response) {
			await this.tryUpdateFileIdFromResponse(response, file, note_id_field_name ?? "note_id");
		}
	}

	/**
	 * Retrieves the note's unique identifier from frontmatter,
	 * or generates and sets a new one if not present.
	 * @param file The note file.
	 * @param fieldName The frontmatter field name for the identifier.
	 * @returns The identifier string.
	 */
	async getOrCreateFileId(file: TFile, fieldName: string): Promise<string> {
		const frontmatter = this.getFrontmatter(file);
		if (frontmatter?.[fieldName]) {
			return String(frontmatter[fieldName]);
		} else {
			const fileId = uuidv4();
			await this.setFileId(file, fieldName, fileId);
			return fileId;
		}
	}

	/**
	 * Retrieves the frontmatter object from a note file.
	 * @param file The note file.
	 * @returns The frontmatter as a key-value object, or undefined if not present.
	 */
	getFrontmatter(file: TFile): Record<string, any> | undefined {
		return this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
	}

	/**
	 * Sets or updates a field in the note's frontmatter.
	 * If the field already exists, it will not be overwritten.
	 * @param file The note file.
	 * @param fieldName The frontmatter field name.
	 * @param value The value to set.
	 */
	async setFileId(file: TFile, fieldName: string, value: string): Promise<void> {
		const content = await this.plugin.app.vault.read(file);
		const { fields, body } = NoteRelayUtil.parseFrontmatter(content);

		// Do not overwrite if the field already exists
		if (fields[fieldName]) return;

		fields[fieldName] = value;
		const newContent = NoteRelayUtil.buildFrontmatter(fields, body);
		await this.plugin.app.vault.modify(file, newContent);
	}

	/**
	 * Checks if a file should be excluded from sync based on glob patterns.
	 * @param file The note file.
	 * @returns True if the file matches any exclusion pattern, false otherwise.
	 */
	isFileExcludedByGlob(file: TFile): boolean {
		const patterns = this.plugin.settings.exclude_patterns ?? [];
		return patterns.some((pattern: string) => minimatch(file.path, pattern));
	}

	/**
	 * If the server response contains a new file identifier and the setting is enabled,
	 * updates the note's frontmatter with the new identifier.
	 * @param response The server response.
	 * @param file The note file.
	 * @param file_id_field_name The frontmatter field name for the identifier.
	 */
	private async tryUpdateFileIdFromResponse(
		response: Response,
		file: TFile,
		file_id_field_name: string
	): Promise<void> {
		if (
			!response.ok ||
			!response.headers.get("content-type")?.includes("application/json")
		) return;

		// Get the current file ID from frontmatter
		const frontmatter = this.getFrontmatter(file);
		const currentFileId = frontmatter?.[file_id_field_name] ?? "";

		try {
			const json = await response.json();
			const newFileId = String(json[file_id_field_name] ?? "").trim();
			if (newFileId && newFileId !== currentFileId) {
				await this.setFileId(file, file_id_field_name, newFileId);
				new Notice(`Note identifier (UUID) has been updated from server response: ${newFileId}`);
			}
		} catch (e) {
			console.error("Failed to update file ID from server response:", e);
			new Notice(
				`Failed to update note identifier (UUID) from server response. Reason: ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}
	}

	/**
	 * Parses the frontmatter and body from a note's content.
	 * @param content The full note content as a string.
	 * @returns An object with 'fields' (frontmatter key-value pairs) and 'body' (the rest of the note).
	 */
	static parseFrontmatter(content: string): { fields: Record<string, any>; body: string } {
		const fmRegex = /^---\n([\s\S]*?)\n---\n?/;
		const match = content.match(fmRegex);

		let fields: Record<string, any> = {};
		let body = content;

		if (match) {
			const loaded = yaml.load(match[1]);
			fields = (typeof loaded === "object" && loaded !== null) ? (loaded as Record<string, any>) : {};
			body = content.slice(match[0].length);
		}
		return { fields, body };
	}

	/**
	 * Builds a note's content string from frontmatter fields and body.
	 * @param fields The frontmatter key-value pairs.
	 * @param body The note body.
	 * @returns The full note content with frontmatter and body.
	 */
	static buildFrontmatter(fields: Record<string, any>, body: string): string {
		const newFrontMatter = `---\n${yaml.dump(fields)}---\n`;
		return newFrontMatter + body;
	}
}
