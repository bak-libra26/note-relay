# NoteRelay Obsidian Community Plugin

**NoteRelay** is an **UNOFFICIAL**, community-developed plugin for Obsidian that syncs your notes with a remote server. Configure your server and authentication settings, and your notes will automatically upload when modified.

> **Disclaimer:**  
> This is **NOT** the official sync service provided by Obsidian, nor is it affiliated with or endorsed by the Obsidian team. Use at your own risk and always keep backups.

**Features:**

- Automatic upload of notes to your server
- Customizable server URL and authentication
- Supports Basic Auth and Token-based authentication in the request header
- Optional manual sync commands
- Server-driven UUID updates: Optionally update your note's unique identifier based on the server response after upload
- Exclude specific files or folders from upload

**Getting Started:**

1. Download or clone this repository.
2. Place the plugin folder inside your Obsidian vault’s `.obsidian/plugins/` directory.
3. Enable the plugin in Obsidian’s settings.
4. Open the NoteRelay settings tab to configure your server URL, authentication, and sync options.

**Security:**  
Credentials are stored locally. Only notes you select are synced. Always use trusted servers.  
**Always back up your vault before using this or any third-party plugin.**

**Contributing:**  
Contributions, bug reports, and feature requests are welcome!

**License:**  
MIT License

**Support:**  
Contributions and feedback are welcome!
