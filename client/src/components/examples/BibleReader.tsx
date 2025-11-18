import { BibleReader } from "../BibleReader";
import { ThemeProvider } from "../ThemeProvider";

export default function BibleReaderExample() {
  return (
    <ThemeProvider>
      <BibleReader />
    </ThemeProvider>
  );
}
