//
//  BucketListView.swift
//  CloudLocalMountApp
//
//  View for selecting and managing cloud storage buckets.
//

import SwiftUI

struct BucketListView: View {
    let account: CloudAccount
    @State private var buckets: [BucketInfo] = []
    @State private var isLoading = false
    @State private var mountStates: [String: MountState] = [:]

    private let daemonClient = DaemonClient.shared

    var body: some View {
        VStack(spacing: 20) {
            // Header with account name
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Buckets")
                        .font(.title2)
                        .fontWeight(.semibold)
                    Text(account.name)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal)

            // Buckets list
            if isLoading {
                loadingView
            } else if buckets.isEmpty {
                emptyStateView
            } else {
                bucketsListView
            }
        }
        .padding()
        .frame(minWidth: 600, minHeight: 500)
        .task {
            await loadBuckets()
        }
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading buckets...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "archivebox")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No Buckets Found")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("This account has no accessible buckets")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var bucketsListView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(buckets) { bucket in
                    BucketCard(
                        bucket: bucket,
                        mountState: mountStates[bucket.name] ?? .unmounted,
                        onToggleMount: {
                            Task {
                                await toggleMount(for: bucket)
                            }
                        }
                    )
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Actions

    private func loadBuckets() async {
        isLoading = true

        do {
            // Try to load from daemon
            buckets = try await daemonClient.listBuckets(for: account)
            Logger.shared.info("Loaded \(buckets.count) buckets from daemon", category: .ui)
        } catch {
            Logger.shared.error("Failed to load buckets from daemon, using mock data: \(error.localizedDescription)", category: .ui)
            // Fallback to mock data for development
            try? await Task.sleep(nanoseconds: 500_000_000)
            buckets = mockBuckets
        }

        isLoading = false
    }

    private func toggleMount(for bucket: BucketInfo) async {
        let isMounted = mountStates[bucket.name] == .mounted

        if isMounted {
            await unmountBucket(bucket)
        } else {
            await mountBucket(bucket)
        }
    }

    private func mountBucket(_ bucket: BucketInfo) async {
        Logger.shared.info("Mounting bucket: \(bucket.name)", category: .ui)

        // Update state to mounting
        mountStates[bucket.name] = .mounting

        let mountPath = defaultMountPath(for: bucket.name)

        do {
            try await daemonClient.mountBucket(
                bucketName: bucket.name,
                for: account,
                at: mountPath
            )
            mountStates[bucket.name] = .mounted
            Logger.shared.info("Bucket mounted successfully: \(bucket.name)", category: .ui)
        } catch {
            mountStates[bucket.name] = .error(error.localizedDescription)
            Logger.shared.error("Failed to mount bucket: \(error.localizedDescription)", category: .ui)
        }
    }

    private func unmountBucket(_ bucket: BucketInfo) async {
        Logger.shared.info("Unmounting bucket: \(bucket.name)", category: .ui)

        // Update state to unmounting
        mountStates[bucket.name] = .unmounting

        let mountPath = defaultMountPath(for: bucket.name)

        do {
            try await daemonClient.unmountBucket(at: mountPath)
            mountStates[bucket.name] = .unmounted
            Logger.shared.info("Bucket unmounted successfully: \(bucket.name)", category: .ui)
        } catch {
            mountStates[bucket.name] = .error(error.localizedDescription)
            Logger.shared.error("Failed to unmount bucket: \(error.localizedDescription)", category: .ui)
        }
    }

    private func defaultMountPath(for bucketName: String) -> String {
        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        let mountlyDir = homeDir.appendingPathComponent("CloudLocalMount")
        let bucketDir = mountlyDir.appendingPathComponent(bucketName)
        return bucketDir.path
    }

    // MARK: - Mock Data

    private var mockBuckets: [BucketInfo] {
        [
            BucketInfo(
                id: "bucket-1",
                name: "my-app-data",
                location: "US",
                storageClass: "STANDARD",
                createdAt: Date().addingTimeInterval(-30 * 24 * 3600),
                sizeBytes: 1024 * 1024 * 1024 * 5 // 5 GB
            ),
            BucketInfo(
                id: "bucket-2",
                name: "production-logs",
                location: "US-CENTRAL1",
                storageClass: "NEARLINE",
                createdAt: Date().addingTimeInterval(-90 * 24 * 3600),
                sizeBytes: 1024 * 1024 * 1024 * 1024 * 2 // 2 TB
            ),
            BucketInfo(
                id: "bucket-3",
                name: "user-uploads",
                location: "EU",
                storageClass: "STANDARD",
                createdAt: Date().addingTimeInterval(-15 * 24 * 3600),
                sizeBytes: 1024 * 1024 * 512 // 512 MB
            ),
        ]
    }
}

// MARK: - Bucket Card

struct BucketCard: View {
    let bucket: BucketInfo
    let mountState: MountState
    let onToggleMount: () -> Void

    private var isMounted: Bool {
        if case .mounted = mountState {
            return true
        }
        return false
    }

    private var isBusy: Bool {
        switch mountState {
        case .mounting, .unmounting:
            return true
        default:
            return false
        }
    }

    var body: some View {
        HStack(spacing: 16) {
            // Icon
            Image(systemName: "archivebox.fill")
                .font(.system(size: 24))
                .foregroundColor(statusColor)
                .frame(width: 40, height: 40)

            // Bucket info
            VStack(alignment: .leading, spacing: 4) {
                Text(bucket.name)
                    .font(.headline)
                HStack(spacing: 8) {
                    Text(bucket.location)
                    Text("•")
                    Text(bucket.storageClass)
                    if let size = bucket.sizeBytes {
                        Text("•")
                        Text(ByteCountFormatter.string(fromByteCount: size, countStyle: .file))
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)

                // Status message
                if let statusMessage = statusMessage {
                    Text(statusMessage)
                        .font(.caption2)
                        .foregroundColor(statusColor)
                }
            }

            Spacer()

            // Mount toggle
            Button(action: onToggleMount) {
                if isBusy {
                    ProgressView()
                        .scaleEffect(0.7)
                } else {
                    Label(isMounted ? "Unmount" : "Mount", systemImage: isMounted ? "eject" : "mount")
                        .labelStyle(.iconOnly)
                }
            }
            .buttonStyle(.bordered)
            .disabled(isBusy)
            .help(isMounted ? "Unmount this bucket" : "Mount this bucket")

            // Status indicator
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }

    private var statusColor: Color {
        switch mountState {
        case .mounted:
            return .green
        case .mounting, .unmounting:
            return .orange
        case .error:
            return .red
        default:
            return .gray.opacity(0.5)
        }
    }

    private var statusMessage: String? {
        switch mountState {
        case .mounting:
            return "Mounting..."
        case .unmounting:
            return "Unmounting..."
        case .error(let message):
            return message
        default:
            return nil
        }
    }
}

#Preview {
    BucketListView(
        account: CloudAccount(
            provider: .googleCloud,
            name: "My GCS Account",
            credentials: .gcsOAuth(.init(accessToken: "mock")),
            mountedBuckets: []
        )
    )
}
