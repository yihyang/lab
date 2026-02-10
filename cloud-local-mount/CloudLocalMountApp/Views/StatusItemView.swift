//
//  StatusItemView.swift
//  CloudLocalMountApp
//
//  Menu bar status item view model and menu builder.
//

import SwiftUI

// MARK: - Status Item View Model

class StatusItemViewModel: ObservableObject {
    @Published var accounts: [CloudAccount] = []
    @Published var mountedBuckets: [MountedBucket] = []

    private let appDelegate: AppDelegate?

    init(appDelegate: AppDelegate? = nil) {
        self.appDelegate = appDelegate
        loadAccounts()
    }

    // MARK: - Menu Building

    func buildMenu() -> NSMenu {
        let menu = NSMenu()

        // App header
        let headerItem = NSMenuItem()
        headerItem.title = "CloudLocalMount"
        headerItem.isEnabled = false
        menu.addItem(headerItem)

        menu.addItem(NSMenuItem.separator())

        // Mounted buckets section
        if !mountedBuckets.isEmpty {
            let mountsHeader = NSMenuItem()
            mountsHeader.title = "Mounted Buckets"
            mountsHeader.isEnabled = false
            menu.addItem(mountsHeader)

            for bucket in mountedBuckets {
                let bucketItem = NSMenuItem(
                    title: bucket.bucketName,
                    action: #selector(openMountPoint(_:)),
                    keyEquivalent: ""
                )
                bucketItem.target = self
                bucketItem.representedObject = bucket
                menu.addItem(bucketItem)
            }

            menu.addItem(NSMenuItem.separator())
        }

        // Accounts section
        if !accounts.isEmpty {
            for account in accounts {
                let accountItem = NSMenuItem(
                    title: account.name,
                    action: nil,
                    keyEquivalent: ""
                )
                accountItem.isEnabled = false
                menu.addItem(accountItem)

                // Show bucket count for this account
                let countItem = NSMenuItem()
                countItem.title = "  \(account.mountedBuckets.count) buckets mounted"
                countItem.indentationLevel = 1
                countItem.isEnabled = false
                menu.addItem(countItem)
            }

            menu.addItem(NSMenuItem.separator())
        }

        // Actions
        menu.addItem(withTitle: "Open Settings...", action: #selector(openSettings), keyEquivalent: ",")
        menu.addItem(withTitle: "Check for Updates...", action: nil, keyEquivalent: "")

        menu.addItem(NSMenuItem.separator())

        menu.addItem(withTitle: "Quit CloudLocalMount", action: #selector(quitApp), keyEquivalent: "q")

        // Set action targets
        menu.items.forEach { item in
            if item.action == #selector(openSettings) ||
               item.action == #selector(quitApp) {
                item.target = self
            }
        }

        return menu
    }

    // MARK: - Actions

    @objc private func openSettings() {
        NSApp.setActivationPolicy(.regular)
        appDelegate?.showSettings()
    }

    @objc private func openMountPoint(_ sender: NSMenuItem) {
        guard let bucket = sender.representedObject as? MountedBucket else { return }

        // Open the mount point in Finder
        let url = URL(fileURLWithPath: bucket.mountPath)
        NSWorkspace.shared.activateFileViewerSelecting([url])

        Logger.shared.info("Opened mount point: \(bucket.mountPath)", category: .ui)
    }

    @objc private func quitApp() {
        NSApplication.shared.terminate(nil)
    }

    // MARK: - Data Loading

    private func loadAccounts() {
        // TODO: Load accounts from persistence
        // For now, use empty array
        accounts = []
        mountedBuckets = []
    }
}

// MARK: - Status Item Menu View (SwiftUI Alternative)

struct StatusItemMenuView: View {
    @ObservedObject var viewModel: StatusItemViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Text("CloudLocalMount")
                .font(.headline)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)

            Divider()

            // Mounted buckets
            if !viewModel.mountedBuckets.isEmpty {
                ForEach(viewModel.mountedBuckets) { bucket in
                    Button(action: { viewModel.openBucket(bucket) }) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text(bucket.bucketName)
                            Spacer()
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                    }
                    .buttonStyle(.plain)
                }
                Divider()
            }

            // Accounts
            if !viewModel.accounts.isEmpty {
                ForEach(viewModel.accounts) { account in
                    HStack {
                        Text(account.name)
                            .font(.caption)
                        Spacer()
                        Text("\(account.mountedBuckets.count) mounted")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                }
                Divider()
            }

            // Actions
            Button(action: { viewModel.openSettings() }) {
                HStack {
                    Text("Open Settings...")
                    Spacer()
                    Text("⌘,")
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }
            .buttonStyle(.plain)

            Divider()

            Button(action: { viewModel.quit() }) {
                HStack {
                    Text("Quit CloudLocalMount")
                    Spacer()
                    Text("⌘Q")
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }
            .buttonStyle(.plain)
        }
        .frame(width: 220)
    }
}

// MARK: - StatusItemViewModel Extensions

extension StatusItemViewModel {
    func openBucket(_ bucket: MountedBucket) {
        let url = URL(fileURLWithPath: bucket.mountPath)
        NSWorkspace.shared.activateFileViewerSelecting([url])
        Logger.shared.info("Opened mount point: \(bucket.mountPath)", category: .ui)
    }

    func openSettings() {
        if let appDelegate = NSApp.delegate as? AppDelegate {
            NSApp.setActivationPolicy(.regular)
            appDelegate.showSettings()
        }
    }

    func quit() {
        NSApplication.shared.terminate(nil)
    }
}
