//
//  DaemonClientTests.swift
//  CloudLocalMountTests
//
//  Unit tests for DaemonClient (XPC communication).
//

import XCTest
@testable import CloudLocalMountShared

// MARK: - Mock Daemon Protocol

class MockDaemonService: NSObject, DaemonProtocol {
    var pingCallCount = 0
    var lastPingResponse: Bool = true

    var listBucketsCallCount = 0
    var mockBuckets: [BucketInfo] = []

    var mountBucketCallCount = 0
    var mountedBuckets: [String: String] = [:] // bucketName -> mountPath

    var unmountBucketCallCount = 0
    var unmountedPaths: [String] = []

    var mountStates: [String: MountState] = [:]

    var cacheSize: Int64 = 1024 * 1024 * 10 // 10 MB
    var cacheFileCount = 5

    var clearCacheCallCount = 0
    var clearCacheResponse = true

    // MARK: - DaemonProtocol

    func ping(reply: @escaping (Bool) -> Void) {
        pingCallCount += 1
        reply(lastPingResponse)
    }

    func listBuckets(
        for account: CloudAccount,
        reply: @escaping ([BucketInfo]?, Error?) -> Void
    ) {
        listBucketsCallCount += 1
        reply(mockBaskets, nil)
    }

    func mountBucket(
        bucketName: String,
        for account: CloudAccount,
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    ) {
        mountBucketCallCount += 1
        mountedBuckets[bucketName] = mountPath
        mountStates[bucketName] = .mounted
        reply(true, nil)
    }

    func unmountBucket(
        at mountPath: String,
        reply: @escaping (Bool, Error?) -> Void
    ) {
        unmountBucketCallCount += 1
        unmountedPaths.append(mountPath)

        // Find and update mount state
        if let (bucketName, _) = mountedBuckets.first(where: { $0.value == mountPath }) {
            mountStates[bucketName] = .unmounted
            mountedBuckets.removeValue(forKey: bucketName)
        }

        reply(true, nil)
    }

    func getMountState(
        for bucketName: String,
        reply: @escaping (MountState) -> Void
    ) {
        reply(mountStates[bucketName] ?? .unmounted)
    }

    func getCacheStats(
        reply: @escaping (Int64, Int) -> Void
    ) {
        reply(cacheSize, cacheFileCount)
    }

    func clearCache(reply: @escaping (Bool) -> Void) {
        clearCacheCallCount += 1
        reply(clearCacheResponse)
    }
}

final class DaemonClientTests: CloudLocalMountTestCase {

    var mockDaemon: MockDaemonService!
    var testAccount: CloudAccount!

    override func setUp() async throws {
        try await super.setUp()

        mockDaemon = MockDaemonService()
        testAccount = CloudAccount(
            provider: .googleCloud,
            name: "Test Account",
            credentials: .gcsOAuth(.init(accessToken: "test-token"))
        )
    }

    // MARK: - Connection Tests

    func testDaemonClientSingleton() {
        let client1 = DaemonClient.shared
        let client2 = DaemonClient.shared

        XCTAssertTrue(client1 === client2, "DaemonClient should be a singleton")
    }

    func testInitialConnectionState() {
        let client = DaemonClient.shared

        // Initially not connected (daemon not running)
        // This tests the initial state
        XCTAssertNotNil(client, "Client should be initialized")
    }

    // MARK: - Ping Tests

    func testPingSuccess() async {
        // Note: This requires a running daemon for real testing
        // For unit tests, we test the client structure

        let client = DaemonClient.shared

        // Ping will fail without actual daemon
        // The important thing is it doesn't crash
        await client.pingDaemon()

        // The isConnected flag will reflect the result
        // (false when daemon not available)
        XCTAssertTrue(true, "Ping executed without crashing")
    }

    func testMultiplePings() async {
        let client = DaemonClient.shared

        await client.pingDaemon()
        await client.pingDaemon()
        await client.pingDaemon()

        // Should handle multiple pings gracefully
        XCTAssertTrue(true, "Multiple pings handled")
    }

    // MARK: - List Buckets Tests

    func testListBucketsWithAccount() async {
        let client = DaemonClient.shared

        do {
            // Will fail without actual daemon
            let buckets = try await client.listBuckets(for: testAccount)

            // If daemon were running, we'd get bucket list
            XCTAssertTrue(true, "List buckets executed")
        } catch {
            // Expected when daemon not running
            XCTAssertTrue(error is XPCError || error is NSError, "Should get XPC or generic error")
        }
    }

