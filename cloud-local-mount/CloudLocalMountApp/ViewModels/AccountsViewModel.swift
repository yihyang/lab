//
//  AccountsViewModel.swift
//  CloudLocalMountApp
//
//  View model for managing cloud storage accounts.
//

import Foundation
import Combine

class AccountsViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var accounts: [CloudAccount] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: - Private Properties

    private let accountsFile: URL
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Init

    init() {
        // Get app support directory for accounts storage
        let appSupportURL = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        )[0]
        let appDirectory = appSupportURL.appendingPathComponent("CloudLocalMount")

        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(
            at: appDirectory,
            withIntermediateDirectories: true
        )

        self.accountsFile = appDirectory.appendingPathComponent("accounts.json")

        loadAccounts()
    }

    // MARK: - Public Methods

    /// Add a new cloud account
    func addAccount() {
        Logger.shared.info("Add account requested", category: .ui)

        // TODO: Show account configuration sheet/dialog
        // For now, this is a placeholder
        errorMessage = "Account configuration not yet implemented"

        // Clear error after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.errorMessage = nil
        }
    }

    /// Edit an existing account
    func editAccount(_ account: CloudAccount) {
        Logger.shared.info("Edit account: \(account.name)", category: .ui)

        // TODO: Show account edit sheet/dialog
        errorMessage = "Account editing not yet implemented"

        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.errorMessage = nil
        }
    }

    /// Remove an account
    func removeAccount(_ account: CloudAccount) {
        Logger.shared.info("Remove account: \(account.name)", category: .ui)

        // Unmount all buckets for this account first
        for bucket in account.mountedBuckets {
            unmountBucket(bucket, from: account)
        }

        // Remove account
        accounts.removeAll { $0.id == account.id }

        // Save to disk
        saveAccounts()

        Logger.shared.info("Account removed: \(account.name)", category: .ui)
    }

    /// Mount a bucket
    func mountBucket(_ bucket: BucketInfo, from account: CloudAccount) async {
        Logger.shared.info("Mount bucket: \(bucket.name)", category: .ui)

        let mountPath = defaultMountPath(for: bucket.name)

        do {
            try await DaemonClient.shared.mountBucket(
                bucketName: bucket.name,
                for: account,
                at: mountPath
            )

            let mountedBucket = MountedBucket(
                bucketName: bucket.name,
                mountPath: mountPath,
                autoMount: false
            )

            // Update account
            if let index = accounts.firstIndex(where: { $0.id == account.id }) {
                accounts[index].mountedBuckets.append(mountedBucket)
                saveAccounts()
            }

            Logger.shared.info("Bucket mounted successfully: \(bucket.name)", category: .ui)
        } catch {
            Logger.shared.error("Failed to mount bucket: \(error.localizedDescription)", category: .ui)
            errorMessage = "Failed to mount bucket: \(error.localizedDescription)"
        }
    }

    /// Unmount a bucket
    func unmountBucket(_ bucket: MountedBucket, from account: CloudAccount) async {
        Logger.shared.info("Unmount bucket: \(bucket.bucketName)", category: .ui)

        do {
            try await DaemonClient.shared.unmountBucket(at: bucket.mountPath)

            // Update account
            if let index = accounts.firstIndex(where: { $0.id == account.id }) {
                accounts[index].mountedBuckets.removeAll { $0.id == bucket.id }
                saveAccounts()
            }

            Logger.shared.info("Bucket unmounted successfully: \(bucket.bucketName)", category: .ui)
        } catch {
            Logger.shared.error("Failed to unmount bucket: \(error.localizedDescription)", category: .ui)
            errorMessage = "Failed to unmount bucket: \(error.localizedDescription)"
        }
    }

    // MARK: - Private Methods

    /// Load accounts from disk
    private func loadAccounts() {
        guard FileManager.default.fileExists(atPath: accountsFile.path) else {
            Logger.shared.info("No accounts file found, starting fresh", category: .ui)
            return
        }

        do {
            let data = try Data(contentsOf: accountsFile)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601

            accounts = try decoder.decode([CloudAccount].self, from: data)
            Logger.shared.info("Loaded \(accounts.count) accounts", category: .ui)
        } catch {
            Logger.shared.error("Failed to load accounts: \(error)", category: .ui)
            errorMessage = "Failed to load accounts: \(error.localizedDescription)"
        }
    }

    /// Save accounts to disk
    private func saveAccounts() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

            let data = try encoder.encode(accounts)
            try data.write(to: accountsFile)

            Logger.shared.info("Saved \(accounts.count) accounts", category: .ui)
        } catch {
            Logger.shared.error("Failed to save accounts: \(error)", category: .ui)
            errorMessage = "Failed to save accounts: \(error.localizedDescription)"
        }
    }

    /// Get default mount path for a bucket
    private func defaultMountPath(for bucketName: String) -> String {
        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        let mountlyDir = homeDir.appendingPathComponent("CloudLocalMount")
        let bucketDir = mountlyDir.appendingPathComponent(bucketName)

        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(
            at: bucketDir,
            withIntermediateDirectories: true
        )

        return bucketDir.path
    }
}
