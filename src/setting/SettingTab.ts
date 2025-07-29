// settings/SettingTab.ts

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import NoteRelayPlugin from "../main";
import { AUTH_TYPE, AuthType } from "../constants";

export class SettingTab extends PluginSettingTab {
	plugin: NoteRelayPlugin;

	constructor(app: App, plugin: NoteRelayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Server sync")
			.setHeading();

		new Setting(containerEl)
			.setName("Server URL")
			.setDesc("For example: http://localhost:8080")
			.addText(text =>
				text
					.setPlaceholder("http://localhost:8080")
					.setValue(this.plugin.settings.server_url)
					.onChange(async value => {
						this.plugin.settings.server_url = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sync endpoint")
			.setDesc("For example: /v1/post/sync")
			.addText(text =>
				text
					.setPlaceholder("/v1/post/sync")
					.setValue(this.plugin.settings.sync_endpoint)
					.onChange(async value => {
						this.plugin.settings.sync_endpoint = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Authentication type")
			.setDesc("Select the authentication method for your server.")
			.addDropdown(dropdown => {
				dropdown
					.addOption(AUTH_TYPE.NONE, "None")
					.addOption(AUTH_TYPE.BASIC, "Basic auth")
					.addOption(AUTH_TYPE.TOKEN, "Token")
					.setValue(this.plugin.settings.auth_type || AUTH_TYPE.NONE)
					.onChange(async (value: AuthType) => {
						this.plugin.settings.auth_type = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.auth_type === AUTH_TYPE.BASIC) {
			new Setting(containerEl)
				.setName("Basic username")
				.setDesc("Enter the username for basic authentication.")
				.addText(text =>
					text
						.setPlaceholder("Username")
						.setValue(this.plugin.settings.basic_username || "")
						.onChange(async value => {
							this.plugin.settings.basic_username = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(containerEl)
				.setName("Basic password")
				.setDesc("Enter the password for basic authentication.")
				.addText(text => {
					text
						.setPlaceholder("Password")
						.setValue(this.plugin.settings.basic_password || "")
						.onChange(async value => {
							this.plugin.settings.basic_password = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.type = "password";
				});
		} else if (this.plugin.settings.auth_type === AUTH_TYPE.TOKEN) {
			new Setting(containerEl)
				.setName("Auth token")
				.setDesc("Enter the token for server authentication.")
				.addText(text => {
					text
						.setPlaceholder("Token")
						.setValue(this.plugin.settings.auth_token || "")
						.onChange(async value => {
							this.plugin.settings.auth_token = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.type = "password";
				});
		}

		new Setting(containerEl)
			.setName("Auto sync")
			.setHeading();

		new Setting(containerEl)
			.setName("Auto sync on note change")
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

		new Setting(containerEl)
			.setName("Exclusions")
			.setHeading();

		new Setting(containerEl)
			.setName("Exclude notes or folders")
			.setDesc("Comma-separated patterns. For example: templates/**, *.bak, assets/*.png")
			.addTextArea(text =>
				text
					.setPlaceholder("templates/**, *.bak, assets/*.png")
					.setValue((this.plugin.settings.exclude_patterns ?? []).join(", "))
					.onChange(async value => {
						this.plugin.settings.exclude_patterns = value
							.split(",")
							.map(s => s.trim())
							.filter(Boolean);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Note metadata")
			.setHeading();

		new Setting(containerEl)
			.setName("Identifier")
			.setHeading();

		new Setting(containerEl)
			.setName("Note identifier field name")
			.setDesc("This field stores the UUID used as the unique identifier for the note. For example: note_id, uuid")
			.addText(text => {
				text
					.setPlaceholder("note_id")
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
						const input = (btn.extraSettingsEl.parentElement?.querySelector("input")) as HTMLInputElement | null;
						if (input) input.value = defaultValue;
						new Notice("Reset to default value.");
					});
			});

		new Setting(containerEl)
			.setName("Auto-update note identifier from server response")
			.setDesc("If the server response contains a note identifier (for example, UUID) after upload, automatically update the note's frontmatter identifier field with that value.")
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