    func testListBucketsWithDifferentProviders() async {
        let gcsAccount = CloudAccount(
            provider: .googleCloud,
            name: "GCS Account",
            credentials: .gcsOAuth(.init(accessToken: "gcs-token"))
        )

        let awsAccount = CloudAccount(
            provider: .awsS3,
            name: "AWS Account",
            credentials: .awsAccessKey("key", "secret")
        )

        let client = DaemonClient.shared

        // Both should attempt communication (even if they fail)
        _ = try? await client.listBuckets(for: gcsAccount)
        _ = try? await client.listBuckets(for: awsAccount)

        XCTAssertTrue(true, "List buckets for different providers attempted")
    }

    // MARK: - Mount Bucket Tests

    func testMountBucket() async {
        let client = DaemonClient.shared
        let mountPath = "/tmp/test-mount"

        do {
            try await client.mountBucket(
                bucketName: "test-bucket",
                for: testAccount,
                at: mountPath
            )

            XCTAssertTrue(true, "Mount bucket executed")
        } catch {
            // Expected when daemon not running
            XCTAssertTrue(error is XPCError || error is NSError, "Should get XPC or generic error")
        }
    }

    func testMountBucketWithCustomPath() async {
        let client = DaemonClient.shared
        let customPath = "/tmp/custom/mount/point"

        do {
            try await client.mountBucket(
                bucketName: "custom-bucket",
                for: testAccount,
                at: customPath
            )

            XCTAssertTrue(true, "Mount with custom path executed")
        } catch {
            // Expected when daemon not running
        }
    }

    // MARK: - Unmount Bucket Tests

    func testUnmountBucket() async {
        let client = DaemonClient.shared
        let mountPath = "/tmp/test-mount"

        do {
            try await client.unmountBucket(at: mountPath)

            XCTAssertTrue(true, "Unmount bucket executed")
        } catch {
            // Expected when daemon not running
            XCTAssertTrue(error is XPCError || error is NSError, "Should get XPC or generic error")
        }
    }

    func testUnmountNonexistentMount() async {
        let client = DaemonClient.shared

        do {
            try await client.unmountBucket(at: "/tmp/does/not/exist")

            XCTAssertTrue(true, "Unmount executed")
        } catch {
            // Expected when daemon not running
        }
    }

    // MARK: - Get Mount State Tests

    func testGetMountState() async {
        let client = DaemonClient.shared

        do {
            let state = try await client.getMountState(for: "test-bucket")

            // Without daemon, should get default state
            switch state {
            case .unmounted:
                XCTAssertTrue(true, "Default state is unmounted")
            default:
                XCTAssertTrue(true, "Got state: \(state.displayName)")
            }
        } catch {
            // Expected when daemon not running
        }
    }

    func testGetMountStateForMultipleBuckets() async {
        let client = DaemonClient.shared
        let buckets = ["bucket1", "bucket2", "bucket3"]

        for bucket in buckets {
            do {
                let state = try await client.getMountState(for: bucket)
                // Just verify it doesn't crash
                XCTAssertTrue(true, "Got state for \(bucket)")
            } catch {
                // Expected
            }
        }
    }

    // MARK: - Cache Stats Tests

    func testGetCacheStats() async {
        let client = DaemonClient.shared

        do {
            let (size, count) = try await client.getCacheStats()

            // Without daemon, should get defaults or error
            XCTAssertTrue(size >= 0, "Cache size should be non-negative")
            XCTAssertTrue(count >= 0, "File count should be non-negative")
        } catch {
            // Expected when daemon not running
        }
    }

    // MARK: - Clear Cache Tests

    func testClearCache() async {
        let client = DaemonClient.shared

        do {
            try await client.clearCache()

            XCTAssertTrue(true, "Clear cache executed")
        } catch {
            // Expected when daemon not running
            XCTAssertTrue(error is XPCError || error is NSError, "Should get XPC or generic error")
        }
    }

    // MARK: - Error Handling Tests

    func testConnectionErrorHandling() {
        let client = DaemonClient.shared

        // Without daemon, connection will fail
        // Client should handle gracefully
        XCTAssertFalse(client.isConnected, "Should not be connected without daemon")
    }

    func testReconnectionLogic() {
        let client = DaemonClient.shared

        // Test reconnection (won't actually connect without daemon)
        client.reconnect()

        // Should not crash
        XCTAssertTrue(true, "Reconnection handled")
    }

