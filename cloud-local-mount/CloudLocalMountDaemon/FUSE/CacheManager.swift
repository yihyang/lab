//
//  CacheManager.swift
//  CloudLocalMountDaemon
//
//  Manages local caching of cloud storage objects.
//

import Foundation
import OSLog
import CryptoKit

let logger = Logger(subsystem: "com.cloudlocalmount.daemon", category: "Cache")

/// Manager for caching cloud storage objects locally
class CacheManager {
    // MARK: - Properties

    private let cacheDirectory: URL
    private let maxCacheSizeBytes: Int64

    // MARK: - Init

    init(maxSizeGB: Int = 10) {
        // Set up cache directory
        let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        self.cacheDirectory = cachesDir.appendingPathComponent("com.cloudlocalmount")
        self.maxCacheSizeBytes = Int64(maxSizeGB) * 1024 * 1024 * 1024

        // Create cache directory if needed
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)

        logger.info("CacheManager initialized at: \(cacheDirectory.path)")
    }

    // MARK: - Public Methods

    /// Get cached data for a bucket/object key
    func getCachedData(bucket: String, key: String) -> Data? {
        let cachePath = cachePath(for: bucket, key: key)

        guard FileManager.default.fileExists(atPath: cachePath.path) else {
            logger.debug("Cache miss: \(bucket)/\(key)")
            return nil
        }

        do {
            let data = try Data(contentsOf: cachePath)
            logger.debug("Cache hit: \(bucket)/\(key) (\(data.count) bytes)")

            // Update access time for LRU
            try? FileManager.default.setAttributes([.modificationDate: Date()], ofItemAtPath: cachePath.path)

            return data
        } catch {
            logger.error("Failed to read cached data: \(error.localizedDescription)")
            return nil
        }
    }

    /// Cache data for a bucket/object key
    func cacheData(bucket: String, key: String, data: Data) {
        let cachePath = cachePath(for: bucket, key: key)

        do {
            // Create bucket directory if needed
            let bucketDir = cachePath.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: bucketDir, withIntermediateDirectories: true)

            // Write data to cache
            try data.write(to: cachePath)

            logger.debug("Cached: \(bucket)/\(key) (\(data.count) bytes)")

            // Check if we need to evict old items
            checkCacheSize()
        } catch {
            logger.error("Failed to cache data: \(error.localizedDescription)")
        }
    }

    /// Remove cached data for a bucket/object key
    func removeCachedData(bucket: String, key: String) {
        let cachePath = cachePath(for: bucket, key: key)

        guard FileManager.default.fileExists(atPath: cachePath.path) else {
            return
        }

        do {
            try FileManager.default.removeItem(at: cachePath)
            logger.debug("Removed from cache: \(bucket)/\(key)")
        } catch {
            logger.error("Failed to remove cached data: \(error.localizedDescription)")
        }
    }

    /// Remove all cached data for a bucket
    func removeBucketCache(bucket: String) {
        let bucketDir = cacheDirectory.appendingPathComponent(bucket)

        guard FileManager.default.fileExists(atPath: bucketDir.path) else {
            return
        }

        do {
            try FileManager.default.removeItem(at: bucketDir)
            logger.info("Removed bucket cache: \(bucket)")
        } catch {
            logger.error("Failed to remove bucket cache: \(error.localizedDescription)")
        }
    }

    /// Clear all cached data
    func clearCache() throws {
        let contents = try FileManager.default.contentsOfDirectory(
            at: cacheDirectory,
            includingPropertiesForKeys: nil
        )

        for item in contents {
            try FileManager.default.removeItem(at: item)
        }

        logger.info("Cleared all cache")
    }

    /// Get cache statistics
    func getStats() -> (sizeBytes: Int64, fileCount: Int) {
        var totalSize: Int64 = 0
        var fileCount = 0

        guard FileManager.default.fileExists(atPath: cacheDirectory.path) else {
            return (0, 0)
        }

        if let enumerator = FileManager.default.enumerator(at: cacheDirectory, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let fileURL as URL in enumerator {
                if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resourceValues.fileSize {
                    totalSize += Int64(fileSize)
                    fileCount += 1
                }
            }
        }

        return (totalSize, fileCount)
    }

    // MARK: - Private Methods

    /// Generate cache path for a bucket/object key
    private func cachePath(for bucket: String, key: String) -> {
        let bucketDir = cacheDirectory.appendingPathComponent(bucket)

        // Use SHA256 hash of object key as filename to handle special characters
        let hash = SHA256.hash(data: Data(key.utf8))
        let hashString = hash.compactMap { String(format: "%02x", $0) }.joined()

        return bucketDir.appendingPathComponent(hashString)
    }

    /// Check cache size and evict old items if needed
    private func checkCacheSize() {
        let (currentSize, _) = getStats()

        if currentSize > maxCacheSizeBytes {
            logger.info("Cache size (\(currentSize) bytes) exceeds limit (\(maxCacheSizeBytes) bytes), evicting old items")
            evictLRUItems(targetSize: Int64(Double(maxCacheSizeBytes) * 0.9)) // Evict to 90% of limit
        }
    }

    /// Evict least recently used items to reduce cache size
    private func evictLRUItems(targetSize: Int64) {
        var items: [(URL, Date)] = []

        // Collect all cached files with modification dates
        if let enumerator = FileManager.default.enumerator(at: cacheDirectory, includingPropertiesForKeys: [.modificationDateKey]) {
            for case let fileURL as URL in enumerator {
                if let resourceValues = try? fileURL.resourceValues(forKeys: [.modificationDateKey]),
                   let modDate = resourceValues.modificationDate {
                    items.append((fileURL, modDate))
                }
            }
        }

        // Sort by modification date (oldest first)
        items.sort { $0.1 < $0.1 }

        // Remove oldest items until we're under target size
        var currentSize = getStats().sizeBytes
        for (fileURL, _) in items {
            if currentSize <= targetSize {
                break
            }

            if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
               let fileSize = resourceValues.fileSize {
                do {
                    try FileManager.default.removeItem(at: fileURL)
                    currentSize -= Int64(fileSize)
                    logger.debug("Evicted cache item: \(fileURL.lastPathComponent)")
                } catch {
                    logger.error("Failed to evict cache item: \(error.localizedDescription)")
                }
            }
        }

        logger.info("Cache eviction complete, new size: \(getStats().sizeBytes) bytes")
    }
}
