//
//  DaemonClient.swift
//  CloudLocalMountApp
//
//  XPC client for communicating with the daemon.
//

import Foundation
import OSLog
import Combine

let logger = Logger(subsystem: "com.cloudlocalmount.app", category: "XPC")

/// XPC client for communicating with the CloudLocalMount daemon
class DaemonClient: NSObject, ObservableObject {
    // MARK: - Published Properties

    @Published var isConnected = false
    @Published var connectionError: String?

    // MARK: - Properties

    private let daemonServiceName = "com.cloudlocalmount.daemon"
    private var xpcConnection: NSXPCConnection?
    private var daemonProxy: DaemonProtocol?
    private var remoteObjectProxy: AppDelegateProtocol?

    // MARK: - Singleton

    static let shared = DaemonClient()

    // MARK: - Init

    private override init() {
        super.init()
        connectToDaemon()
    }

    deinit {
        disconnect()
    }

    // MARK: - Connection Management

    /// Establish connection to the daemon
    func connectToDaemon() {
        logger.info("Connecting to daemon: \(daemonServiceName)")

        let connection = NSXPCConnection(serviceName: daemonServiceName)
        connection.remoteObjectInterface = NSXPCInterface(with: DaemonProtocol.self)

        // Set up export for callbacks from daemon
        connection.exportedObject = self
        connection.exportedInterface = NSXPCInterface(with: AppDelegateProtocol.self)

        connection.interruptionHandler = { [weak self] in
            logger.warning("XPC connection interrupted")
            self?.handleConnectionError(.connectionInterrupted)
        }

        connection.invalidationHandler = { [weak self] in
            logger.warning("XPC connection invalidated")
            self?.handleConnectionError(.connectionInvalid)
        }

        connection.resume()

        self.xpcConnection = connection

        // Get proxy to daemon
        if let proxy = connection.remoteObjectProxy as? DaemonProtocol {
            self.daemonProxy = proxy

            // Test connection with ping
            pingDaemon()
        } else {
            logger.error("Failed to create daemon proxy")
            handleConnectionError(.invalidResponse)
        }
    }

    /// Disconnect from the daemon
    func disconnect() {
        logger.info("Disconnecting from daemon")

        xpcConnection?.invalidate()
        xpcConnection = nil
        daemonProxy = nil
        remoteObjectProxy = nil
        isConnected = false
    }

    /// Reconnect to the daemon
    func reconnect() {
        logger.info("Reconnecting to daemon")
        disconnect()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.connectToDaemon()
        }
    }

    // MARK: - Connection Error Handling

    private func handleConnectionError(_ error: XPCError) {
        DispatchQueue.main.async {
            self.isConnected = false
            self.connectionError = error.localizedDescription
            logger.error("Connection error: \(error.localizedDescription)")

            // Attempt to reconnect after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                if self.xpcConnection == nil {
                    self.reconnect()
                }
            }
        }
    }

    // MARK: - Daemon Operations

    /// Ping the daemon to check connectivity
    func pingDaemon() {
        logger.debug("Pinging daemon")

        daemonProxy?.ping { [weak self] success in
            DispatchQueue.main.async {
                self?.isConnected = success
                if success {
                    self?.connectionError = nil
                    logger.info("Daemon ping successful")
                } else {
                    logger.error("Daemon ping failed")
                }
            }
        }
    }

    /// List all buckets for the given account
    func listBuckets(for account: CloudAccount) async throws -> [BucketInfo] {
        logger.info("Requesting bucket list for account: \(account.name)")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.listBuckets(for: account) { buckets, error in
                if let error = error {
                    logger.error("Failed to list buckets: \(error.localizedDescription)")
                    continuation.resume(throwing: error)
                } else if let buckets = buckets {
                    logger.info("Received \(buckets.count) buckets")
                    continuation.resume(returning: buckets)
                } else {
                    continuation.resume(throwing: XPCError.invalidResponse)
                }
            }
        }
    }

    /// Mount a bucket
    func mountBucket(
        bucketName: String,
        for account: CloudAccount,
        at mountPath: String
    ) async throws {
        logger.info("Requesting mount for bucket: \(bucketName)")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.mountBucket(bucketName: bucketName, for: account, at: mountPath) { success, error in
                if let error = error {
                    logger.error("Failed to mount bucket: \(error.localizedDescription)")
                    continuation.resume(throwing: error)
                } else if success {
                    logger.info("Bucket mounted successfully")
                    continuation.resume()
                } else {
                    continuation.resume(throwing: XPCError.invalidResponse)
                }
            }
        }
    }

    /// Unmount a bucket
    func unmountBucket(at mountPath: String) async throws {
        logger.info("Requesting unmount at: \(mountPath)")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.unmountBucket(at: mountPath) { success, error in
                if let error = error {
                    logger.error("Failed to unmount: \(error.localizedDescription)")
                    continuation.resume(throwing: error)
                } else if success {
                    logger.info("Unmount successful")
                    continuation.resume()
                } else {
                    continuation.resume(throwing: XPCError.invalidResponse)
                }
            }
        }
    }

    /// Get mount state for a bucket
    func getMountState(for bucketName: String) async throws -> MountState {
        logger.debug("Getting mount state for: \(bucketName)")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.getMountState(for: bucketName) { state in
                continuation.resume(returning: state)
            }
        }
    }

    /// Get cache statistics
    func getCacheStats() async throws -> (sizeBytes: Int64, fileCount: Int) {
        logger.debug("Getting cache stats")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.getCacheStats { size, count in
                continuation.resume(returning: (size, count))
            }
        }
    }

    /// Clear the cache
    func clearCache() async throws {
        logger.info("Requesting cache clear")

        guard let proxy = daemonProxy else {
            throw XPCError.connectionInvalid
        }

        return try await withCheckedThrowingContinuation { continuation in
            proxy.clearCache { success in
                if success {
                    logger.info("Cache cleared")
                    continuation.resume()
                } else {
                    continuation.resume(throwing: XPCError.invalidResponse)
                }
            }
        }
    }
}

// MARK: - AppDelegateProtocol (Callbacks from Daemon)

extension DaemonClient: AppDelegateProtocol {
    /// Notify the app that a bucket mount state has changed
    func mountStateDidChange(bucketName: String, state: MountState) {
        logger.info("Mount state changed: \(bucketName) -> \(state.displayName)")

        DispatchQueue.main.async {
            // Post notification for other parts of the app to observe
            NotificationCenter.default.post(
                name: .mountStateDidChange,
                object: nil,
                userInfo: ["bucketName": bucketName, "state": state]
            )
        }
    }

    /// Notify the app of an error that occurred in the daemon
    func daemonDidEncounterError(message: String, category: String) {
        logger.error("Daemon error [\(category)]: \(message)")

        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .daemonError,
                object: nil,
                userInfo: ["message": message, "category": category]
            )
        }
    }

    /// Notify the app of cache size change
    func cacheSizeDidChange(sizeBytes: Int64) {
        logger.debug("Cache size changed: \(sizeBytes) bytes")

        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .cacheSizeDidChange,
                object: nil,
                userInfo: ["sizeBytes": sizeBytes]
            )
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let mountStateDidChange = Notification.Name("mountStateDidChange")
    static let daemonError = Notification.Name("daemonError")
    static let cacheSizeDidChange = Notification.Name("cacheSizeDidChange")
}
