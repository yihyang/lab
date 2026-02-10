//
//  ConfigModels.swift
//  CloudLocalMount
//
//  Data models for cloud-local-mount app configuration.
//

import Foundation

// MARK: - Cloud Account

/// Represents a cloud storage account (GCS, AWS S3, etc.)
public struct CloudAccount: Codable, Identifiable, Equatable {
    public let id: UUID
    public var provider: Provider
    public var name: String
    public var credentials: CredentialData
    public var mountedBuckets: [MountedBucket]

    public init(
        id: UUID = UUID(),
        provider: Provider,
        name: String,
        credentials: CredentialData,
        mountedBuckets: [MountedBucket] = []
    ) {
        self.id = id
        self.provider = provider
        self.name = name
        self.credentials = credentials
        self.mountedBuckets = mountedBuckets
    }

    public static func == (lhs: CloudAccount, rhs: CloudAccount) -> Bool {
        lhs.id == rhs.id
    }
}

/// Supported cloud storage providers
public enum Provider: String, Codable, CaseIterable {
    case googleCloud = "google_cloud"
    case awsS3 = "aws_s3"

    public var displayName: String {
        switch self {
        case .googleCloud: return "Google Cloud Storage"
        case .awsS3: return "Amazon S3"
        }
    }
}

/// Credential data for different authentication methods
public enum CredentialData: Codable, Equatable {
    case gcsServiceAccount(Data)      // JSON key file data
    case gcsOAuth(Token)               // OAuth token
    case awsAccessKey(String, String)  // Access key ID and secret

    public struct Token: Codable, Equatable {
        let accessToken: String
        let refreshToken: String?
        let expiresAt: Date?

        public init(accessToken: String, refreshToken: String? = nil, expiresAt: Date? = nil) {
            self.accessToken = accessToken
            self.refreshToken = refreshToken
            self.expiresAt = expiresAt
        }
    }

    private enum CodingKeys: String, CodingKey {
        case type, gcsServiceAccountData, gcsOAuthToken, awsAccessKeyId, awsSecretAccessKey
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "gcsServiceAccount":
            let data = try container.decode(Data.self, forKey: .gcsServiceAccountData)
            self = .gcsServiceAccount(data)
        case "gcsOAuth":
            let token = try container.decode(Token.self, forKey: .gcsOAuthToken)
            self = .gcsOAuth(token)
        case "awsAccessKey":
            let keyId = try container.decode(String.self, forKey: .awsAccessKeyId)
            let secret = try container.decode(String.self, forKey: .awsSecretAccessKey)
            self = .awsAccessKey(keyId, secret)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Invalid credential type"
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .gcsServiceAccount(let data):
            try container.encode("gcsServiceAccount", forKey: .type)
            try container.encode(data, forKey: .gcsServiceAccountData)
        case .gcsOAuth(let token):
            try container.encode("gcsOAuth", forKey: .type)
            try container.encode(token, forKey: .gcsOAuthToken)
        case .awsAccessKey(let keyId, let secret):
            try container.encode("awsAccessKey", forKey: .type)
            try container.encode(keyId, forKey: .awsAccessKeyId)
            try container.encode(secret, forKey: .awsSecretAccessKey)
        }
    }
}

// MARK: - Mounted Bucket

/// Represents a mounted cloud storage bucket
public struct MountedBucket: Codable, Identifiable, Equatable {
    public let id: UUID
    public let bucketName: String
    public let mountPath: String
    public var autoMount: Bool

    public init(
        id: UUID = UUID(),
        bucketName: String,
        mountPath: String,
        autoMount: Bool = false
    ) {
        self.id = id
        self.bucketName = bucketName
        self.mountPath = mountPath
        self.autoMount = autoMount
    }

    public static func == (lhs: MountedBucket, rhs: MountedBucket) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Cache Settings

/// Cache configuration settings
public struct CacheSettings: Codable, Equatable {
    public var maxSizeGB: Int
    public var location: URL

    public init(maxSizeGB: Int = 10, location: URL? = nil) {
        self.maxSizeGB = maxSizeGB
        if let location = location {
            self.location = location
        } else {
            // Default cache location
            let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            self.location = cachesDir.appendingPathComponent("com.cloudlocalmount")
        }
    }

    public static var `default`: CacheSettings {
        CacheSettings()
    }
}

// MARK: - Mount State

/// Current mount state of a bucket
public enum MountState: String, Codable {
    case unmounted
    case mounting
    case mounted
    case unmounting
    case error(String)

    public var displayName: String {
        switch self {
        case .unmounted: return "Not Mounted"
        case .mounting: return "Mounting..."
        case .mounted: return "Mounted"
        case .unmounting: return "Unmounting..."
        case .error(let message): return "Error: \(message)"
        }
    }

    private enum CodingKeys: String, CodingKey {
        case rawValue
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let rawValue = try container.decode(String.self, forKey: .rawValue)

        if rawValue == "unmounted" {
            self = .unmounted
        } else if rawValue == "mounting" {
            self = .mounting
        } else if rawValue == "mounted" {
            self = .mounted
        } else if rawValue == "unmounting" {
            self = .unmounting
        } else if rawValue.hasPrefix("error:") {
            self = .error(String(rawValue.dropFirst(6)))
        } else {
            self = .unmounted
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        let rawValue: String
        switch self {
        case .unmounted: rawValue = "unmounted"
        case .mounting: rawValue = "mounting"
        case .mounted: rawValue = "mounted"
        case .unmounting: rawValue = "unmounting"
        case .error(let message): rawValue = "error:\(message)"
        }
        try container.encode(rawValue, forKey: .rawValue)
    }
}

// MARK: - Bucket Info

/// Information about a cloud storage bucket
public struct BucketInfo: Codable, Identifiable, Equatable {
    public let id: String
    public let name: String
    public let location: String
    public let storageClass: String
    public let createdAt: Date?
    public var sizeBytes: Int64?

    public init(
        id: String,
        name: String,
        location: String = "US",
        storageClass: String = "STANDARD",
        createdAt: Date? = nil,
        sizeBytes: Int64? = nil
    ) {
        self.id = id
        self.name = name
        self.location = location
        self.storageClass = storageClass
        self.createdAt = createdAt
        self.sizeBytes = sizeBytes
    }

    public static func == (lhs: BucketInfo, rhs: BucketInfo) -> Bool {
        lhs.id == rhs.id
    }
}
