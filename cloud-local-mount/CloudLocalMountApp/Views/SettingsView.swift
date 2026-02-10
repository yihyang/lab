//
//  SettingsView.swift
//  CloudLocalMountApp
//
//  Main settings view for the CloudLocalMount app.
//

import SwiftUI

struct SettingsView: View {
    @State private var selectedTab: SettingsTab = .accounts

    enum SettingsTab: String, CaseIterable {
        case accounts = "Accounts"
        case buckets = "Buckets"
        case cache = "Cache"
        case about = "About"

        var icon: String {
            switch self {
            case .accounts: return "person.2"
            case .buckets: return "archivebox"
            case .cache: return "externaldrive"
            case .about: return "info.circle"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            AccountsView()
                .tag(SettingsTab.accounts)
                .tabItem {
                    Label("Accounts", systemImage: SettingsTab.accounts.icon)
                }

            Text("Buckets management coming soon")
                .tag(SettingsTab.buckets)
                .tabItem {
                    Label("Buckets", systemImage: SettingsTab.buckets.icon)
                }

            CacheSettingsView()
                .tag(SettingsTab.cache)
                .tabItem {
                    Label("Cache", systemImage: SettingsTab.cache.icon)
                }

            AboutView()
                .tag(SettingsTab.about)
                .tabItem {
                    Label("About", systemImage: SettingsTab.about.icon)
                }
        }
        .frame(width: 700, height: 500)
    }
}

// MARK: - Cache Settings View

struct CacheSettingsView: View {
    @AppStorage("cacheMaxSizeGB") private var maxSizeGB: Int = 10
    @AppStorage("cacheLocation") private var cacheLocation: String = defaultCachePath()

    private static func defaultCachePath() -> String {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("com.cloudlocalmount")
            .path
    }

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Text("Cache Settings")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
            }
            .padding(.horizontal)

            Form {
                // Max cache size
                HStack {
                    Text("Maximum cache size:")
                        .frame(width: 150, alignment: .leading)
                    Picker("", selection: $maxSizeGB) {
                        ForEach([1, 2, 5, 10, 20, 50, 100], id: \.self) { size in
                            Text("\(size) GB").tag(size)
                        }
                    }
                    .frame(width: 120)
                }

                // Cache location
                HStack {
                    Text("Cache location:")
                        .frame(width: 150, alignment: .leading)
                    TextField("", text: $cacheLocation)
                        .disabled(true)
                    Button("Choose...") {
                        // TODO: Implement folder picker
                    }
                    .buttonStyle(.bordered)
                }

                // Cache info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Cache Information")
                        .font(.headline)
                    HStack {
                        Text("Current size:")
                        Text("Calculating...")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Location:")
                        Text(cacheLocation)
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                }
                .padding(.top, 8)

                // Clear cache button
                HStack {
                    Button("Clear Cache") {
                        // TODO: Implement clear cache via daemon
                        Logger.shared.info("Clear cache requested", category: .cache)
                    }
                    .buttonStyle(.bordered)
                    Spacer()
                }
            }
            .padding()
        }
        .padding()
    }
}

// MARK: - About View

struct AboutView: View {
    var body: some View {
        VStack(spacing: 20) {
            // App icon
            Image(systemName: "cloud.fill")
                .font(.system(size: 64))
                .foregroundColor(.accentColor)

            // App name and version
            Text("CloudLocalMount")
                .font(.title)
                .fontWeight(.bold)
            Text("Version 0.1.0")
                .font(.caption)
                .foregroundColor(.secondary)

            // Description
            VStack(alignment: .leading, spacing: 8) {
                Text("Mount cloud storage buckets as local filesystems")
                    .foregroundColor(.secondary)
                Text("Supports Google Cloud Storage")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: 300)

            Spacer()

            // Links
            VStack(spacing: 8) {
                Link("GitHub Repository", destination: URL(string: "https://github.com")!)
                    .font(.caption)
                Text("© 2025 CloudLocalMount")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    SettingsView()
}
