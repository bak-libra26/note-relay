// main.ts

import { Plugin } from "obsidian";
import { NoteRelaySettingTab } from "./setting/SettingTab";
import { DEFAULT_SETTINGS, NoteRelaySettings } from "./types";
import { NoteRelayCommandHandler } from "./handler/NoteRelayCommandHandler";

/**
 * Main plugin class for NoteRelay.
 * Handles settings, command registration, and plugin lifecycle.
 */
export default class NoteRelayPlugin extends Plugin {
	settings: NoteRelaySettings;
	commandHandler: NoteRelayCommandHandler;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.commandHandler = new NoteRelayCommandHandler(this);
		this.commandHandler.registerCommands();
		this.commandHandler.registerFileChangeListener();

		this.addSettingTab(new NoteRelaySettingTab(this.app, this));
	}

	/**
	 * Loads plugin settings from disk, merging with defaults.
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Persists plugin settings to disk.
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
