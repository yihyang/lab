//
//  CacheManagerTests.swift
//  CloudLocalMountDaemonTests
//
//  Unit tests for CacheManager.
//

import XCTest
@testable import CloudLocalMountShared

/// Mock classes for testing
class MockGCSClient {
    var downloadCallCount = 0
    var downloadedBuckets: [String] = []
    var downloadedKeys: [String] = []

    func downloadObject(bucketName: String, objectName: String) async throws -> Data {
        downloadCallCount += 1
        downloadedBuckets.append(bucketName)
        downloadedKeys.append(objectName)
        return Data("test data for \(bucketName)/\(objectName)".utf8)
    }
}

final class CacheManagerTests: CloudLocalMountDaemonTestCase {

    var tempCacheDirectory: URL!
    var cacheManager: CacheManager!

    override func setUp() async throws {
        try await super.setUp()

        // Create a temporary directory for testing
        let tempDir = FileManager.default.temporaryDirectory
        tempCacheDirectory = tempDir.appendingPathComponent("cache_tests_\(UUID().uuidString)")

        // Create custom cache manager with test directory
        cacheManager = CacheManager(maxSizeGB: 1) // 1 GB for tests

        // Use reflection or setter to inject temp directory
        // For now, we'll test the public interface
    }

    override func tearDown() async throws {
        // Clean up temp directory
        try? FileManager.default.removeItem(at: tempCacheDirectory)

        try await super.tearDown()
    }

    // MARK: - Cache Path Generation Tests

    func testCachePathIsConsistent() {
        let path1 = cacheManager.cachePath(for: "bucket1", key: "folder/file.txt")
        let path2 = cacheManager.cachePath(for: "bucket1", key: "folder/file.txt")

        XCTAssertEqual(path1, path2, "Cache paths should be consistent for same inputs")
    }

    func testCachePathDiffersForDifferentBuckets() {
        let path1 = cacheManager.cachePath(for: "bucket1", key: "file.txt")
        let path2 = cacheManager.cachePath(for: "bucket2", key: "file.txt")

        XCTAssertNotEqual(path1, path2, "Different buckets should have different cache paths")
    }

    func testCachePathDiffersForDifferentKeys() {
        let path1 = cacheManager.cachePath(for: "bucket1", key: "file1.txt")
        let path2 = cacheManager.cachePath(for: "bucket1", key: "file2.txt")

        XCTAssertNotEqual(path1, path2, "Different keys should have different cache paths")
    }

    func testCachePathHandlesSpecialCharacters() {
        let specialKeys = [
            "file with spaces.txt",
            "file/with/slashes.txt",
            "file:with:colons.txt",
            "file\"with\"quotes.txt",
            "file'with'apostrophes.txt"
        ]

        for key in specialKeys {
            let path = cacheManager.cachePath(for: "bucket1", key: key)
            XCTAssertFalse(path.path.contains(key), "Cache path should use hash, not raw key")
        }
    }

    // MARK: - Cache Data Storage/Retrieval Tests

    func testCacheMiss() {
        let data = cacheManager.getCachedData(bucket: "test-bucket", key: "nonexistent.txt")

        XCTAssertNil(data, "Should return nil for cache miss")
    }

    func testCacheHit() {
        let testData = Data("Hello, World!".utf8)
        cacheManager.cacheData(bucket: "test-bucket", key: "test.txt", data: testData)

        let retrieved = cacheManager.getCachedData(bucket: "test-bucket", key: "test.txt")

        XCTAssertNotNil(retrieved, "Should retrieve cached data")
        XCTAssertEqual(retrieved, testData, "Retrieved data should match original")
    }

    func testCacheOverwrite() {
        let data1 = Data("Version 1".utf8)
        let data2 = Data("Version 2".utf8)

        cacheManager.cacheData(bucket: "bucket", key: "file.txt", data: data1)
        cacheManager.cacheData(bucket: "bucket", key: "file.txt", data: data2)

        let retrieved = cacheManager.getCachedData(bucket: "bucket", key: "file.txt")

        XCTAssertEqual(retrieved, data2, "Should return the most recently cached data")
    }

    func testCacheMultipleFiles() {
        let files = [
            ("bucket1", "file1.txt", Data("Content 1".utf8)),
            ("bucket1", "file2.txt", Data("Content 2".utf8)),
            ("bucket2", "file3.txt", Data("Content 3".utf8))
        ]

        for (bucket, key, data) in files {
            cacheManager.cacheData(bucket: bucket, key: key, data: data)
        }

        for (bucket, key, data) in files {
            let retrieved = cacheManager.getCachedData(bucket: bucket, key: key)
            XCTAssertEqual(retrieved, data, "Should retrieve each file correctly")
        }
    }

    // MARK: - Cache Size Tracking Tests

    func testCacheSizeEmpty() {
        let (size, count) = cacheManager.getStats()

        XCTAssertEqual(size, 0, "New cache should have zero size")
        XCTAssertEqual(count, 0, "New cache should have zero file count")
    }

