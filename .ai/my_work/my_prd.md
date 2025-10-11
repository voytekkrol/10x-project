# Dokument wymagań produktu (PRD) - 10x-cards
## 1. Przegląd produktu
10x-cards to aplikacja webowa w wersji MVP (Minimum Viable Product), zaprojektowana w celu walidacji hipotezy o użyteczności fiszek generowanych przez AI. Aplikacja umożliwia użytkownikom szybkie tworzenie materiałów do nauki poprzez wklejenie tekstu, z którego sztuczna inteligencja generuje fiszki w formacie przód-tył. Rdzeniem produktu jest uproszczenie i przyspieszenie procesu tworzenia fiszek, aby zachęcić do korzystania z efektywnej metody nauki, jaką jest spaced repetition. Użytkownicy mogą akceptować, edytować lub odrzucać wygenerowane fiszki, a zaakceptowane karty są zapisywane na ich koncie i wykorzystywane w dedykowanym trybie nauki, opartym o zintegrowany algorytm powtórek.

## 2. Problem użytkownika
Głównym problemem, który rozwiązuje 10x-cards, jest czasochłonność i wysiłek związany z manualnym tworzeniem wysokiej jakości fiszek edukacyjnych. Tradycyjny proces wymaga analizy materiału, syntezy kluczowych informacji oraz ręcznego przepisywania ich w formacie przód-tył. To zniechęca wiele osób do regularnego stosowania fiszek, mimo udowodnionej skuteczności tej metody nauki, zwłaszcza w połączeniu z algorytmami spaced repetition. Aplikacja jest skierowana do szerokiej grupy osób uczących się, w szczególności do osób uczących się języków obcych, studentów przygotowujących się do egzaminów oraz profesjonalistów przygotowujących się do rozmów kwalifikacyjnych, którzy potrzebują efektywnego narzędzia do szybkiego przyswajania wiedzy.

## 3. Wymagania funkcjonalne
- FR-001: Generowanie fiszek przez AI: System umożliwia generowanie pojedynczych fiszek w formacie przód-tył na podstawie tekstu wklejonego przez użytkownika.
- FR-002: Ograniczenia tekstu wejściowego: Aplikacja akceptuje tekst wejściowy o długości od 1000 do 10 000 znaków.
- FR-003: Interakcja z wygenerowaną fiszką: Użytkownik ma trzy możliwości interakcji z wygenerowaną fiszką:
    - Zaakceptuj: Zapisuje fiszkę w kolekcji użytkownika.
    - Edytuj i zaakceptuj: Pozwala na modyfikację treści pytania lub odpowiedzi przed zapisaniem fiszki.
    - Odrzuć: Odrzuca fiszkę; nie jest ona zapisywana.
- FR-004: Cykl generowania: Po każdej interakcji (akceptacja, odrzucenie) użytkownik ma możliwość wygenerowania kolejnej fiszki z tego samego tekstu źródłowego.
- FR-005: Prosty system kont użytkowników: Użytkownicy mogą tworzyć konta i logować się w celu przechowywania i dostępu do swoich zaakceptowanych fiszek.
- FR-006: Tryb nauki (Spaced Repetition): Aplikacja posiada oddzielny tryb nauki, który prezentuje zapisane fiszki zgodnie z logiką zintegrowanej, zewnętrznej biblioteki implementującej algorytm spaced repetition.
- FR-007: Minimalistyczny interfejs użytkownika (UI): Interfejs jest prosty i skoncentrowany na kluczowych akcjach: wklejaniu tekstu, generowaniu fiszek i nauce.
- FR-008: Zbieranie danych analitycznych: System zlicza liczbę zaakceptowanych i odrzuconych fiszek w celu mierzenia wskaźników sukcesu.
- FR-009: Modułowa architektura AI: Rozwiązanie jest zaprojektowane w sposób umożliwiający w przyszłości łatwą wymianę modelu AI generującego fiszki.
- FR-010: Tworzenie manualnych fiszek: Użytkownik ma możliwość stworzenia nowej fiszki od zera, bez użycia generatora AI.

