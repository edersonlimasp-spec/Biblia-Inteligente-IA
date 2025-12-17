import { db } from "../server/db";
import { studyModules, studyTracks, studyLessons } from "../shared/schema";
import fs from "fs";
import path from "path";

async function exportStudyData() {
  console.log("📦 Exportando dados dos módulos de estudo...");
  
  const modules = await db.select().from(studyModules);
  console.log(`  ✓ ${modules.length} módulos`);
  
  const tracks = await db.select().from(studyTracks);
  console.log(`  ✓ ${tracks.length} trilhas`);
  
  const lessons = await db.select().from(studyLessons);
  console.log(`  ✓ ${lessons.length} lições`);
  
  const data = {
    exportedAt: new Date().toISOString(),
    modules: modules.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      color: m.color,
      order: m.order,
      level: m.level,
      requiredPlan: m.requiredPlan,
    })),
    tracks: tracks.map(t => ({
      id: t.id,
      moduleId: t.moduleId,
      level: t.level,
      name: t.name,
      description: t.description,
      requiredPlan: t.requiredPlan,
      order: t.order,
    })),
    lessons: lessons.map(l => ({
      id: l.id,
      trackId: l.trackId,
      title: l.title,
      content: l.content,
      references: l.references,
      questions: l.questions,
      application: l.application,
      summary: l.summary,
      estimatedMinutes: l.estimatedMinutes,
      order: l.order,
    })),
  };
  
  const outputPath = path.resolve(process.cwd(), "server/study-modules-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  console.log(`\n✅ Dados exportados para: ${outputPath}`);
  console.log(`   Tamanho: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  
  process.exit(0);
}

exportStudyData().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
