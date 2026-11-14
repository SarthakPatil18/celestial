import Foundation
import Vision
import AppKit

struct Item: Codable {
    let text: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
    let conf: Double
}

let args = CommandLine.arguments
guard args.count > 1 else { print("usage: ocr <file>"); exit(1) }
let url = URL(fileURLWithPath: args[1])
guard let image = NSImage(contentsOf: url), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("cannot load"); exit(1)
}
let W = Double(cg.width), H = Double(cg.height)
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.minimumTextHeight = 0.006
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try? handler.perform([request])
var items: [Item] = []
if let results = request.results {
    for obs in results {
        guard let cand = obs.topCandidates(1).first else { continue }
        let bb = obs.boundingBox
        items.append(Item(
            text: cand.string,
            x: Double(bb.minX) * W,
            y: Double(1 - bb.maxY) * H,
            w: Double(bb.width) * W,
            h: Double(bb.height) * H,
            conf: Double(cand.confidence)
        ))
    }
}
items.sort { a, b in abs(a.y - b.y) < 10 ? a.x < b.x : a.y < b.y }
let enc = JSONEncoder()
enc.outputFormatting = [.prettyPrinted, .withoutEscapingSlashes]
if let data = try? enc.encode(items), let s = String(data: data, encoding: .utf8) { print(s) }
