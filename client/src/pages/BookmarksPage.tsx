/**
 * Bookmarks & Annotations Page
 * Displays all user's bookmarks and annotations with search functionality
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, MessageSquare, Search, Calendar, BookOpen, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Bookmark as BookmarkType, Annotation } from "@shared/schema";

interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

interface BookmarksPageProps {
  onBack: () => void;
  onNavigateToVerse: (book: string, chapter: number, verse: number) => void;
}

export function BookmarksPage({ onBack, onNavigateToVerse }: BookmarksPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"chronological" | "biblical">("chronological");
  const [activeTab, setActiveTab] = useState<"all" | "bookmarks" | "annotations">("all");

  // Fetch data
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<BookmarkType[]>({
    queryKey: ['/api/bookmarks'],
  });

  const { data: annotations = [], isLoading: annotationsLoading } = useQuery<Annotation[]>({
    queryKey: ['/api/annotations'],
  });

  const { data: books = [], isLoading: booksLoading } = useQuery<BibleBook[]>({
    queryKey: ['/api/bible/books'],
  });

  const isLoading = bookmarksLoading || annotationsLoading || booksLoading;

  // Get book name helper
  const getBookName = (bookId: string) => {
    if (!books || books.length === 0) return bookId;
    return books.find(b => b.id === bookId)?.name || bookId;
  };

  // Unique books that have marks
  const booksWithMarks = useMemo(() => {
    const bookIds = new Set<string>();
    bookmarks.forEach(b => bookIds.add(b.book));
    annotations.forEach(a => bookIds.add(a.book));
    return Array.from(bookIds).map(id => ({
      id,
      name: getBookName(id)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookmarks, annotations, books]);

  // Combined and filtered marks
  const filteredMarks = useMemo(() => {
    type MarkItem = {
      type: 'bookmark' | 'annotation';
      id: string;
      book: string;
      bookName: string;
      chapter: number;
      verse: number;
      note?: string;
      createdAt: Date;
    };

    let marks: MarkItem[] = [];

    // Add bookmarks
    if (activeTab === "all" || activeTab === "bookmarks") {
      bookmarks.forEach(b => {
        marks.push({
          type: 'bookmark',
          id: b.id,
          book: b.book,
          bookName: getBookName(b.book),
          chapter: b.chapter,
          verse: b.verse,
          createdAt: new Date(b.createdAt || Date.now()),
        });
      });
    }

    // Add annotations
    if (activeTab === "all" || activeTab === "annotations") {
      annotations.forEach(a => {
        marks.push({
          type: 'annotation',
          id: a.id,
          book: a.book,
          bookName: getBookName(a.book),
          chapter: a.chapter,
          verse: a.verse,
          note: a.note,
          createdAt: new Date(a.createdAt || Date.now()),
        });
      });
    }

    // Filter by book
    if (selectedBook !== "all") {
      marks = marks.filter(m => m.book === selectedBook);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      marks = marks.filter(m => 
        m.bookName.toLowerCase().includes(term) ||
        (m.note && m.note.toLowerCase().includes(term)) ||
        `${m.chapter}:${m.verse}`.includes(term)
      );
    }

    // Sort
    if (sortOrder === "chronological") {
      marks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      // Biblical order - by book order, then chapter, then verse
      marks.sort((a, b) => {
        const bookIndexA = books.findIndex(bk => bk.id === a.book);
        const bookIndexB = books.findIndex(bk => bk.id === b.book);
        if (bookIndexA !== bookIndexB) return bookIndexA - bookIndexB;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });
    }

    return marks;
  }, [bookmarks, annotations, books, activeTab, selectedBook, searchTerm, sortOrder]);

  const bookmarksCount = bookmarks.length;
  const annotationsCount = annotations.length;
  const totalCount = bookmarksCount + annotationsCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Minhas Marcações</h1>
            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'item' : 'itens'} salvos
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Search and Filters */}
        <div className="px-4 pb-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por livro, versículo ou nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-marks"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Book Filter */}
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-[140px]" data-testid="select-book-filter">
                <BookOpen className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Livro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os livros</SelectItem>
                {booksWithMarks.map(book => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort-order">
                <Calendar className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chronological">Mais recentes</SelectItem>
                <SelectItem value="biblical">Ordem bíblica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="px-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all">
              Todos ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
              <Bookmark className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
              ({bookmarksCount})
            </TabsTrigger>
            <TabsTrigger value="annotations" data-testid="tab-annotations">
              <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
              ({annotationsCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-muted-foreground">Carregando marcações...</p>
            </div>
          ) : filteredMarks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhuma marcação encontrada</p>
              <p className="text-sm">
                {searchTerm || selectedBook !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Marque versículos para salvá-los aqui"}
              </p>
            </div>
          ) : (
            filteredMarks.map((mark, index) => (
              <Card 
                key={`${mark.type}-${mark.id}`}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => onNavigateToVerse(mark.book, mark.chapter, mark.verse)}
                data-testid={`card-mark-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      mark.type === 'annotation' 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {mark.type === 'annotation' ? (
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Bookmark className="h-4 w-4 fill-green-500 text-green-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-semibold">
                          {mark.bookName} {mark.chapter}:{mark.verse}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {mark.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      {mark.note && (
                        <p className="text-sm text-foreground mt-2 line-clamp-3">
                          {mark.note}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
