import fs from 'node:fs';

function edit(path, replacements) {
  let text = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) throw new Error(`Missing pattern in ${path}: ${from.slice(0, 80)}`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(path, text);
}

edit('src/v3/refactor-app.js', [
  ["const collectionSubtitle=c=>c[`subtitle${sourceLanguage()==='de'?'De':sourceLanguage()==='es'?'Es':'El'}`]||c.subtitleDe;", "const collectionSubtitle=c=>c[`subtitle${({de:'De',es:'Es',el:'El',en:'En'})[sourceLanguage()]||'De'}`]||c.subtitleDe;"],
]);

edit('src/v3/games/core-learning.js', [
  ["{de:['Der','Hund','rennt','.'],es:['El','perro','corre','.'],el:['Ο','σκύλος','τρέχει','.']}", "{de:['Der','Hund','rennt','.'],es:['El','perro','corre','.'],el:['Ο','σκύλος','τρέχει','.'],en:['The','dog','runs','.']}"],
  ["{de:['Die','Katze','schläft','.'],es:['El','gato','duerme','.'],el:['Η','γάτα','κοιμάται','.']}", "{de:['Die','Katze','schläft','.'],es:['El','gato','duerme','.'],el:['Η','γάτα','κοιμάται','.'],en:['The','cat','sleeps','.']}"],
  ["{de:['Ich','esse','einen','Apfel','.'],es:['Yo','como','una','manzana','.'],el:['Εγώ','τρώω','ένα','μήλο','.']}", "{de:['Ich','esse','einen','Apfel','.'],es:['Yo','como','una','manzana','.'],el:['Εγώ','τρώω','ένα','μήλο','.'],en:['I','eat','an','apple','.']}"],
  ["{de:['Das','Wasser','ist','kalt','.'],es:['El','agua','está','fría','.'],el:['Το','νερό','είναι','κρύο','.']}", "{de:['Das','Wasser','ist','kalt','.'],es:['El','agua','está','fría','.'],el:['Το','νερό','είναι','κρύο','.'],en:['The','water','is','cold','.']}"],
  ["{de:['Wo','ist','mein','Buch','?'],es:['¿','Dónde','está','mi','libro','?'],el:['Πού','είναι','το','βιβλίο','μου',';']}", "{de:['Wo','ist','mein','Buch','?'],es:['¿','Dónde','está','mi','libro','?'],el:['Πού','είναι','το','βιβλίο','μου',';'],en:['Where','is','my','book','?']}"],
  ["{de:['Die','Blume','ist','gelb','.'],es:['La','flor','es','amarilla','.'],el:['Το','λουλούδι','είναι','κίτρινο','.']}", "{de:['Die','Blume','ist','gelb','.'],es:['La','flor','es','amarilla','.'],el:['Το','λουλούδι','είναι','κίτρινο','.'],en:['The','flower','is','yellow','.']}"],
]);

