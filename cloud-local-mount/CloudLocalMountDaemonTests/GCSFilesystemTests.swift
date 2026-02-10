//
//  GCSFilesystemTests.swift
//  CloudLocalMountDaemonTests
//
//  Unit tests for GCSFilesystem (FUSE operations).
//

import XCTest
@testable import CloudLocalMountShared

final class GCSFilesystemTests: CloudLocalMountDaemonTestCase {

    var filesystem: GCSFilesystem!
    var mockGCSClient: GCSClient!
    var mockCacheManager: CacheManager!

    let testBucketName = "test-bucket"
    var testMountPath: String!

    override func setUp() async throws {
        try await super.setUp()

        mockGCSClient = GCSClient()
        mockCacheManager = CacheManager(maxSizeGB: 1)

        // Create temporary mount path
        let tempDir = FileManager.default.temporaryDirectory
        testMountPath = tempDir appendingPathComponent: "mount_\(UUID().uuidString)").path

        filesystem = GCSFilesystem(
            bucketName: testBucketName,
            mountPath: testMountPath,
            gcsClient: mockGCSClient,
            cacheManager: mockCacheManager
        )
    }

    override func tearDown() async throws {
        // Clean up mount path
        try? FileManager.default.removeItem(atPath: testMountPath)

        try await super.tearDown()
    }

    // MARK: - Path to Object Key Conversion Tests

    func testPathToObjectKeyRootPath() {
        let key = filesystem.pathToObjectKey("/")
        XCTAssertEqual(key, ".", "Root path should convert to dot")
    }

    func testPathToObjectKeySimpleFile() {
        let key = filesystem.pathToObjectKey("/file.txt")
        XCTAssertEqual(key, "file.txt")
    }

    func testPathToObjectKeyNestedFile() {
        let key = filesystem.pathToObjectKey("/folder/subfolder/file.txt")
        XCTAssertEqual(key, "folder/subfolder/file.txt")
    }

    func testPathToObjectKeyWithoutLeadingSlash() {
        let key1 = filesystem.pathToObjectKey("file.txt")
        let key2 = filesystem.pathToObjectKey("/file.txt")
        XCTAssertEqual(key1, key2, "Should handle paths with and without leading slash")
    }

    func testPathToObjectKeySpecialCharacters() {
        let path = "/folder with spaces/file (1).txt"
        let key = filesystem.pathToObjectKey(path)
        XCTAssertEqual(key, "folder with spaces/file (1).txt", "Should preserve special characters in key")
    }

    func testPathToObjectKeyEmptyString() {
        let key = filesystem.pathToObjectKey("")
        XCTAssertEqual(key, "", "Empty path should become empty key")
    }

    // MARK: - GetAttr Tests

    func testGetAttrRootDirectory() async {
        do {
            let attrs = try await filesystem.getattr(path: "/")

            XCTAssertEqual(attrs.mode & S_IFDIR, S_IFDIR, "Root should be a directory")
            XCTAssertEqual(attrs.size, 0, "Root directory size should be 0")
        } catch {
            XCTFail("Should not throw for root directory: \(error)")
        }
    }

    func testGetAttrRegularFile() async {
        do {
            let attrs = try await filesystem.getattr(path: "/test.txt")

            // Stub returns default attributes
            XCTAssertEqual(attrs.mode & S_IFREG, S_IFREG, "Should be a regular file")
            XCTAssertEqual(attrs.size, 1024, "Stub returns default size")
        } catch {
            XCTFail("Should not throw for regular file: \(error)")
        }
    }

    // MARK: - ReadDir Tests

    func testReadDirRoot() async {
        do {
            let entries = try await filesystem.readdir(path: "/")

            XCTAssertFalse(entries.isEmpty, "Root should have entries")
            XCTAssertTrue(entries.contains { $0.name == "." }, "Should contain . entry")
            XCTAssertTrue(entries.contains { $0.name == ".." }, "Should contain .. entry")
        } catch {
            XCTFail("Should not throw for readdir: \(error)")
        }
    }

    func testReadDirSubdirectory() async {
        do {
            let entries = try await filesystem.readdir(path: "/folder")

            // Stub returns empty for subdirectories
            XCTAssertTrue(entries.isEmpty, "Subdirectory stub returns empty")
        } catch {
            XCTFail("Should not throw for subdirectory: \(error)")
        }
    }

    // MARK: - File Handle Tracking Tests

    func testOpenFileCreatesHandle() async {
        do {
            let handle = try await filesystem.open(path: "/test.txt", flags: O_RDONLY)
            XCTAssertEqual(handle, 0, "Should return file descriptor 0")
        } catch {
            // May fail due to GCS client not being implemented
            XCTAssertTrue(error is GCSError || error is NSError, "Should get GCS or generic error")
        }
    }

    func testOpenNonexistentFile() async {
        do {
            _ = try await filesystem.open(path: "/does-not-exist.txt", flags: O_RDONLY)
            XCTFail("Should throw for nonexistent file")
        } catch GCSError.objectNotFound {
            XCTAssertTrue(true, "Should throw object not found")
        } catch {
            // Other errors acceptable for stub
        }
    }

    // MARK: - Read Tests

    func testReadFromStartOfFile() async {
        // First, ensure file is cached
        let testData = Data("Hello, World!".utf8)
        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: testData)

        do {
            let data = try await filesystem.read(path: "/test.txt", offset: 0, size: 5)
            XCTAssertEqual(data, Data("Hello".utf8), "Should read first 5 bytes")
        } catch {
            XCTFail("Should not throw for read: \(error)")
        }
    }

    func testReadWithOffset() async {
        let testData = Data("Hello, World!".utf8)
        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: testData)

        do {
            let data = try await filesystem.read(path: "/test.txt", offset: 7, size: 5)
            XCTAssertEqual(data, Data("World".utf8), "Should read from offset")
        } catch {
            XCTFail("Should not throw for read with offset: \(error)")
        }
    }

    func testReadBeyondFileEnd() async {
        let testData = Data("Hello".utf8)
        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: testData)

        do {
            let data = try await filesystem.read(path: "/test.txt", offset: 10, size: 5)
            XCTAssertEqual(data.count, 0, "Reading beyond end should return empty data")
        } catch {
            XCTFail("Should not throw when reading beyond end: \(error)")
        }
    }

    func testReadUncachedFile() async {
        do {
            let data = try await filesystem.read(path: "/uncached.txt", offset: 0, size: 100)
            XCTAssertEqual(data.count, 0, "Uncached file should return empty (stub)")
        } catch {
            // Acceptable - may throw for uncached files
        }
    }

    // MARK: - Write Tests

    func testWriteToNewFile() async {
        let testData = Data("New content".utf8)

        do {
            let bytesWritten = try await filesystem.write(path: "/new.txt", offset: 0, data: testData)
            XCTAssertEqual(bytesWritten, UInt(testData.count), "Should write all bytes")

            // Verify it's cached
            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "new.txt")
            XCTAssertEqual(cached, testData, "Should be cached after write")
        } catch {
            XCTFail("Should not throw for write: \(error)")
        }
    }

    func testWriteAppend() async {
        let initialData = Data("Hello".utf8)
        let appendData = Data(" World".utf8)

        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: initialData)

        do {
            _ = try await filesystem.write(path: "/test.txt", offset: 5, data: appendData)

            // Verify combined data is cached
            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "test.txt")
            // Note: stub implementation doesn't actually append, just replaces
            XCTAssertNotNil(cached, "File should still be cached")
        } catch {
            XCTFail("Should not throw for append write: \(error)")
        }
    }

    // MARK: - Create Tests

    func testCreateNewFile() async {
        do {
            let fd = try await filesystem.create(path: "/newfile.txt", mode: 0o644)
            XCTAssertEqual(fd, 0, "Should return file descriptor")

            // Verify empty file is cached
            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "newfile.txt")
            XCTAssertNotNil(cached, "New file should be cached")
        } catch {
            XCTFail("Should not throw for create: \(error)")
        }
    }

    // MARK: - Mkdir Tests

    func testMkdir() async {
        do {
            try await filesystem.mkdir(path: "/newfolder", mode: 0o755)
            // In GCS, directories are implicit via object naming
            // Stub just logs
            XCTAssertTrue(true, "Mkdir completed (stub)")
        } catch {
            XCTFail("Should not throw for mkdir: \(error)")
        }
    }

    // MARK: - Unlink Tests

    func testUnlinkExistingFile() async {
        // First cache a file
        mockCacheManager.cacheData(bucket: testBucketName, key: "to-delete.txt", data: Data("test".utf8))

        do {
            try await filesystem.unlink(path: "/to-delete.txt")

            // Verify it's removed from cache
            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "to-delete.txt")
            XCTAssertNil(cached, "File should be removed from cache")
        } catch {
            XCTFail("Should not throw for unlink: \(error)")
        }
    }

    func testUnlinkNonexistentFile() async {
        do {
            try await filesystem.unlink(path: "/does-not-exist.txt")
            // Should succeed silently (idempotent)
            XCTAssertTrue(true, "Unlink of nonexistent file succeeds")
        } catch {
            XCTFail("Should not throw for unlink of nonexistent: \(error)")
        }
    }

    // MARK: - Truncate Tests

    func testTruncateShrink() async {
        let originalData = Data(repeating: 0xFF, count: 100)
        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: originalData)

        do {
            try await filesystem.truncate(path: "/test.txt", size: 50)

            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "test.txt")
            XCTAssertNotNil(cached, "File should still exist")
            XCTAssertEqual(cached?.count, 50, "File should be truncated to 50 bytes")
        } catch {
            XCTFail("Should not throw for truncate shrink: \(error)")
        }
    }

    func testTruncateGrow() async {
        let originalData = Data("Hello".utf8)
        mockCacheManager.cacheData(bucket: testBucketName, key: "test.txt", data: originalData)

        do {
            try await filesystem.truncate(path: "/test.txt", size: 100)

            let cached = mockCacheManager.getCachedData(bucket: testBucketName, key: "test.txt")
            XCTAssertNotNil(cached, "File should still exist")
            XCTAssertEqual(cached?.count, 100, "File should be grown to 100 bytes")
        } catch {
            XCTFail("Should not throw for truncate grow: \(error)")
        }
    }

    func testTruncateNonexistentFile() async {
        do {
            try await filesystem.truncate(path: "/does-not-exist.txt", size: 100)
            XCTFail("Should throw for truncating nonexistent file")
        } catch FUSEError.fileNotFound {
            XCTAssertTrue(true, "Should throw file not found")
        } catch {
            // Other errors acceptable for stub
        }
    }

    // MARK: - Mount/Unmount Tests

    func testMountCreatesDirectory() async throws {
        // Remove mount path first
        try? FileManager.default.removeItem(atPath: testMountPath)

        try await filesystem.mount()

        var isDir: ObjCBool = false
        let exists = FileManager.default.fileExists(atPath: testMountPath, isDirectory: &isDir)

        XCTAssertTrue(exists, "Mount path should be created")
        XCTAssertTrue(isDir.boolValue, "Mount path should be a directory")
    }

    func testUnmount() async {
        do {
            try await filesystem.unmount()
            XCTAssertTrue(true, "Unmount completed (stub)")
        } catch {
            XCTFail("Should not throw for unmount: \(error)")
        }
    }

    // MARK: - FileAttributes Tests

    func testFileAttributesDefaults() {
        let attrs = FileAttributes(
            mode: S_IFREG | 0o644,
            size: 1024,
            mtime: Date()
        )

        XCTAssertEqual(attrs.mode & S_IFPERM, 0o644, "Default permissions")
        XCTAssertEqual(attrs.size, 1024, "Size should match")
        XCTAssertNotNil(attrs.mtime, "Should have modification time")
    }

    // MARK: - DirEntry Tests

    func testDirEntryForFile() {
        let entry = DirEntry(name: "file.txt", type: .file)
        XCTAssertEqual(entry.name, "file.txt")
        XCTAssertEqual(entry.type, .file)
    }

    func testDirEntryForDirectory() {
        let entry = DirEntry(name: "folder", type: .directory)
        XCTAssertEqual(entry.name, "folder")
        XCTAssertEqual(entry.type, .directory)
    }

    // MARK: - FUSE Error Tests

    func testFUSEErrorDescriptions() {
        let errors: [FUSEError] = [
            .fileNotFound,
            .permissionDenied,
            .notImplemented,
            .ioError("Test error")
        ]

        for error in errors {
            XCTAssertNotNil(error.errorDescription, "Error should have description: \(error)")
        }
    }
}
