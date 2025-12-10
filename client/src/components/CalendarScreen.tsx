import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar,
  CalendarPlus,
  ExternalLink,
  BookOpen,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { SiGoogle, SiApple } from "react-icons/si";

interface CalendarScreenProps {
  onBack: () => void;
}

const BIBLE_BOOKS = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
  "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras",
  "Neemias", "Ester", "Jó", "Salmos", "Provérbios",
  "Eclesiastes", "Cantares", "Isaías", "Jeremias", "Lamentações",
  "Ezequiel", "Daniel", "Oséias", "Joel", "Amós",
  "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque",
  "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João", "Atos",
  "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios",
  "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses",
  "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus",
  "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João",
  "3 João", "Judas", "Apocalipse"
];

const QUICK_READINGS = [
  { title: "Leitura Matinal", book: "Salmos", chapter: "1", time: "06:00" },
  { title: "Evangelho do Dia", book: "João", chapter: "3", time: "12:00" },
  { title: "Reflexão Noturna", book: "Provérbios", chapter: "1", time: "21:00" },
];

export function CalendarScreen({ onBack }: CalendarScreenProps) {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState("João");
  const [selectedChapter, setSelectedChapter] = useState("3");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState("09:00");

  const createGoogleCalendarLink = (title: string, book: string, chapter: string, date: string, time: string) => {
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `📖 ${title}: ${book} ${chapter}`,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Leitura bíblica planejada: ${book} capítulo ${chapter}\n\nAbra o app Bíblia Inteligente para acompanhar.`,
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const createAppleCalendarLink = (title: string, book: string, chapter: string, date: string, time: string) => {
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:📖 ${title}: ${book} ${chapter}
DESCRIPTION:Leitura bíblica planejada: ${book} capítulo ${chapter}
END:VEVENT
END:VCALENDAR`;
    
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  };

  const handleAddToGoogle = () => {
    const link = createGoogleCalendarLink(
      "Leitura Bíblica",
      selectedBook,
      selectedChapter,
      selectedDate,
      selectedTime
    );
    window.open(link, '_blank');
    toast({
      title: "Google Calendar",
      description: "Abrindo Google Calendar para adicionar evento",
    });
  };

  const handleAddToApple = () => {
    const link = createAppleCalendarLink(
      "Leitura Bíblica",
      selectedBook,
      selectedChapter,
      selectedDate,
      selectedTime
    );
    const a = document.createElement('a');
    a.href = link;
    a.download = `leitura-${selectedBook}-${selectedChapter}.ics`;
    a.click();
    toast({
      title: "Apple Calendar",
      description: "Arquivo .ics baixado para adicionar ao calendário",
    });
  };

  const handleQuickAdd = (reading: typeof QUICK_READINGS[0], type: 'google' | 'apple') => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'google') {
      const link = createGoogleCalendarLink(reading.title, reading.book, reading.chapter, today, reading.time);
      window.open(link, '_blank');
    } else {
      const link = createAppleCalendarLink(reading.title, reading.book, reading.chapter, today, reading.time);
      const a = document.createElement('a');
      a.href = link;
      a.download = `${reading.title.toLowerCase().replace(/\s/g, '-')}.ics`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Agenda Bíblica</h1>
            <p className="text-sm text-muted-foreground">Agende suas leituras no calendário</p>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-primary" />
                  Agendar Leitura
                </CardTitle>
                <CardDescription>
                  Escolha o livro, capítulo, data e horário para agendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Livro</Label>
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                      <SelectTrigger data-testid="select-book">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BIBLE_BOOKS.map((book) => (
                          <SelectItem key={book} value={book}>{book}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capítulo</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      data-testid="input-chapter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      data-testid="input-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input 
                      type="time" 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      data-testid="input-time"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleAddToGoogle}
                    data-testid="button-google-calendar"
                  >
                    <SiGoogle className="w-4 h-4 mr-2" />
                    Adicionar ao Google Calendar
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleAddToApple}
                    data-testid="button-apple-calendar"
                  >
                    <SiApple className="w-4 h-4 mr-2" />
                    Apple Calendar (.ics)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Leituras Rápidas
                </CardTitle>
                <CardDescription>
                  Adicione leituras sugeridas para hoje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {QUICK_READINGS.map((reading, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{reading.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {reading.book} {reading.chapter} às {reading.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleQuickAdd(reading, 'google')}
                        data-testid={`quick-google-${index}`}
                      >
                        <SiGoogle className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleQuickAdd(reading, 'apple')}
                        data-testid={`quick-apple-${index}`}
                      >
                        <SiApple className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Como funciona</h4>
                    <p className="text-sm text-muted-foreground">
                      Ao clicar em "Adicionar", você será redirecionado para seu calendário 
                      com o evento pré-preenchido. Basta confirmar para salvar o lembrete 
                      da sua leitura bíblica.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
