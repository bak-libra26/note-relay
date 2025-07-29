# NoteRelay Obsidian Plugin

NoteRelay is a powerful Obsidian plugin that automatically synchronizes your notes with a remote server. With flexible configuration and robust metadata handling, NoteRelay helps you keep your notes up-to-date across devices and integrate with custom backends or workflows.

---

## Features

- **Automatic Sync:**  
  Automatically uploads notes to a remote server whenever you save or modify them in Obsidian.

- **Customizable Server Settings:**  
  Easily configure your server URL, sync endpoint, and authentication options directly from the plugin settings.

- **Frontmatter Metadata Support:**  
  Store unique file identifiers (UUID), file names, and other metadata in frontmatter fields for reliable syncing and conflict resolution.

- **Flexible Authentication:**  
  Supports multiple authentication methods, including Basic Auth and Token-based authentication.

- **Sync Exclusions:**  
  Exclude specific files or folders from syncing using glob patterns.

- **Manual and Bulk Sync:**  
  Sync individual notes on demand, or scan your vault to add missing UUIDs and ensure all eligible notes are synchronized.

- **Server-driven ID Updates:**  
  Optionally update your note's unique identifier in the frontmatter based on the server response after an upload.

---

## Getting Started

1. **Install NoteRelay**
	- Download or clone this repository.
	- Place the plugin folder inside your Obsidian vault’s `.obsidian/plugins/` directory.
	- Enable the plugin in Obsidian’s settings.

2. **Configure Settings**
	- Open the NoteRelay settings tab.
	- Enter your server URL and sync endpoint.
	- Select your preferred authentication method and provide credentials if needed.
	- Optionally adjust frontmatter field names and sync exclusions as desired.

3. **Usage**
	- Notes will automatically sync to your server when modified (if enabled).
	- Use the command palette to manually sync the current note or generate missing UUIDs.
	- Monitor sync status and errors via Obsidian notifications.

---

## Advanced Usage

- **Custom Metadata:**  
  Add any custom metadata to your note's frontmatter. The plugin can be configured to use a custom field name for the note's unique identifier.
- **Server-driven UUID Updates:**  
  If enabled, NoteRelay will update the note's UUID in the frontmatter if the server returns a new identifier after upload.
- **Database Integration:**  
  Use the UUID as a primary key in your backend database for robust note management and deduplication.

---

## Security

- Credentials are stored securely in your local Obsidian configuration.
- Only notes matching your criteria are sent to the server.
- Always use trusted servers and keep your authentication information safe.

---

## Contributing

Contributions, bug reports, and feature requests are welcome!
- Open an issue to report bugs or suggest improvements.
- Submit a pull request for new features or fixes.

---

## License

This project is licensed under the MIT License.

---

## Support

If you find NoteRelay helpful, please consider starring the repository or sharing feedback!
