function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");
}

export function createSimplePdf(title: string, lines: string[]) {
  const pageLines = 46;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += pageLines) pages.push(lines.slice(index, index + pageLines));
  if (!pages.length) pages.push(["Aucune donnée."]);

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageIds: number[] = [];
  let nextId = 3;
  const fontId = nextId++;
  objects[fontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (const pageLinesContent of pages) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);
    const commands = [
      "BT", "/F1 15 Tf", "45 800 Td", `(${escapePdf(title)}) Tj`, "0 -25 Td", "/F1 8 Tf",
      ...pageLinesContent.flatMap((line) => [`(${escapePdf(line.slice(0, 145))}) Tj`, "0 -15 Td"]),
      "ET",
    ].join("\n");
    objects[contentId] = `<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
  }

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(output);
    output += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) output += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, "binary");
}

