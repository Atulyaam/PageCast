import { describe, it, expect } from "vitest";
import {
  hashSentence,
  segmentSentences,
  createSourceSentences,
} from "@/server/ingestion/sentence-ids";

describe("Sentence Segmentation & Provenance Suite", () => {
  it("produces deterministic 8-character SHA-256 hashes", () => {
    const hash1 = hashSentence("Teletext is back in 2026.");
    const hash2 = hashSentence("Teletext is back in 2026.");
    const hashDiff = hashSentence("Different content.");

    expect(hash1.length).toBe(8);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
  });

  it("segments standard English text across punctuation boundaries", () => {
    const text =
      "PageCast resurrects Teletext. It delivers news under 10 KiB! Can it survive offline? Absolutely.";
    const sentences = segmentSentences(text, "en");

    expect(sentences.length).toBe(4);
    expect(sentences[0]).toContain("PageCast resurrects Teletext");
    expect(sentences[1]).toContain("It delivers news under 10 KiB");
    expect(sentences[2]).toContain("Can it survive offline");
    expect(sentences[3]).toContain("Absolutely");
  });

  it("segments Hindi Devanagari text using danda (।) and double danda (॥) punctuation", () => {
    const hindi =
      "पेजकास्ट एक नया प्लेटफॉर्म है। यह पूरी तरह ऑफलाइन चलता है। क्या यह सुरक्षित है? हाँ बिलकुल।";
    const sentences = segmentSentences(hindi, "hi");

    expect(sentences.length).toBe(4);
    expect(sentences[0]).toBe("पेजकास्ट एक नया प्लेटफॉर्म है।");
    expect(sentences[1]).toBe("यह पूरी तरह ऑफलाइन चलता है।");
    expect(sentences[2]).toBe("क्या यह सुरक्षित है?");
    expect(sentences[3]).toBe("हाँ बिलकुल।");
  });

  it("generates sequential SourceSentence objects with stable IDs and hashes", () => {
    const text = "First sentence here. Second sentence follows.";
    const sourceSentences = createSourceSentences(text, "en", "s");

    expect(sourceSentences.length).toBe(2);
    expect(sourceSentences[0].id).toBe("s1");
    expect(sourceSentences[0].index).toBe(0);
    expect(sourceSentences[0].hash.length).toBe(8);

    expect(sourceSentences[1].id).toBe("s2");
    expect(sourceSentences[1].index).toBe(1);
    expect(sourceSentences[1].hash.length).toBe(8);
  });

  it("handles empty or whitespace-only strings gracefully", () => {
    expect(segmentSentences("")).toEqual([]);
    expect(segmentSentences("   \n\n   ")).toEqual([]);
    expect(createSourceSentences("")).toEqual([]);
  });
});
