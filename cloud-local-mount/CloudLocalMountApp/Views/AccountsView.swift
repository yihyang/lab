//
//  AccountsView.swift
//  CloudLocalMountApp
//
//  View for managing cloud storage accounts.
//

import SwiftUI

struct AccountsView: View {
    @StateObject private var viewModel = AccountsViewModel()

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Text("Connected Accounts")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
            }
            .padding(.horizontal)

            // Accounts list
            if viewModel.accounts.isEmpty {
                emptyStateView
            } else {
                accountsListView
            }

            // Add account button
            Button(action: viewModel.addAccount) {
                Label("Add Account", systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(minWidth: 500, minHeight: 400)
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "cloud.slash")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No Accounts Connected")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Add a cloud storage account to get started")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var accountsListView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.accounts) { account in
                    AccountCard(account: account)
                        .contextMenu {
                            Button("Edit", action: { viewModel.editAccount(account) })
                            Divider()
                            Button("Remove", role: .destructive, action: { viewModel.removeAccount(account) })
                        }
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Account Card

struct AccountCard: View {
    let account: CloudAccount

    var body: some View {
        HStack(spacing: 16) {
            // Provider icon
            Image(systemName: providerIcon)
                .font(.system(size: 32))
                .foregroundColor(.accentColor)
                .frame(width: 48, height: 48)

            // Account info
            VStack(alignment: .leading, spacing: 4) {
                Text(account.name)
                    .font(.headline)
                Text(account.provider.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Bucket count badge
            if !account.mountedBuckets.isEmpty {
                Text("\(account.mountedBuckets.count) buckets")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.accentColor.opacity(0.1))
                    .foregroundColor(.accentColor)
                    .cornerRadius(8)
            }

            // Configure button
            Button(action: {}) {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }

    private var providerIcon: String {
        switch account.provider {
        case .googleCloud: return "cloud"
        case .awsS3: return "arrow.up.arrow.down"
        }
    }
}

#Preview {
    AccountsView()
}
