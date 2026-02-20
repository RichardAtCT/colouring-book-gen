import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
} as const;

export interface BookCompileOptions {
  pageSize: "A4" | "Letter";
  includePageNumbers: boolean;
  includeFooter: boolean;
  footerText: string;
  coverImageBytes?: Buffer;
}

export interface BookPageData {
  imageBytes: Buffer;
  pageNumber: number;
}

export async function compileBook(
  title: string,
  pages: BookPageData[],
  options: BookCompileOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const { width, height } = PAGE_SIZES[options.pageSize];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Cover page
  const coverPage = pdfDoc.addPage([width, height]);

  if (options.coverImageBytes) {
    // Cover with image + text overlay
    let coverImage;
    try {
      coverImage = await pdfDoc.embedPng(options.coverImageBytes);
    } catch {
      coverImage = await pdfDoc.embedJpg(options.coverImageBytes);
    }

    const coverMargin = 24;
    const maxCoverW = width - 2 * coverMargin;
    const maxCoverH = height - 2 * coverMargin;
    const coverScale = Math.min(maxCoverW / coverImage.width, maxCoverH / coverImage.height);
    const drawCoverW = coverImage.width * coverScale;
    const drawCoverH = coverImage.height * coverScale;
    const coverX = (width - drawCoverW) / 2;
    const coverY = (height - drawCoverH) / 2;

    coverPage.drawImage(coverImage, {
      x: coverX,
      y: coverY,
      width: drawCoverW,
      height: drawCoverH,
    });

    // Title text overlay near the bottom
    const titleFontSize = 32;
    const titleWidth = boldFont.widthOfTextAtSize(title, titleFontSize);
    const titleX = (width - titleWidth) / 2;
    const titleY = coverY + 60;

    // Draw white background behind text for readability
    coverPage.drawRectangle({
      x: titleX - 12,
      y: titleY - 10,
      width: titleWidth + 24,
      height: 80,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });

    coverPage.drawText(title, {
      x: titleX,
      y: titleY + 30,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    const subtitle = "A Colouring Book";
    const subtitleSize = 14;
    const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleSize);
    coverPage.drawText(subtitle, {
      x: (width - subtitleWidth) / 2,
      y: titleY,
      size: subtitleSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  } else {
    // Text-only cover (backwards compatible)
    const titleFontSize = 36;
    const titleWidth = boldFont.widthOfTextAtSize(title, titleFontSize);
    coverPage.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height / 2 + 20,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    const subtitle = "A Colouring Book";
    const subtitleSize = 16;
    const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleSize);
    coverPage.drawText(subtitle, {
      x: (width - subtitleWidth) / 2,
      y: height / 2 - 20,
      size: subtitleSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Content pages
  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([width, height]);

    let image;
    try {
      image = await pdfDoc.embedPng(page.imageBytes);
    } catch {
      // Fallback to JPEG if PNG embedding fails
      image = await pdfDoc.embedJpg(page.imageBytes);
    }

    // Scale image to fit with margins (0.5 inch = 36pt)
    const margin = 36;
    const maxW = width - 2 * margin;
    const maxH = height - 2 * margin - 40; // Reserve space for footer
    const scale = Math.min(maxW / image.width, maxH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (width - drawW) / 2;
    const y = (height - drawH) / 2 + 20;

    pdfPage.drawImage(image, { x, y, width: drawW, height: drawH });

    if (options.includePageNumbers) {
      const pageNumStr = String(page.pageNumber);
      const pageNumWidth = font.widthOfTextAtSize(pageNumStr, 10);
      pdfPage.drawText(pageNumStr, {
        x: (width - pageNumWidth) / 2,
        y: 25,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    if (options.includeFooter && options.footerText) {
      pdfPage.drawText(options.footerText, {
        x: margin,
        y: 25,
        size: 9,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
