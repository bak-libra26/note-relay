// settings/SettingTab.ts

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import NoteRelayPlugin from "../main";
import { AUTH_TYPE, AuthType } from "../constants";

/**
 * Plugin settings tab for NoteRelay.
 * Provides UI for configuring server sync, authentication, exclusions, and note metadata.
 */
export class NoteRelaySettingTab extends PluginSettingTab {
	plugin: NoteRelayPlugin;

	constructor(app: App, plugin: NoteRelayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Server Sync Settings ---
		containerEl.createEl("h3", { text: "Server Sync Settings" });

		const serverSection = containerEl.createDiv({ cls: "setting-indent" });

		new Setting(serverSection)
			.setName("Server URL")
			.setDesc("e.g., http://localhost:8080")
			.addText(text =>
				text
					.setPlaceholder("http://localhost:8080")
					.setValue(this.plugin.settings.server_url)
					.onChange(async value => {
						this.plugin.settings.server_url = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(serverSection)
			.setName("Sync Endpoint")
			.setDesc("e.g., /v1/post/sync")
			.addText(text =>
				text
					.setPlaceholder("/v1/post/sync")
					.setValue(this.plugin.settings.sync_endpoint)
					.onChange(async value => {
						this.plugin.settings.sync_endpoint = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Authentication Settings ---
		new Setting(serverSection)
			.setName("Authentication Type")
			.setDesc("Select the authentication method for your server.")
			.addDropdown(dropdown => {
				dropdown
					.addOption(AUTH_TYPE.NONE, "None")
					.addOption(AUTH_TYPE.BASIC, "Basic Auth")
					.addOption(AUTH_TYPE.TOKEN, "Token")
					.setValue(this.plugin.settings.auth_type || AUTH_TYPE.NONE)
					.onChange(async (value: AuthType) => {
						this.plugin.settings.auth_type = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh UI on auth type change
					});
			});

		// Show authentication fields based on selected type
		const authSection = serverSection.createDiv({ cls: "setting-indent" });

		if (this.plugin.settings.auth_type === AUTH_TYPE.BASIC) {
			new Setting(authSection)
				.setName("Basic Username")
				.setDesc("Enter the username for Basic authentication.")
				.addText(text =>
					text
						.setPlaceholder("Username")
						.setValue(this.plugin.settings.basic_username || "")
						.onChange(async value => {
							this.plugin.settings.basic_username = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(authSection)
				.setName("Basic Password")
				.setDesc("Enter the password for Basic authentication.")
				.addText(text =>
					text
						.setPlaceholder("Password")
						.setValue(this.plugin.settings.basic_password || "")
						.onChange(async value => {
							this.plugin.settings.basic_password = value;
							await this.plugin.saveSettings();
						})
				);
		} else if (this.plugin.settings.auth_type === AUTH_TYPE.TOKEN) {
			new Setting(authSection)
				.setName("Auth Token")
				.setDesc("Enter the token for server authentication.")
				.addText(text =>
					text
						.setPlaceholder("Token")
						.setValue(this.plugin.settings.auth_token || "")
						.onChange(async value => {
							this.plugin.settings.auth_token = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// --- Auto Sync Settings ---
		containerEl.createEl("h3", { text: "Auto Sync" });

		const autoSyncSection = containerEl.createDiv({ cls: "setting-indent" });
		new Setting(autoSyncSection)
			.setName("Auto Sync on Note Change")
			.setDesc("Automatically upload notes to the server when modified.")
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.auto_sync_on_modify)
					.onChange(async value => {
						this.plugin.settings.auto_sync_on_modify = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// --- Exclusion Patterns ---
		const excludeSection = containerEl.createDiv({ cls: "setting-indent" });
		new Setting(excludeSection)
			.setName("Exclude Notes/Folders")
			.setDesc("Comma-separated patterns. e.g., templates/**, *.bak, assets/*.png")
			.addTextArea(text =>
				text
					.setPlaceholder("e.g., templates/**, *.bak, assets/*.png")
					.setValue((this.plugin.settings.exclude_patterns ?? []).join(", "))
					.onChange(async value => {
						this.plugin.settings.exclude_patterns = value
							.split(",")
							.map(s => s.trim())
							.filter(Boolean);
						await this.plugin.saveSettings();
					})
			);

		// --- Note Metadata Settings ---
		containerEl.createEl("h3", { text: "Note Metadata" });

		const idSection = containerEl.createDiv({ cls: "setting-indent" });
		idSection.createEl("h3", { text: "Identifier Settings" });

		const indentDiv = idSection.createDiv({ cls: "setting-indent" });

		new Setting(indentDiv)
			.setName("Note Identifier Field Name")
			.setDesc("This field stores the UUID used as the unique identifier for the note. (e.g., note_id, uuid)")
			.addText(text => {
				text
					.setPlaceholder("e.g., note_id")
					.setValue(this.plugin.settings.note_id_field_name)
					.onChange(async value => {
						const trimmed = value.trim().toLowerCase();
						if (!trimmed) {
							new Notice("Field name cannot be empty.");
							text.setValue(this.plugin.settings.note_id_field_name);
							return;
						}
						this.plugin.settings.note_id_field_name = trimmed;
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton(btn => {
				btn.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						const defaultValue = "note_id";
						this.plugin.settings.note_id_field_name = defaultValue;
						await this.plugin.saveSettings();
						const input = indentDiv.querySelector("input");
						if (input) input.value = defaultValue;
						new Notice("Reset to default value.");
					});
			});

		new Setting(containerEl)
			.setName("Auto-update Note Identifier from Server Response")
			.setDesc("If the server response contains a note identifier (e.g., UUID) after upload, automatically update the note's frontmatter identifier field with that value.")
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.overwrite_file_id_from_response ?? false)
					.onChange(async value => {
						this.plugin.settings.overwrite_file_id_from_response = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
