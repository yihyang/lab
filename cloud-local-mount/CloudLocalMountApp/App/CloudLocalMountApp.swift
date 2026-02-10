//
//  CloudLocalMountApp.swift
//  CloudLocalMountApp
//
//  Main entry point for the CloudLocalMount GUI app.
//

import SwiftUI

@main
struct CloudLocalMountApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        // Empty scene - we use menu bar item instead of a window
        Settings {
            SettingsView()
        }
    }
}