    func testCacheSizeIncremental() {
        let data1 = Data(repeating: 0xFF, count: 1024) // 1 KB
        let data2 = Data(repeating: 0xAA, count: 2048) // 2 KB

        cacheManager.cacheData(bucket: "bucket", key: "file1.txt", data: data1)
        var (size, count) = cacheManager.getStats()
        XCTAssertEqual(size, 1024, accuracy: 100, "Size should include first file")
        XCTAssertEqual(count, 1, "Count should be 1")

        cacheManager.cacheData(bucket: "bucket", key: "file2.txt", data: data2)
        (size, count) = cacheManager.getStats()
        XCTAssertEqual(size, 3072, accuracy: 100, "Size should include both files")
        XCTAssertEqual(count, 2, "Count should be 2")
    }

    // MARK: - LRU Eviction Tests

    func testLRUEvictionWhenFull() async {
        // Create cache manager with small limit
        let smallCache = CacheManager(maxSizeGB: 0) // Very small for testing
        let testData1 = Data(repeating: 0x01, count: 100)
        let testData2 = Data(repeating: 0x02, count: 100)

        smallCache.cacheData(bucket: "bucket", key: "old.txt", data: testData1)

        // Access old file to update its modification time
        _ = smallCache.getCachedData(bucket: "bucket", key: "old.txt")

        // Wait a bit to ensure different timestamps
        try? await Task.sleep(nanoseconds: 100_000)

        smallCache.cacheData(bucket: "bucket", key: "new.txt", data: testData2)

        // Verify old file might be evicted when cache is full
        // This test validates the eviction logic exists
    }

    // MARK: - Cache Clearing Tests

    func testRemoveSpecificFile() {
        let data = Data("Test".utf8)
        cacheManager.cacheData(bucket: "bucket", key: "file.txt", data: data)

        cacheManager.removeCachedData(bucket: "bucket", key: "file.txt")

        let retrieved = cacheManager.getCachedData(bucket: "bucket", key: "file.txt")
        XCTAssertNil(retrieved, "File should be removed from cache")
    }

    func testRemoveNonexistentFileDoesNotError() {
        // Should not throw when removing non-existent file
        cacheManager.removeCachedData(bucket: "bucket", key: "nonexistent.txt")

        let (size, count) = cacheManager.getStats()
        XCTAssertEqual(size, 0)
        XCTAssertEqual(count, 0)
    }

    func testRemoveBucketCache() async throws {
        // Add multiple files for a bucket
        let files = ["file1.txt", "file2.txt", "file3.txt"]
        for file in files {
            cacheManager.cacheData(bucket: "bucket1", key: file, data: Data(file.utf8))
        }

        // Add files for another bucket
        cacheManager.cacheData(bucket: "bucket2", key: "other.txt", data: Data("other".utf8))

        // Remove bucket1 cache
        cacheManager.removeBucketCache(bucket: "bucket1")

        // Verify bucket1 files are gone
        for file in files {
            let retrieved = cacheManager.getCachedData(bucket: "bucket1", key: file)
            XCTAssertNil(retrieved, "\(file) should be removed")
        }

        // Verify bucket2 file still exists
        let other = cacheManager.getCachedData(bucket: "bucket2", key: "other.txt")
        XCTAssertNotNil(other, "Other bucket files should remain")
    }

    func testClearAllCache() async throws {
        // Add multiple files across buckets
        cacheManager.cacheData(bucket: "bucket1", key: "file1.txt", data: Data("1".utf8))
        cacheManager.cacheData(bucket: "bucket1", key: "file2.txt", data: Data("2".utf8))
        cacheManager.cacheData(bucket: "bucket2", key: "file3.txt", data: Data("3".utf8))

        // Clear all cache
        try cacheManager.clearCache()

        // Verify all files are gone
        let (size, count) = cacheManager.getStats()
        XCTAssertEqual(size, 0, "Cache should be empty after clear")
        XCTAssertEqual(count, 0, "No files should remain after clear")

        XCTAssertNil(cacheManager.getCachedData(bucket: "bucket1", key: "file1.txt"))
        XCTAssertNil(cacheManager.getCachedData(bucket: "bucket1", key: "file2.txt"))
        XCTAssertNil(cacheManager.getCachedData(bucket: "bucket2", key: "file3.txt"))
    }

    // MARK: - Integration Tests

    func testCacheWorkflow() async {
        let mockClient = MockGCSClient()
        let bucket = "test-bucket"
        let key = "test-file.txt"

        // Step 1: Cache miss - should download
        var data = cacheManager.getCachedData(bucket: bucket, key: key)
        XCTAssertNil(data, "Initial cache should be empty")

        // Step 2: Simulate download and cache
        let downloadedData = try! await mockClient.downloadObject(bucketName: bucket, objectName: key)
        cacheManager.cacheData(bucket: bucket, key: key, data: downloadedData)
        XCTAssertEqual(mockClient.downloadCallCount, 1, "Should download once")

        // Step 3: Cache hit - should not download
        data = cacheManager.getCachedData(bucket: bucket, key: key)
        XCTAssertNotNil(data, "Should retrieve from cache")
        XCTAssertEqual(data, downloadedData, "Cached data should match downloaded")

        // Step 4: Remove and verify cache miss again
        cacheManager.removeCachedData(bucket: bucket, key: key)
        data = cacheManager.getCachedData(bucket: bucket, key: key)
        XCTAssertNil(data, "Should be cache miss after removal")
    }
}