edit('src/v3/games/experiences.js', [
  ["{de:'Tula sucht einen Apfel',es:'Tula busca una manzana',el:'Η Τούλα ψάχνει ένα μήλο',icon:'🍎'", "{de:'Tula sucht einen Apfel',es:'Tula busca una manzana',el:'Η Τούλα ψάχνει ένα μήλο',en:'Tula looks for an apple',icon:'🍎'"],
  ["{de:'Tula geht in den Garten.',es:'Tula va al jardín.',el:'Η Τούλα πηγαίνει στον κήπο.'}", "{de:'Tula geht in den Garten.',es:'Tula va al jardín.',el:'Η Τούλα πηγαίνει στον κήπο.',en:'Tula goes to the garden.'}"],
  ["{de:'Sie sieht einen roten Apfel.',es:'Ve una manzana roja.',el:'Βλέπει ένα κόκκινο μήλο.'}", "{de:'Sie sieht einen roten Apfel.',es:'Ve una manzana roja.',el:'Βλέπει ένα κόκκινο μήλο.',en:'She sees a red apple.'}"],
  ["{de:'Tula teilt den Apfel mit einem Freund.',es:'Tula comparte la manzana con un amigo.',el:'Η Τούλα μοιράζεται το μήλο με έναν φίλο.'}", "{de:'Tula teilt den Apfel mit einem Freund.',es:'Tula comparte la manzana con un amigo.',el:'Η Τούλα μοιράζεται το μήλο με έναν φίλο.',en:'Tula shares the apple with a friend.'}"],
  ["{de:'Ein Tag am Hafen',es:'Un día en el puerto',el:'Μια μέρα στο λιμάνι',icon:'⚓'", "{de:'Ein Tag am Hafen',es:'Un día en el puerto',el:'Μια μέρα στο λιμάνι',en:'A day at the harbor',icon:'⚓'"],
  ["{de:'Tula hört die Möwen.',es:'Tula escucha las gaviotas.',el:'Η Τούλα ακούει τους γλάρους.'}", "{de:'Tula hört die Möwen.',es:'Tula escucha las gaviotas.',el:'Η Τούλα ακούει τους γλάρους.',en:'Tula hears the seagulls.'}"],
  ["{de:'Ein kleines Schiff kommt an.',es:'Llega un barco pequeño.',el:'Ένα μικρό πλοίο φτάνει.'}", "{de:'Ein kleines Schiff kommt an.',es:'Llega un barco pequeño.',el:'Ένα μικρό πλοίο φτάνει.',en:'A small ship arrives.'}"],
  ["{de:'Tula sagt freundlich Hallo.',es:'Tula saluda amablemente.',el:'Η Τούλα χαιρετάει ευγενικά.'}", "{de:'Tula sagt freundlich Hallo.',es:'Tula saluda amablemente.',el:'Η Τούλα χαιρετάει ευγενικά.',en:'Tula says hello kindly.'}"],
  ["{de:'Ein gemütlicher Abend',es:'Una tarde acogedora',el:'Ένα ήσυχο βράδυ',icon:'🌙'", "{de:'Ein gemütlicher Abend',es:'Una tarde acogedora',el:'Ένα ήσυχο βράδυ',en:'A cozy evening',icon:'🌙'"],
  ["{de:'Tula liest ein Buch.',es:'Tula lee un libro.',el:'Η Τούλα διαβάζει ένα βιβλίο.'}", "{de:'Tula liest ein Buch.',es:'Tula lee un libro.',el:'Η Τούλα διαβάζει ένα βιβλίο.',en:'Tula reads a book.'}"],
  ["{de:'Die Lampe leuchtet warm.',es:'La lámpara brilla cálidamente.',el:'Η λάμπα φωτίζει ζεστά.'}", "{de:'Die Lampe leuchtet warm.',es:'La lámpara brilla cálidamente.',el:'Η λάμπα φωτίζει ζεστά.',en:'The lamp glows warmly.'}"],
  ["{de:'Dann schläft Tula ein.',es:'Entonces Tula se duerme.',el:'Μετά η Τούλα αποκοιμιέται.'}", "{de:'Dann schläft Tula ein.',es:'Entonces Tula se duerme.',el:'Μετά η Τούλα αποκοιμιέται.',en:'Then Tula falls asleep.'}"],
  ["{de:'Guten Morgen',es:'Buenos días',el:'Καλημέρα',emoji:'☀️'}", "{de:'Guten Morgen',es:'Buenos días',el:'Καλημέρα',en:'Good morning',emoji:'☀️'}"],
  ["{de:'Wo ist der Hafen?',es:'¿Dónde está el puerto?',el:'Πού είναι το λιμάνι;',emoji:'⚓'}", "{de:'Wo ist der Hafen?',es:'¿Dónde está el puerto?',el:'Πού είναι το λιμάνι;',en:'Where is the harbor?',emoji:'⚓'}"],
  ["{de:'Ich möchte eine Fahrkarte',es:'Quiero un billete',el:'Θέλω ένα εισιτήριο',emoji:'🎫'}", "{de:'Ich möchte eine Fahrkarte',es:'Quiero un billete',el:'Θέλω ένα εισιτήριο',en:'I would like a ticket',emoji:'🎫'}"],
  ["{de:'Wann fährt das Schiff?',es:'¿Cuándo sale el barco?',el:'Πότε φεύγει το πλοίο;',emoji:'⛴️'}", "{de:'Wann fährt das Schiff?',es:'¿Cuándo sale el barco?',el:'Πότε φεύγει το πλοίο;',en:'When does the ship leave?',emoji:'⛴️'}"],
  ["{de:'Danke',es:'Gracias',el:'Ευχαριστώ',emoji:'🙏'}", "{de:'Danke',es:'Gracias',el:'Ευχαριστώ',en:'Thank you',emoji:'🙏'}"],
  ["{de:'Auf Wiedersehen',es:'Adiós',el:'Αντίο',emoji:'👋'}", "{de:'Auf Wiedersehen',es:'Adiós',el:'Αντίο',en:'Goodbye',emoji:'👋'}"],
  ["{id:'plant',icon:'🪴',cost:25,de:'Olivenbaum',es:'Olivo',el:'Ελιά'}", "{id:'plant',icon:'🪴',cost:25,de:'Olivenbaum',es:'Olivo',el:'Ελιά',en:'Olive tree'}"],
  ["{id:'bed',icon:'🛏️',cost:60,de:'Wolkenbett',es:'Cama nube',el:'Κρεβάτι σύννεφο'}", "{id:'bed',icon:'🛏️',cost:60,de:'Wolkenbett',es:'Cama nube',el:'Κρεβάτι σύννεφο',en:'Cloud bed'}"],
  ["{id:'lamp',icon:'🪔',cost:35,de:'Goldene Lampe',es:'Lámpara dorada',el:'Χρυσή λάμπα'}", "{id:'lamp',icon:'🪔',cost:35,de:'Goldene Lampe',es:'Lámpara dorada',el:'Χρυσή λάμπα',en:'Golden lamp'}"],
  ["{id:'books',icon:'📚',cost:40,de:'Bücherregal',es:'Estantería',el:'Βιβλιοθήκη'}", "{id:'books',icon:'📚',cost:40,de:'Bücherregal',es:'Estantería',el:'Βιβλιοθήκη',en:'Bookshelf'}"],
  ["{id:'aquarium',icon:'🐠',cost:90,de:'Aquarium',es:'Acuario',el:'Ενυδρείο'}", "{id:'aquarium',icon:'🐠',cost:90,de:'Aquarium',es:'Acuario',el:'Ενυδρείο',en:'Aquarium'}"],
  ["{id:'crown',icon:'👑',cost:110,de:'Goldene Krone',es:'Corona dorada',el:'Χρυσό στέμμα'}", "{id:'crown',icon:'👑',cost:110,de:'Goldene Krone',es:'Corona dorada',el:'Χρυσό στέμμα',en:'Golden crown'}"],
]);

edit('index.html', [
  [/languages-1/g, 'languages-3'],
]);

console.log('English batch applied successfully.');
