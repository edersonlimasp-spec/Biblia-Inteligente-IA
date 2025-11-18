// Tipos compartilhados por todos os livros da Bíblia
export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}
