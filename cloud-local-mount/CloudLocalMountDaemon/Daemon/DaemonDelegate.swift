//
//  DaemonDelegate.swift
//  CloudLocalMountDaemon
//
//  XPC listener delegate for the daemon.
//

import Foundation
import OSLog

let logger = Logger(subsystem: "com.cloudlocalmount.daemon", category: "XPC")

/// Delegate for handling XPC connections to the daemon
class DaemonDelegate: NSObject, NSXPCListenerDelegate {
    // MARK: - NSXPCListenerDelegate

    func listener(_ listener: NSXPCListener, shouldAcceptNewConnection newConnection: NSXPCConnection) -> Bool {
        logger.info("Accepting new XPC connection")

        // Configure the connection
        newConnection.exportedInterface = NSXPCInterface(with: DaemonProtocol.self)
        newConnection.exportedObject = DaemonService.shared

        // Set up remote object interface (for callbacks to app)
        newConnection.remoteObjectInterface = NSXPCInterface(with: AppDelegateProtocol.self)

        // Activate the connection
        newConnection.resume()

        logger.info("XPC connection established and activated")

        return true
    }
}
