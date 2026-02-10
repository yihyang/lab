//
//  DaemonService.swift
//  CloudLocalMountDaemon
//
//  XPC service implementation for daemon operations.
//

import Foundation
import OSLog

let logger = Logger(subsystem: "com.cloudlocalmount.daemon", category: "Service")

/// Implementation of the daemon protocol
class DaemonService: NSObject, DaemonProtocol {
    // MARK: - Singleton

    static let shared = DaemonService()

    // MARK: - Properties

    private var mountedBuckets: [String: MountedBucketInfo] = [:]
    private let cacheManager: CacheManager
    private let mountManager: MountManager
    private let gcsClient: GCSClient

    private var appDelegate: AppDelegateProtocol? {
        // Access to the app delegate for callbacks
        return nil // Will be set from connection
    }

    // MARK: - Init

    private override init() {
        self.cacheManager = CacheManager()
        self.mountManager = MountManager()
        self.gcsClient = GCSClient()

        super.init()

        logger.info("DaemonService initialized")
    }

    // MARK: - DaemonProtocol

    /// Ping the daemon to check if it's alive
    func ping(reply: @escaping (Bool) -> Void) {
        logger.debug("Ping received")
        reply(true)
    }

    /// List all buckets for the given account
    func listBuckets(
        for account: CloudAccount,
        reply: @escaping ([BucketInfo]?, Error?) -> Void
    ) {
        logger.info("Listing buckets for account: \(account.name)")

        Task {
            do {
                let buckets = try await gcsClient.listBuckets(for: account)
                logger.info("Found \(buckets.count) buckets")
                reply(buckets, nil)
            } catch {
                logger.error("Failed to list buckets: \(error.localizedDescription)")
                reply(nil, error)
            }
        }
    }

    /// Mount a bucket as a local filesystem
    func mountBucket(
        bucketName: String,
        for account: CloudAccount,
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    ) {
        logger.info("Mounting bucket: \(bucketName) at \(mountPath)")

        // Check if already mounted
        if mountedBuckets[bucketName] != nil {
            logger.warning("Bucket \(bucketName) is already mounted")
            reply(false, MountError.alreadyMounted)
            return
        }

        // Create mount point directory
        let mountURL = URL(fileURLWithPath: mountPath)
        do {
            try FileManager.default.createDirectory(
                at: mountURL,
                withIntermediateDirectories: true
            )
        } catch {
            logger.error("Failed to create mount directory: \(error.localizedDescription)")
            reply(false, error)
            return
        }

        // TODO: Actually mount the FUSE filesystem
        // For now, just track the mount
        let mountInfo = MountedBucketInfo(
            bucketName: bucketName,
            mountPath: mountPath,
            accountID: account.id,
            state: .mounted
        )
        mountedBuckets[bucketName] = mountInfo

        logger.info("Bucket \(bucketName) mounted successfully at \(mountPath)")
        notifyMountStateChange(bucketName: bucketName, state: .mounted)
        reply(true, nil)
    }

    /// Unmount a previously mounted bucket
    func unmountBucket(
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    ) {
        logger.info("Unmounting at path: \(mountPath)")

        // Find the bucket mounted at this path
        guard let (bucketName, mountInfo) = mountedBuckets.first(where: { $0.value.mountPath == mountPath }) else {
            logger.warning("No bucket found mounted at \(mountPath)")
            reply(false, MountError.notMounted)
            return
        }

        // TODO: Actually unmount the FUSE filesystem
        mountedBuckets.removeValue(forKey: bucketName)

        logger.info("Bucket \(bucketName) unmounted successfully")
        notifyMountStateChange(bucketName: bucketName, state: .unmounted)
        reply(true, nil)
    }

    /// Get current mount state for a bucket
    func getMountState(
        for bucketName: String,
        reply: @escaping (MountState) -> Void
    ) {
        if let mountInfo = mountedBuckets[bucketName] {
            reply(mountInfo.state)
        } else {
            reply(.unmounted)
        }
    }

    /// Get cache statistics
    func getCacheStats(reply: @escaping (Int64, Int) -> Void) {
        let (size, count) = cacheManager.getStats()
        logger.debug("Cache stats: \(size) bytes, \(count) files")
        reply(size, count)
    }

    /// Clear the cache
    func clearCache(reply: @escaping (Bool) -> Void) {
        logger.info("Clearing cache")

        do {
            try cacheManager.clearCache()
            logger.info("Cache cleared successfully")
            reply(true)
        } catch {
            logger.error("Failed to clear cache: \(error.localizedDescription)")
            reply(false)
        }
    }

    // MARK: - Private Methods

    private func notifyMountStateChange(bucketName: String, state: MountState) {
        // Notify the app via delegate callback
        // TODO: Implement actual callback
        logger.info("Mount state changed: \(bucketName) -> \(state.displayName)")
    }
}

// MARK: - Mount Error

enum MountError: Error, LocalizedError {
    case alreadyMounted
    case notMounted
    case mountFailed(String)
    case unmountFailed(String)

    var errorDescription: String? {
        switch self {
        case .alreadyMounted:
            return "Bucket is already mounted"
        case .notMounted:
            return "Bucket is not mounted"
        case .mountFailed(let reason):
            return "Mount failed: \(reason)"
        case .unmountFailed(let reason):
            return "Unmount failed: \(reason)"
        }
    }
}

// MARK: - Mounted Bucket Info

struct MountedBucketInfo {
    let bucketName: String
    let mountPath: String
    let accountID: UUID
    var state: MountState
}
