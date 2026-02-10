// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "CloudLocalMount",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "CloudLocalMountShared",
            targets: ["CloudLocalMountShared"]),
    ],
    dependencies: [
        // Google Cloud Storage Swift SDK
        .package(
            url: "https://github.com/googleapis/google-cloud-storage-swift",
            from: "1.0.0"
        ),
        // SwiftLog for logging
        .package(
            url: "https://github.com/apple/swift-log",
            from: "1.5.0"
        ),
    ],
    targets: [
        .target(
            name: "CloudLocalMountShared",
            dependencies: [
                .product(name: "GoogleCloudStorage", package: "google-cloud-storage-swift"),
                .product(name: "Logging", package: "swift-log"),
            ],
            path: "Shared"
        ),
    ]
)
