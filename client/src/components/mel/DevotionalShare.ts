import type { DevotionalMoment } from "@shared/devotional";
import { APP_NAME, APP_URL } from "@/lib/sharing";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isNative } from "@/lib/capacitor";

export async function shareDevotionalImage(moment: DevotionalMoment, square = false) {
  const width = 1080;
  const height = square ? 1080 : 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");

  const night = moment.routine === "noite";
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, night ? "#172328" : "#f4e7ca");
  background.addColorStop(1, night ? "#27363b" : "#dfcda8");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = night ? "rgba(228,207,159,.25)" : "rgba(103,75,42,.25)";
  context.lineWidth = 2;
  context.strokeRect(52, 52, width - 104, height - 104);

  const center = (text: string, y: number, font: string, color: string, maxWidth = 820) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    const lineHeight = parseInt(font.match(/\d+px/)?.[0] ?? "48", 10) * 1.42;
    lines.forEach((entry, index) => context.fillText(entry, width / 2, y + index * lineHeight, maxWidth));
    return lines.length * lineHeight;
  };

  const ink = night ? "#f1e6ce" : "#342e24";
  center("MEU MOMENTO COM DEUS", height * 0.22, "600 24px sans-serif", night ? "#cdb77d" : "#8c6c36");
  center(moment.title, height * 0.30, "italic 54px Georgia, serif", ink, 800);
  const verseY = height * (square ? 0.47 : 0.44);
  const verseHeight = center(`“${moment.verse.text}”`, verseY, "italic 42px Georgia, serif", ink, 810);
  center(moment.verse.reference, verseY + verseHeight + 42, "600 25px sans-serif", night ? "#cdb77d" : "#8c6c36");
  center(APP_NAME, height * 0.81, "600 25px sans-serif", ink);
  center(APP_URL.replace("https://", ""), height * 0.84, "20px sans-serif", night ? "#c5c0b1" : "#756b59");

  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) =>
    value ? resolve(value) : reject(new Error("Não foi possível criar a imagem.")), "image/png"));
  const file = new File([blob], "meu-momento-com-deus.png", { type: "image/png" });
  if (isNative) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Não foi possível preparar a imagem para compartilhar."));
      reader.readAsDataURL(blob);
    });
    const saved = await Filesystem.writeFile({
      path: `meu-momento-${Date.now()}.png`,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: "Meu Momento com Deus",
      text: `${moment.verse.reference}\n${moment.verse.text}`,
      url: saved.uri,
      dialogTitle: "Compartilhar versículo",
    });
    return;
  }
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: "Meu Momento com Deus", files: [file] });
      return;
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}