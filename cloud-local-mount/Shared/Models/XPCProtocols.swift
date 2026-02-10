//
//  XPCProtocols.swift
//  CloudLocalMount
//
//  XPC protocol definitions for communication between GUI app and daemon.
//

import Foundation

// MARK: - Daemon Protocol (App -> Daemon)

/// Protocol for communication from the GUI app to the daemon
@objc public protocol DaemonProtocol: NSObjectProtocol {
    /// Ping the daemon to check if it's alive
    /// - Parameters:
    ///   - account: The cloud account to use
    ///   - reply: Completion handler that returns true if daemon is responsive
    func ping(reply: @escaping (Bool) -> Void)

    /// List all buckets for the given account
    /// - Parameters:
    ///   - account: The cloud account to list buckets for
    ///   - reply: Completion handler that returns array of bucket info or error
    func listBuckets(
        for account: CloudAccount,
        reply: @escaping ([BucketInfo]?, Error?) -> Void
    )

    /// Mount a bucket as a local filesystem
    /// - Parameters:
    ///   - bucketName: Name of the bucket to mount
    ///   - account: The cloud account containing the bucket
    ///   - mountPath: Local path where the bucket should be mounted
    ///   - reply: Completion handler that returns success status or error
    func mountBucket(
        bucketName: String,
        for account: CloudAccount,
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    )

    /// Unmount a previously mounted bucket
    /// - Parameters:
    ///   - mountPath: Path where the bucket is mounted
    ///   - reply: Completion handler that returns success status or error
    func unmountBucket(
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    )

    /// Get current mount state for a bucket
    /// - Parameters:
    ///   - bucketName: Name of the bucket
    ///   - reply: Completion handler that returns the current mount state
    func getMountState(
        for bucketName: String,
        reply: @escaping (MountState) -> Void
    )

    /// Get cache statistics
    /// - Parameters:
    ///   - reply: Completion handler that returns cache size in bytes and file count
    func getCacheStats(
        reply: @escaping (Int64, Int) -> Void
    )

    /// Clear the cache
    /// - Parameters:
    ///   - reply: Completion handler that returns success status
    func clearCache(reply: @escaping (Bool) -> Void)
}

// MARK: - App Delegate Protocol (Daemon -> App)

/// Protocol for communication from the daemon back to the GUI app
@objc public protocol AppDelegateProtocol: NSObjectProtocol {
    /// Notify the app that a bucket mount state has changed
    /// - Parameters:
    ///   - bucketName: Name of the bucket
    ///   - state: New mount state
    func mountStateDidChange(bucketName: String, state: MountState)

    /// Notify the app of an error that occurred in the daemon
    /// - Parameters:
    ///   - message: Error message
    ///   - category: Error category
    func daemonDidEncounterError(message: String, category: String)

    /// Notify the app of cache size change
    /// - Parameters:
    ///   - sizeBytes: Current cache size in bytes
    func cacheSizeDidChange(sizeBytes: Int64)
}

// MARK: - XPC Error Types

/// Errors that can occur during XPC communication
public enum XPCError: Error, LocalizedError {
    case connectionInvalid
    case connectionInterrupted
    case daemonNotRunning
    case timeout
    case invalidResponse
    case unknown(Error)

    public var errorDescription: String? {
        switch self {
        case .connectionInvalid:
            return "Connection to daemon is invalid"
        case .connectionInterrupted:
            return "Connection to daemon was interrupted"
        case .daemonNotRunning:
            return "Daemon is not running"
        case .timeout:
            return "Request timed out"
        case .invalidResponse:
            return "Invalid response from daemon"
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}