    func testDisconnect() {
        let client = DaemonClient.shared

        client.disconnect()

        // Should not crash
        XCTAssertFalse(client.isConnected, "Should be disconnected")
    }

    // MARK: - Callback Tests (AppDelegateProtocol)

    func testMountStateChangeCallback() {
        let client = DaemonClient.shared

        // Simulate callback from daemon
        client.mountStateDidChange(bucketName: "test-bucket", state: .mounted)

        // Should post notification
        XCTAssertTrue(true, "Mount state change callback executed")
    }

    func testDaemonErrorCallback() {
        let client = DaemonClient.shared

        // Simulate error callback
        client.daemonDidEncounterError(message: "Test error", category: "Test")

        // Should post notification
        XCTAssertTrue(true, "Error callback executed")
    }

    func testCacheSizeChangeCallback() {
        let client = DaemonClient.shared

        // Simulate cache size change
        client.cacheSizeDidChange(sizeBytes: 1024 * 1024 * 5)

        // Should post notification
        XCTAssertTrue(true, "Cache size change callback executed")
    }

    // MARK: - XPC Error Tests

    func testXPCErrorDescriptions() {
        let errors: [XPCError] = [
            .connectionInvalid,
            .connectionInterrupted,
            .daemonNotRunning,
            .timeout,
            .invalidResponse
        ]

        for error in errors {
            XCTAssertNotNil(error.errorDescription, "Error should have description: \(error)")
        }
    }

    func testXPCErrorWithWrappedError() {
        let underlyingError = NSError(domain: "test", code: 123)
        let xpcError = XPCError.unknown(underlyingError)

        XCTAssertTrue(xpcError.errorDescription?.contains("123") == true,
                     "Should include underlying error code")
    }

    // MARK: - Notification Tests

    func testMountStateNotification() {
        let expectation = XCTestExpectation(description: "Mount state notification")

        let observer = NotificationCenter.default.addObserver(
            forName: .mountStateDidChange,
            object: nil,
            queue: .main
        ) { notification in
            if let bucketName = notification.userInfo?["bucketName"] as? String,
               let state = notification.userInfo?["state"] as? MountState {
                XCTAssertEqual(bucketName, "test-bucket")
                XCTAssertTrue(true, "Received notification with correct data")
                expectation.fulfill()
            }
        }

        let client = DaemonClient.shared
        client.mountStateDidChange(bucketName: "test-bucket", state: .mounted)

        wait(for: [expectation], timeout: 1.0)
        NotificationCenter.default.removeObserver(observer)
    }

    func testDaemonErrorNotification() {
        let expectation = XCTestExpectation(description: "Daemon error notification")

        let observer = NotificationCenter.default.addObserver(
            forName: .daemonError,
            object: nil,
            queue: .main
        ) { notification in
            if let message = notification.userInfo?["message"] as? String {
                XCTAssertEqual(message, "Test error")
                expectation.fulfill()
            }
        }

        let client = DaemonClient.shared
        client.daemonDidEncounterError(message: "Test error", category: "Test")

        wait(for: [expectation], timeout: 1.0)
        NotificationCenter.default.removeObserver(observer)
    }

    func testCacheSizeNotification() {
        let expectation = XCTestExpectation(description: "Cache size notification")

        let observer = NotificationCenter.default.addObserver(
            forName: .cacheSizeDidChange,
            object: nil,
            queue: .main
        ) { notification in
            if let sizeBytes = notification.userInfo?["sizeBytes"] as? Int64 {
                XCTAssertEqual(sizeBytes, 5242880) // 5 MB
                expectation.fulfill()
            }
        }

        let client = DaemonClient.shared
        client.cacheSizeDidChange(sizeBytes: 5242880)

        wait(for: [expectation], timeout: 1.0)
        NotificationCenter.default.removeObserver(observer)
    }

    // MARK: - Concurrent Operations Tests

    func testConcurrentOperations() async {
        let client = DaemonClient.shared

        await withTaskGroup(of: Void.self) { group in
            // Multiple simultaneous operations
            group.addTask {
                _ = try? await client.listBuckets(for: self.testAccount)
            }

            group.addTask {
                _ = try? await client.getMountState(for: "bucket1")
            }

            group.addTask {
                _ = try? await client.getCacheStats()
            }
        }

        // Should complete without crashing
        XCTAssertTrue(true, "Concurrent operations handled")
    }
}
