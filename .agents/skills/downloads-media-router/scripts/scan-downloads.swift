import Foundation
import Vision
import AppKit

let downloadDir = URL(fileURLWithPath: NSString(string: "~/Downloads").expandingTildeInPath)
let fileManager = FileManager.default
let exts = Set(["png", "jpg", "jpeg", "webp", "gif", "avif"])

guard let enumerator = fileManager.enumerator(
    at: downloadDir,
    includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey],
    options: [.skipsHiddenFiles, .skipsPackageDescendants]
) else {
    fputs("Error: Unable to enumerate ~/Downloads\n", stderr)
    exit(1)
}

var files: [(url: URL, date: Date, size: Int64)] = []

while let fileURL = enumerator.nextObject() as? URL {
    if enumerator.level > 2 {
        enumerator.skipDescendants()
        continue
    }
    let ext = fileURL.pathExtension.lowercased()
    if exts.contains(ext) {
        let values = try? fileURL.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey])
        let date = values?.contentModificationDate ?? Date.distantPast
        let size = Int64(values?.fileSize ?? 0)
        files.append((fileURL, date, size))
    }
}

files.sort { $0.date > $1.date }

for item in files {
    let filename = item.url.lastPathComponent
    autoreleasepool {
        guard let img = NSImage(contentsOf: item.url),
              let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            print("[\(filename)] (no image or decode error)")
            fflush(stdout)
            return
        }

        let reqHandler = VNImageRequestHandler(cgImage: cg, options: [:])
        let req = VNRecognizeTextRequest()
        req.recognitionLevel = .fast

        do {
            try reqHandler.perform([req])
            let lines = (req.results ?? []).prefix(15).compactMap { $0.topCandidates(1).first?.string }
            let summary = lines.joined(separator: " // ")
            print("[\(filename)] \(summary)")
        } catch {
            print("[\(filename)] (error: \(error))")
        }
        fflush(stdout)
    }
}
