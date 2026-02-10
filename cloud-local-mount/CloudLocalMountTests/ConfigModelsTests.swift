//
//  ConfigModelsTests.swift
//  CloudLocalMountTests
//
//  Unit tests for configuration data models.
//

import XCTest
@testable import CloudLocalMountShared

final class ConfigModelsTests: CloudLocalMountTestCase {

    // MARK: - CloudAccount Tests

    func testCloudAccountCreation() {
        let account = CloudAccount(
            provider: .googleCloud,
            name: "Test Account",
            credentials: .gcsOAuth(.init(accessToken: "test-token"))
        )

        XCTAssertEqual(account.provider, .googleCloud)
        XCTAssertEqual(account.name, "Test Account")
        XCTAssertTrue(account.mountedBuckets.isEmpty)
    }

    func testCloudAccountEquality() {
        let account1 = CloudAccount(
            id: UUID(),
            provider: .googleCloud,
            name: "Test",
            credentials: .gcsOAuth(.init(accessToken: "token"))
        )
        let account2 = account1

        XCTAssertEqual(account1, account2)
    }

    // MARK: - Provider Tests

    func testProviderDisplayNames() {
        XCTAssertEqual(Provider.googleCloud.displayName, "Google Cloud Storage")
        XCTAssertEqual(Provider.awsS3.displayName, "Amazon S3")
    }

    func testProviderAllCases() {
        XCTAssertEqual(Provider.allCases.count, 2)
        XCTAssertTrue(Provider.allCases.contains(.googleCloud))
        XCTAssertTrue(Provider.allCases.contains(.awsS3))
    }

    // MARK: - CredentialData Tests

    func testGCSServiceAccountCredentials() {
        let jsonData = Data("{}".utf8)
        let credentials = CredentialData.gcsServiceAccount(jsonData)

        switch credentials {
        case .gcsServiceAccount(let data):
            XCTAssertEqual(data, jsonData)
        default:
            XCTFail("Expected gcsServiceAccount")
        }
    }

    func testGCSOAuthCredentials() {
        let token = CredentialData.Token(
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresAt: Date()
        )
        let credentials = CredentialData.gcsOAuth(token)

        switch credentials {
        case .gcsOAuth(let t):
            XCTAssertEqual(t.accessToken, "access-token")
            XCTAssertEqual(t.refreshToken, "refresh-token")
        default:
            XCTFail("Expected gcsOAuth")
        }
    }

    func testAWSAccessKeyCredentials() {
        let credentials = CredentialData.awsAccessKey("key-id", "secret-key")

        switch credentials {
        case .awsAccessKey(let keyId, let secret):
            XCTAssertEqual(keyId, "key-id")
            XCTAssertEqual(secret, "secret-key")
        default:
            XCTFail("Expected awsAccessKey")
        }
    }

    func testCredentialDataEncodingDecoding() throws {
        let original = CredentialData.gcsOAuth(.init(
            accessToken: "test-token",
            refreshToken: nil,
            expiresAt: nil
        ))

        let encoder = JSONEncoder()
        let data = try encoder.encode(original)

        let decoder = JSONDecoder()
        let decoded = try decoder.decode(CredentialData.self, from: data)

        XCTAssertEqual(original, decoded)
    }

    func testMultipleCredentialsNotEqual() {
        let creds1 = CredentialData.gcsOAuth(.init(accessToken: "token1"))
        let creds2 = CredentialData.awsAccessKey("key", "secret")
        XCTAssertNotEqual(creds1, creds2)
    }

    // MARK: - MountedBucket Tests

    func testMountedBucketCreation() {
        let bucket = MountedBucket(
            bucketName: "test-bucket",
            mountPath: "/tmp/mount/test-bucket",
            autoMount: true
        )

        XCTAssertEqual(bucket.bucketName, "test-bucket")
        XCTAssertEqual(bucket.mountPath, "/tmp/mount/test-bucket")
        XCTAssertTrue(bucket.autoMount)
    }

    func testMountedBucketEquality() {
        let bucket1 = MountedBucket(
            id: UUID(),
            bucketName: "test",
            mountPath: "/tmp/test",
            autoMount: false
        )
        let bucket2 = bucket1

        XCTAssertEqual(bucket1, bucket2)
    }

    // MARK: - CacheSettings Tests

    func testCacheSettingsDefaults() {
        let settings = CacheSettings()

        XCTAssertEqual(settings.maxSizeGB, 10)
        XCTAssertTrue(settings.location.path.contains("com.cloudlocalmount"))
    }