## 4. Granice produktu
Następujące funkcjonalności świadomie nie wchodzą w zakres MVP:
- Zaawansowany, autorski algorytm powtórek (np. na wzór SuperMemo, Anki).
- Import plików w różnych formatach (PDF, DOCX, itp.).
- Funkcje społecznościowe (współdzielenie talii fiszek, współpraca).
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (produkt jest dostępny tylko jako aplikacja webowa).
- Organizacja fiszek (brak możliwości tworzenia talii, zestawów czy tagowania).
- Zaawansowane opcje formatowania tekstu w edytorze fiszek.
- Dedykowane komunikaty o błędach w przypadku niepowodzenia generowania fiszki przez AI.
- Monetyzacja i plany subskrypcyjne.

## 5. Historyjki użytkowników

---
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowa osoba odwiedzająca stronę, chcę móc założyć konto, aby zapisywać stworzone przez siebie fiszki i mieć do nich dostęp w przyszłości.
- Kryteria akceptacji:
    1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
    2. System waliduje poprawność formatu adresu e-mail.
    3. Hasło musi spełniać podstawowe wymagania bezpieczeństwa (np. minimalna długość).
    4. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na główny ekran aplikacji.
    5. System uniemożliwia rejestrację na już istniejący adres e-mail.

---
- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich zapisanych fiszek i kontynuować naukę.
- Kryteria akceptacji:
    1. Formularz logowania zawiera pola na adres e-mail i hasło.
    2. Użytkownik może pomyślnie zalogować się przy użyciu poprawnych danych.
    3. W przypadku podania błędnych danych, wyświetlany jest ogólny komunikat o błędzie.
    4. Po pomyślnym zalogowaniu użytkownik jest przekierowany na główny ekran aplikacji.

---
- ID: US-003
- Tytuł: Wprowadzanie tekstu do generowania fiszek
- Opis: Jako zalogowany użytkownik, chcę móc wkleić fragment tekstu (np. z moich notatek) do aplikacji, aby przygotować go do wygenerowania fiszek.
- Kryteria akceptacji:
    1. Na głównym ekranie znajduje się wyraźnie widoczne pole tekstowe.
    2. Pole tekstowe posiada placeholder informujący o jego przeznaczeniu i limitach znaków (1000-10000).
    3. Użytkownik może wkleić lub wpisać tekst w pole tekstowe.

---
- ID: US-004
- Tytuł: Generowanie fiszki przez AI
- Opis: Jako użytkownik, po wklejeniu tekstu, chcę móc zainicjować proces generowania pojedynczej fiszki za pomocą jednego kliknięcia.
- Kryteria akceptacji:
    1. Obok pola tekstowego znajduje się przycisk "Stwórz fiszkę".
    2. Przycisk jest nieaktywny, jeśli tekst w polu nie spełnia kryteriów długości (1000-10000 znaków).
    3. Po kliknięciu przycisku system wysyła zapytanie do AI i wyświetla wskaźnik ładowania.
    4. Po pomyślnym przetworzeniu, na ekranie pojawia się wygenerowana fiszka z polami na pytanie i odpowiedź.

---
- ID: US-005
- Tytuł: Akceptacja wygenerowanej fiszki
- Opis: Jako użytkownik, po przejrzeniu wygenerowanej fiszki, chcę móc ją zaakceptować, aby została zapisana w mojej kolekcji do nauki.
- Kryteria akceptacji:
    1. Wygenerowana fiszka jest wyświetlana wraz z przyciskiem "Akceptuj".
    2. Po kliknięciu "Akceptuj", fiszka jest zapisywana na koncie użytkownika.
    3. Po zapisaniu, interfejs wraca do stanu umożliwiającego wygenerowanie kolejnej fiszki.
    4. Akcja akceptacji jest rejestrowana w systemie analitycznym.

---
- ID: US-006
- Tytuł: Edycja i akceptacja wygenerowanej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość edycji pytania lub odpowiedzi na wygenerowanej fiszce przed jej zaakceptowaniem, aby poprawić jej jakość lub dostosować do moich potrzeb.
- Kryteria akceptacji:
    1. Pola pytania i odpowiedzi na wygenerowanej fiszce są edytowalne.
    2. Użytkownik może dowolnie modyfikować tekst w obu polach.
    3. Po dokonaniu zmian, użytkownik klika przycisk "Akceptuj", aby zapisać zmodyfikowaną fiszkę.
    4. Zapisana fiszka zawiera treści wprowadzone przez użytkownika.
    5. Akcja edycji i akceptacji jest rejestrowana jako "zaakceptowana" w systemie analitycznym.

