/**
 * Product image registry.
 *
 * products.json stores image *filenames*; Vite needs a real import to fingerprint
 * and bundle each asset. This is the one place that mapping lives — previously it
 * was duplicated in ProductDetails and CollectionSection, which meant adding a
 * photo required editing two files.
 */
import novaWhiteImg from "@/assets/nova-white-img.png";
import speedRopeNovaImg from "@/assets/speed-rope-nova-img.jpg";
import novaWhiteComparison from "@/assets/nova-white-comparison.jpg";
import aetherDottedImg from "@/assets/aether-dotted-img.jpeg";
import aetherDottedDetailsImg from "@/assets/aether-dotted-details-img.jpeg";
import beadedRopeAetherImg from "@/assets/beaded-rope-aether-img.jpg";
import aetherComparison from "@/assets/aether-comparison.jpg";
import comboPackageImg from "@/assets/combo-package-visual.png";
import flareImg from "@/assets/flare-red-img.jpg";
import umbraImg from "@/assets/umbra-black-img.jpg";
import nocturneImg from "@/assets/nocturne-black-img.jpg";
import vesperImg from "@/assets/vesper-blue-img.jpeg";
import speedDuoVisual from "@/assets/speed-duo-visual.jpg";
import beadedDuoVisual from "@/assets/beaded-duo-visual.jpg";

const IMAGE_MAP: Record<string, string> = {
  "nova-white-img.png": novaWhiteImg,
  "speed-rope-nova-img.jpg": speedRopeNovaImg,
  "nova-white-comparison.jpg": novaWhiteComparison,
  "aether-dotted-img.jpeg": aetherDottedImg,
  "aether-dotted-details-img.jpeg": aetherDottedDetailsImg,
  "beaded-rope-aether-img.jpg": beadedRopeAetherImg,
  "aether-comparison.jpg": aetherComparison,
  "combo-package-visual.png": comboPackageImg,
  "flare-red-img.jpg": flareImg,
  "umbra-black-img.jpg": umbraImg,
  "nocturne-black-img.jpg": nocturneImg,
  "vesper-blue-img.jpeg": vesperImg,
  "speed-duo-visual.jpg": speedDuoVisual,
  "beaded-duo-visual.jpg": beadedDuoVisual,
};

/** Resolves a products.json filename to its bundled URL. */
export function resolveProductImage(fileName?: string): string | undefined {
  return fileName ? IMAGE_MAP[fileName] : undefined;
}