    func testCacheSettingsCustom() {
        let customURL = URL(fileURLWithPath: "/tmp/cache")
        let settings = CacheSettings(maxSizeGB: 20, location: customURL)

        XCTAssertEqual(settings.maxSizeGB, 20)
        XCTAssertEqual(settings.location, customURL)
    }

    func testCacheSettingsStaticDefault() {
        let settings = CacheSettings.default

        XCTAssertEqual(settings.maxSizeGB, 10)
    }

    func testCacheSettingsEquality() {
        let settings1 = CacheSettings(maxSizeGB: 10)
        let settings2 = CacheSettings(maxSizeGB: 10)

        XCTAssertEqual(settings1, settings2)
    }

    // MARK: - MountState Tests

    func testMountStateUnmounted() {
        let state = MountState.unmounted
        XCTAssertEqual(state.displayName, "Not Mounted")
    }

    func testMountStateMounting() {
        let state = MountState.mounting
        XCTAssertEqual(state.displayName, "Mounting...")
    }

    func testMountStateMounted() {
        let state = MountState.mounted
        XCTAssertEqual(state.displayName, "Mounted")
    }

    func testMountStateUnmounting() {
        let state = MountState.unmounting
        XCTAssertEqual(state.displayName, "Unmounting...")
    }

    func testMountStateError() {
        let state = MountState.error("Connection failed")
        XCTAssertTrue(state.displayName.contains("Connection failed"))
    }

    func testMountStateEncodingDecoding() throws {
        let states: [MountState] = [
            .unmounted,
            .mounting,
            .mounted,
            .unmounting,
            .error("test error")
        ]

        let encoder = JSONEncoder()
        let decoder = JSONDecoder()

        for state in states {
            let data = try encoder.encode(state)
            let decoded = try decoder.decode(MountState.self, from: data)

            switch (state, decoded) {
            case (.unmounted, .unmounted),
                 (.mounting, .mounting),
                 (.mounted, .mounted),
                 (.unmounting, .unmounting):
                break
            case (.error(let e1), .error(let e2)):
                XCTAssertEqual(e1, e2)
            default:
                XCTFail("State mismatch: \(state) != \(decoded)")
            }
        }
    }

    // MARK: - BucketInfo Tests

    func testBucketInfoCreation() {
        let info = BucketInfo(
            id: "bucket-1",
            name: "test-bucket",
            location: "US",
            storageClass: "STANDARD"
        )

        XCTAssertEqual(info.id, "bucket-1")
        XCTAssertEqual(info.name, "test-bucket")
        XCTAssertEqual(info.location, "US")
        XCTAssertEqual(info.storageClass, "STANDARD")
        XCTAssertNil(info.createdAt)
        XCTAssertNil(info.sizeBytes)
    }

    func testBucketInfoWithOptionalFields() {
        let date = Date()
        let info = BucketInfo(
            id: "bucket-2",
            name: "logs",
            location: "EU",
            storageClass: "NEARLINE",
            createdAt: date,
            sizeBytes: 1024 * 1024 * 1024 * 5 // 5 GB
        )

        XCTAssertEqual(info.id, "bucket-2")
        XCTAssertEqual(info.name, "logs")
        XCTAssertEqual(info.location, "EU")
        XCTAssertEqual(info.storageClass, "NEARLINE")
        XCTAssertEqual(info.createdAt, date)
        XCTAssertEqual(info.sizeBytes, 5_368_709_120)
    }

    func testBucketInfoEquality() {
        let info1 = BucketInfo(
            id: "same-id",
            name: "bucket1",
            location: "US",
            storageClass: "STANDARD"
        )
        let info2 = BucketInfo(
            id: "same-id",
            name: "bucket2",  // Different name but same ID
            location: "EU",
            storageClass: "NEARLINE"
        )

        XCTAssertEqual(info1, info2)
    }

    func testBucketInfoInequality() {
        let info1 = BucketInfo(
            id: "id-1",
            name: "bucket",
            location: "US",
            storageClass: "STANDARD"
        )
        let info2 = BucketInfo(
            id: "id-2",
            name: "bucket",
            location: "US",
            storageClass: "STANDARD"
        )

        XCTAssertNotEqual(info1, info2)
    }

    func testBucketInfoIdentifiable() {
        let info1 = BucketInfo(
            id: "test-id",
            name: "bucket",
            location: "US",
            storageClass: "STANDARD"
        )

        XCTAssertEqual(info1.id, "test-id")
    }
}