---
- ID: US-007
- Tytuł: Odrzucenie wygenerowanej fiszki
- Opis: Jako użytkownik, chcę móc odrzucić fiszkę, jeśli jest ona niepoprawna lub nieprzydatna, aby nie została dodana do mojej kolekcji.
- Kryteria akceptacji:
    1. Wygenerowana fiszka jest wyświetlana wraz z przyciskiem "Odrzuć".
    2. Po kliknięciu "Odrzuć", fiszka jest usuwana i nie zostaje nigdzie zapisana.
    3. Interfejs wraca do stanu umożliwiającego wygenerowanie kolejnej fiszki.
    4. Akcja odrzucenia jest rejestrowana w systemie analitycznym.

---
- ID: US-008
- Tytuł: Wejście w tryb nauki
- Opis: Jako użytkownik, chcę mieć możliwość przejścia do trybu nauki, aby rozpocząć sesję powtórek z moimi zapisanymi fiszkami.
- Kryteria akceptacji:
    1. W interfejsie aplikacji znajduje się wyraźny przycisk lub link "Nauka".
    2. Po jego kliknięciu, użytkownik jest przenoszony do oddzielnego interfejsu nauki.
    3. Jeśli użytkownik nie ma żadnych zapisanych fiszek, wyświetlany jest komunikat zachęcający do ich stworzenia.

---
- ID: US-009
- Tytuł: Powtarzanie fiszek w trybie nauki
- Opis: Będąc w trybie nauki, chcę, aby fiszki były mi prezentowane jedna po drugiej zgodnie z algorytmem spaced repetition, abym mógł efektywnie utrwalać wiedzę.
- Kryteria akceptacji:
    1. System prezentuje pytanie z pierwszej fiszki wybranej przez algorytm.
    2. Użytkownik ma możliwość samodzielnego odsłonięcia odpowiedzi (np. poprzez kliknięcie przycisku "Pokaż odpowiedź").
    3. Po odsłonięciu odpowiedzi, użytkownik ma do dyspozycji opcje oceny swojej wiedzy (np. "Nie wiem", "Wiem", "Wiem dobrze").
    4. Po dokonaniu oceny, system zapisuje ją i prezentuje kolejną fiszkę zgodnie z logiką algorytmu.

---
- ID: US-010
- Tytuł: Informacja zwrotna o nieprawidłowej długości tekstu
- Opis: Jako użytkownik, próbując wygenerować fiszkę z tekstu, który jest za krótki lub za długi, chcę otrzymać informację zwrotną, abym mógł to poprawić.
- Kryteria akceptacji:
    1. Gdy tekst w polu tekstowym ma mniej niż 1000 lub więcej niż 10 000 znaków, przycisk "Stwórz fiszkę" jest nieaktywny.
    2. Pod polem tekstowym wyświetlany jest subtelny komunikat informujący o wymaganej długości tekstu.

---
- ID: US-011
- Tytuł: Tworzenie manualnej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki, wpisując samodzielnie pytanie i odpowiedź, aby szybko dodać do mojej kolekcji wiedzę, której nie mam w formie dłuższego tekstu.
- Kryteria akceptacji:
    1. W interfejsie głównym znajduje się przycisk "Dodaj fiszkę ręcznie".
    2. Po kliknięciu przycisku pojawia się formularz z polami na "Pytanie" i "Odpowiedź".
    3. Użytkownik może wpisać dowolny tekst w obu polach.
    4. Przycisk "Zapisz" jest aktywny tylko wtedy, gdy oba pola są wypełnione.
    5. Po zapisaniu, fiszka jest dodawana do kolekcji użytkownika, a formularz jest czyszczony.

## 6. Metryki sukcesu
- MS-001: Wskaźnik akceptacji fiszek generowanych przez AI:
    - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (bezpośrednio lub po edycji).
    - Pomiar: System będzie mierzył stosunek liczby zaakceptowanych fiszek do całkowitej liczby wygenerowanych kandydatów. Formuła: `Liczba zaakceptowanych / (Liczba zaakceptowanych + Liczba odrzuconych)`.
- MS-002: Wskaźnik wykorzystania AI do tworzenia fiszek:
    - Cel: 75% wszystkich fiszek w systemie jest tworzonych z wykorzystaniem generatora AI.
    - Pomiar: Stosunek liczby fiszek stworzonych przez AI do całkowitej liczby fiszek. Formuła: `Liczba fiszek z AI / (Liczba fiszek z AI + Liczba fiszek manualnych)`.
