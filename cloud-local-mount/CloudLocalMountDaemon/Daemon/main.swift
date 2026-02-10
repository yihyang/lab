//
//  main.swift
//  CloudLocalMountDaemon
//
//  Main entry point for the CloudLocalMount daemon (XPC service).
//

import Foundation
import OSLog

let logger = Logger(subsystem: "com.cloudlocalmount.daemon", category: "Main")

// MARK: - Main Entry Point

/// Main function for the daemon
func main() -> Int32 {
    logger.info("CloudLocalMountDaemon starting...")

    // Set up the XPC service
    let listener = NSXPCListener.service()
    let delegate = DaemonDelegate()

    listener.delegate = delegate
    listener.resume()

    logger.info("CloudLocalMountDaemon is listening for XPC connections")

    // Run the run loop
    RunLoop.current.run()

    return 0
}

// Run the daemon
_ = main()
