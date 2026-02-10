//
//  AppDelegate.swift
//  CloudLocalMountApp
//
//  Application delegate for CloudLocalMount.
//

import Cocoa
import SwiftUI

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var statusItemViewModel: StatusItemViewModel?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Don't show main window - we use menu bar only
        NSApp.setActivationPolicy(.accessory)

        // Set up status item (menu bar icon)
        setupStatusItem()

        Logger.shared.info("CloudLocalMount app launched", category: .ui)
    }

    func applicationWillTerminate(_ notification: Notification) {
        Logger.shared.info("CloudLocalMount app terminating", category: .ui)

        // Clean up
        statusItem = nil
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Don't terminate when settings window is closed
        return false
    }

    // MARK: - Status Item Setup

    private func setupStatusItem() {
        // Create status item in menu bar
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "cloud.fill", accessibilityDescription: "CloudLocalMount")
            button.image?.isTemplate = true
        }

        // Create view model and set up menu
        let viewModel = StatusItemViewModel()
        self.statusItemViewModel = viewModel

        if let statusItem = statusItem {
            statusItem.menu = viewModel.buildMenu()
        }

        Logger.shared.info("Status item setup complete", category: .ui)
    }

    // MARK: - Public Methods

    /// Show the main settings window
    func showSettings() {
        if let window = NSApp.windows.first {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }
}
