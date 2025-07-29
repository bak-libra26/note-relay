// handler/NoteRelayCommandHandler.ts

import { Notice, TFile } from "obsidian";
import NoteRelayPlugin from "../main";
import { NoteRelayUtil } from "../utils/NoteRelayUtil";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_NOTE_ID_FIELD_NAME } from "../types";

/**
 * Handles command registration and file event listeners for NoteRelay.
 */
export class NoteRelayCommandHandler {
	private plugin: NoteRelayPlugin;
	private noteRelayUtil: NoteRelayUtil;

	constructor(plugin: NoteRelayPlugin) {
		this.plugin = plugin;
		this.noteRelayUtil = new NoteRelayUtil(plugin);
	}

	/**
	 * Registers plugin commands for syncing and UUID generation.
	 */
	registerCommands(): void {
		this.plugin.addCommand({
			id: "sync-file-uuid",
			name: "Sync file identifier (UUID) with server and display",
			callback: this.relayActiveNote.bind(this),
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "U" }],
		});

		this.plugin.addCommand({
			id: "generate-file-uuid",
			name: "Generate UUID for current file",
			callback: this.generateUuid.bind(this),
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "C" }],
		});
	}

	/**
	 * Registers a listener for file modification events to trigger auto-sync.
	 */
	registerFileChangeListener(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", async (file) => {
				const autoSync = this.plugin.settings.auto_sync_on_modify;
				if (!autoSync) return;
				if (!(file instanceof TFile)) return;
				try {
					if (this.noteRelayUtil.isFileExcludedByGlob(file)) return;
					if (file.extension !== "md") return;
					await this.noteRelayUtil.relayNote(file);
					new Notice(`"${file.name}" was modified and synced to the server.`);
				} catch (e: any) {
					new Notice(e.message ?? "An error occurred during automatic file sync.");
				}
			})
		);
	}

	/**
	 * Returns the currently active note file, or throws if not available or excluded.
	 */
	private getActiveNote(): TFile {
		const file = this.plugin.app.workspace.getActiveFile();
		if (!file) throw new Error("No file is currently open.");
		if (this.noteRelayUtil.isFileExcludedByGlob(file)) {
			throw new Error("This file is excluded from sync by pattern.");
		}
		return file;
	}

	/**
	 * Syncs the active note with the server and notifies the user.
	 */
	private async relayActiveNote(): Promise<void> {
		try {
			const note = this.getActiveNote();
			await this.noteRelayUtil.relayNote(note);
			new Notice("File identifier (UUID) successfully synced with the server.");
		} catch (e: any) {
			new Notice(e.message ?? "An error occurred while syncing the file identifier.");
		}
	}

	/**
	 * Generates and sets a UUID for the active note if not already present.
	 */
	private async generateUuid(): Promise<void> {
		try {
			const file = this.getActiveNote();
			const fieldName = this.plugin.settings.note_id_field_name ?? DEFAULT_NOTE_ID_FIELD_NAME;
			const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
			if (frontmatter?.[fieldName]) {
				return;
			}
			const fileId = uuidv4();
			await this.noteRelayUtil.setFileId(file, fieldName, fileId);
			new Notice("File identifier (UUID) was successfully generated and added.");
		} catch (e: any) {
			new Notice("Failed to generate and add file identifier (UUID).");
		}
	}
}
