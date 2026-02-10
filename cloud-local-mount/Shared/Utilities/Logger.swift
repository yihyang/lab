//
//  Logger.swift
//  CloudLocalMount
//
//  Logging utility for the cloud-local-mount app.
//

import Foundation
import os.log

/// Shared logger for the cloud-local-mount app
public class Logger {
    // MARK: - Singleton

    public static let shared = Logger()

    // MARK: - Properties

    private let subsystem = "com.cloudlocalmount"

    private var loggers: [String: OSLog] = [:]

    // MARK: - Log Categories

    public enum Category: String {
        case general = "General"
        case xpc = "XPC"
        case fuse = "FUSE"
        case gcs = "GCS"
        case cache = "Cache"
        case ui = "UI"
        case auth = "Auth"
    }

    // MARK: - Log Levels

    public enum Level {
        case debug
        case info
        case warning
        case error

        var osLogType: OSLogType {
            switch self {
            case .debug: return .debug
            case .info: return .info
            case .warning: return .default
            case .error: return .error
            }
        }
    }

    // MARK: - Private Init

    private init() {}

    // MARK: - Public Methods

    /// Get or create an OSLog for the given category
    private func log(for category: Category) -> OSLog {
        if let logger = loggers[category.rawValue] {
            return logger
        }
        let logger = OSLog(subsystem: subsystem, category: category.rawValue)
        loggers[category.rawValue] = logger
        return logger
    }

    /// Log a debug message
    public func debug(_ message: String, category: Category = .general) {
        log(message, level: .debug, category: category)
    }

    /// Log an info message
    public func info(_ message: String, category: Category = .general) {
        log(message, level: .info, category: category)
    }

    /// Log a warning message
    public func warning(_ message: String, category: Category = .general) {
        log(message, level: .warning, category: category)
    }

    /// Log an error message
    public func error(_ message: String, category: Category = .general) {
        log(message, level: .error, category: category)
    }

    /// Log a message at the specified level
    public func log(_ message: String, level: Level = .info, category: Category = .general) {
        #if DEBUG
        // In debug builds, always log to console with timestamp
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let levelStr = "\(level)".uppercased()
        let categoryStr = category.rawValue
        print("[\(timestamp)] [\(levelStr)] [\(categoryStr)] \(message)")
        #endif

        os_log("%{public}@", log: log(for: category), type: level.osLogType, message)
    }
}

// MARK: - Convenience Extensions

public extension Logger {
    /// Log an error object
    func error(_ error: Error, category: Category = .general) {
        self.error("\(error.localizedDescription)", category: category)
    }

    /// Log with file and line information (useful for debugging)
    func log(
        _ message: String,
        level: Level = .info,
        category: Category = .general,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let filename = (file as NSString).lastPathComponent
        let enhancedMessage = "[\(filename):\(line)] \(function) - \(message)"
        self.log(enhancedMessage, level: level, category: category)
    }
}
