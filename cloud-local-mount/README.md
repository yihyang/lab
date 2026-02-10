# CloudLocalMount

> Mount cloud storage buckets as local filesystems on macOS

CloudLocalMount is a native macOS desktop application that allows you to mount Google Cloud Storage (GCS) buckets as local drives using FUSE. Access your cloud storage directly through Finder without downloading files beforehand.

## Features

- **Transparent Access** - Browse GCS buckets in Finder like any local folder
- **Lazy Loading** - Files download only when opened, saving disk space
- **In-Place Editing** - Edit files directly in your favorite apps
- **Smart Caching** - Local cache with LRU eviction for frequently accessed files
- **Menu Bar Integration** - Quick access to mount controls from the menu bar

## Architecture

CloudLocalMount uses a daemon + GUI pattern:

```
CloudLocalMountApp (GUI)
    ├── SwiftUI interface
    ├── XPC client for daemon communication
    └── Menu bar status item

CloudLocalMountDaemon (XPC Service)
    ├── FUSE filesystem implementation
    ├── GCS API client
    ├── Cache manager
    └── Mount manager
```

## Requirements

- macOS 13.0+
- Xcode 15.0+
- [macFUSE](https://osxfuse.github.io/) 4.x
- Apple Developer Account (for XPC service signing)

## Installation

### 1. Install Dependencies

```bash
# Install macFUSE
brew install --cask macfuse

# Verify installation
brew info macfuse
```

### 2. Build the Project

```bash
cd cloud-local-mount

# Resolve Swift Package Manager dependencies
swift package resolve

# Open in Xcode
open CloudLocalMount.xcodeproj
```

### 3. Configure Xcode

1. Select the **CloudLocalMountApp** scheme
2. Enable "Developer" signing for development:
   - Select project in navigator
   - Choose "Signing & Capabilities"
   - Set "Team" to your Apple Developer account (or use automatic signing)
3. Build and run (⌘R)

## Project Structure

```
cloud-local-mount/
├── CloudLocalMountApp/          # GUI application
│   ├── App/                      # App entry point and delegate
│   ├── Views/                    # SwiftUI views
│   ├── ViewModels/               # View models
│   └── XPC/                      # Daemon client
│
├── CloudLocalMountDaemon/        # Background daemon
│   ├── Daemon/                   # Main entry and XPC listener
│   ├── FUSE/                     # FUSE filesystem implementation
│   ├── GCS/                      # Google Cloud Storage client
│   └── XPC/                      # XPC service implementation
│
├── Shared/                       # Shared code
│   ├── Models/                   # Data models and protocols
│   └── Utilities/                # Logging and helpers
│
└── Package.swift                 # Swift Package Manager
```

## Usage

### Adding an Account

1. Click the CloudLocalMount icon in the menu bar
2. Select "Open Settings..."
3. Click the "+" button to add a new account
4. Choose Google Cloud Storage
5. Provide credentials (service account JSON or OAuth token)

### Mounting a Bucket

1. Open Settings and navigate to the "Buckets" tab
2. Select an account
3. Click the "Mount" button next to a bucket
4. The bucket appears at `~/CloudLocalMount/<bucket-name>`
5. Access files through Finder or terminal

### Unmounting

Click the "Unmount" button next to any mounted bucket, or use the menu bar item.

## Development Status

This is an **incremental MVP** in active development. Current implementation status:

| Component | Status | Notes |
|-----------|--------|-------|
| SwiftUI GUI | ✅ | Basic views and view models |
| XPC Communication | ✅ | Full protocol implementation |
| GCS Client Stub | ✅ | Structure with TODO placeholders |
| FUSE Filesystem Stub | ✅ | Basic operations defined |
| Cache Manager | ✅ | LRU caching with size limits |
| Mount Manager | ✅ | Mount tracking and state management |
| GCS API Integration | ⏳ | Needs Google Cloud SDK integration |
| Actual FUSE Mounting | ⏳ | Needs macFUSE integration |
| Authentication UI | ⏳ | Needs credential input UI |

## Configuration

### Cache Settings

Cache location: `~/Library/Caches/com.cloudlocalmount/`

Default cache size: 10 GB

Configure in Settings > Cache

### Mount Point

Default: `~/CloudLocalMount/`

Buckets are mounted at: `~/CloudLocalMount/<bucket-name>/`

## Troubleshooting

### Daemon won't start

```bash
# Check XPC service logs
log stream --predicate 'subsystem == "com.cloudlocalmount.daemon"' --level debug

# Verify service is loaded
launchctl list | grep cloudlocalmount
```

### Mount point issues

```bash
# Check what's mounted
mount | grep CloudLocalMount

# Force unmount (if stuck)
umount ~/CloudLocalMount/bucket-name
```

### Permission issues

```bash
# Fix cache directory permissions
chmod -R 755 ~/Library/Caches/com.cloudlocalmount/

# Fix mount point permissions
chmod -R 755 ~/CloudLocalMount/
```

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

- [ ] Complete GCS API integration
- [ ] Implement actual FUSE mounting with macFUSE
- [ ] Add OAuth authentication flow
- [ ] Support for AWS S3
- [ ] CLI/headless mode
- [ ] Selective sync (download specific folders)
- [ ] File change detection and auto-upload

## Acknowledgments

- [macFUSE](https://osxfuse.github.io/) - FUSE for macOS
- [Google Cloud Storage Swift SDK](https://github.com/googleapis/google-cloud-storage-swift)
- [SwiftLog](https://github.com/apple/swift-log) - Logging framework
