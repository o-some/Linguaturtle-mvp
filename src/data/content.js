export const categories=[
{id:'animals',icon:'🐾',de:'Tiere',es:'Animales',words:[['🐶','Hund','perro'],['🐱','Katze','gato'],['🐦','Vogel','pájaro'],['🐟','Fisch','pez'],['🐴','Pferd','caballo'],['🐮','Kuh','vaca'],['🐷','Schwein','cerdo'],['🐰','Kaninchen','conejo'],['🦁','Löwe','león'],['🐘','Elefant','elefante'],['🐻','Bär','oso'],['🦊','Fuchs','zorro'],['🐸','Frosch','rana'],['🐢','Schildkröte','tortuga'],['🐝','Biene','abeja'],['🦋','Schmetterling','mariposa']]},
{id:'food',icon:'🍓',de:'Essen',es:'Comida',words:[['🍎','Apfel','manzana'],['🍌','Banane','plátano'],['🍞','Brot','pan'],['🥛','Milch','leche'],['🧀','Käse','queso'],['💧','Wasser','agua'],['🍓','Erdbeere','fresa'],['🥕','Karotte','zanahoria'],['🍊','Orange','naranja'],['🍇','Traube','uva'],['🍐','Birne','pera'],['🍉','Wassermelone','sandía'],['🥚','Ei','huevo'],['🍚','Reis','arroz'],['🍲','Suppe','sopa'],['🍪','Keks','galleta']]},
{id:'home',icon:'🏡',de:'Zuhause',es:'Casa',words:[['🚪','Tür','puerta'],['🪟','Fenster','ventana'],['🛏️','Bett','cama'],['🪑','Stuhl','silla'],['🛋️','Sofa','sofá'],['💡','Lampe','lámpara'],['🧸','Teddy','peluche'],['🗝️','Schlüssel','llave'],['🪞','Spiegel','espejo'],['🛁','Badewanne','bañera'],['🧹','Besen','escoba'],['🧺','Korb','cesta'],['⏰','Uhr','reloj'],['📚','Buch','libro'],['🖼️','Bild','cuadro'],['🪴','Pflanze','planta']]},
{id:'colors',icon:'🎨',de:'Farben',es:'Colores',words:[['🔴','Rot','rojo'],['🔵','Blau','azul'],['🟡','Gelb','amarillo'],['🟢','Grün','verde'],['🟠','Orange','naranja'],['🟣','Lila','morado'],['⚫','Schwarz','negro'],['⚪','Weiß','blanco'],['🟤','Braun','marrón'],['🌸','Rosa','rosa']]},
{id:'family',icon:'👨‍👩‍👧',de:'Familie',es:'Familia',words:[['👩','Mutter','madre'],['👨','Vater','padre'],['👧','Tochter','hija'],['👦','Sohn','hijo'],['👵','Großmutter','abuela'],['👴','Großvater','abuelo'],['👶','Baby','bebé'],['👨‍👩‍👧','Familie','familia'],['👫','Geschwister','hermanos'],['🏠','Zuhause','hogar']]},
{id:'body',icon:'🖐️',de:'Körper',es:'Cuerpo',words:[['👁️','Auge','ojo'],['👂','Ohr','oreja'],['👃','Nase','nariz'],['👄','Mund','boca'],['🦷','Zahn','diente'],['🖐️','Hand','mano'],['🦶','Fuß','pie'],['🦵','Bein','pierna'],['💪','Arm','brazo'],['❤️','Herz','corazón']]},
{id:'nature',icon:'🌿',de:'Natur',es:'Naturaleza',words:[['☀️','Sonne','sol'],['🌙','Mond','luna'],['⭐','Stern','estrella'],['☁️','Wolke','nube'],['🌧️','Regen','lluvia'],['🌳','Baum','árbol'],['🌷','Blume','flor'],['🌊','Meer','mar'],['⛰️','Berg','montaña'],['🌈','Regenbogen','arcoíris']]},
{id:'actions',icon:'🏃',de:'Verben',es:'Verbos',words:[['🏃','laufen','correr'],['🚶','gehen','caminar'],['🛌','schlafen','dormir'],['🍽️','essen','comer'],['🥤','trinken','beber'],['📖','lesen','leer'],['✍️','schreiben','escribir'],['🎵','singen','cantar'],['💃','tanzen','bailar'],['🎨','malen','pintar']]}
].map(c=>({...c,words:c.words.map((w,i)=>({id:`${c.id}-${i}`,emoji:w[0],de:w[1],es:w[2]}))}));

export const sentences=[
{de:['Der','Hund','rennt','.'],es:['El','perro','corre','.']},
{de:['Die','Katze','schläft','.'],es:['El','gato','duerme','.']},
{de:['Ich','esse','einen','Apfel','.'],es:['Yo','como','una','manzana','.']},
{de:['Das','Wasser','ist','kalt','.'],es:['El','agua','está','fría','.']},
{de:['Wo','ist','mein','Teddy','?'],es:['¿','Dónde','está','mi','peluche','?']},
{de:['Die','Lampe','ist','gelb','.'],es:['La','lámpara','es','amarilla','.']},
{de:['Meine','Mutter','liest','ein','Buch','.'],es:['Mi','madre','lee','un','libro','.']},
{de:['Der','Vogel','singt','im','Baum','.'],es:['El','pájaro','canta','en','el','árbol','.']},
{de:['Wir','gehen','zum','Meer','.'],es:['Vamos','al','mar','.']},
{de:['Der','Himmel','ist','blau','.'],es:['El','cielo','es','azul','.']}
];

export const modes=[
{id:'learn',icon:'📖',de:'Wörter entdecken',es:'Descubrir palabras',free:true},
{id:'quiz',icon:'🎧',de:'Hör-Abenteuer',es:'Aventura auditiva',free:true},
{id:'match',icon:'✨',de:'Wort-Magie',es:'Magia de palabras',free:true},
{id:'sentence',icon:'✒️',de:'Satzwerkstatt',es:'Taller de frases',cost:80},
{id:'memory',icon:'🏛️',de:'Palast-Memory',es:'Memoria del palacio',cost:120},
{id:'speed',icon:'⏱️',de:'Goldene Minute',es:'Minuto dorado',cost:160}
];

export const milestones=[
{level:3,icon:'📚',de:'Extra-Wörterpaket',es:'Paquete de palabras',detail:'+20 Wörter im Pool'},
{level:5,icon:'⚡',de:'1-Tages-Boost',es:'Impulso diario',detail:'Doppelte XP für 24 Stunden'},
{level:7,icon:'🐚',de:'Muschel-Schatz',es:'Tesoro de conchas',detail:'+100 Muscheln'},
{level:10,icon:'🚀',de:'Startsprung-Booster',es:'Impulso de salto',detail:'3 Startsprünge speichern'},
{level:15,icon:'⭐',de:'Sternen-Outfit',es:'Traje estelar',detail:'Neues Tula-Outfit'},
{level:20,icon:'🎵',de:'Musik & Sounds',es:'Música y sonidos',detail:'Neue Hintergrundmusik'},
{level:30,icon:'🧰',de:'Legendäre Truhe',es:'Cofre legendario',detail:'Große Belohnung'}
];

export const boosters=[
{id:'doubleXp',icon:'⚡',de:'Doppel-XP 24h',es:'XP doble 24h',cost:60},
{id:'jump',icon:'🚀',de:'Startsprung',es:'Salto inicial',cost:35},
{id:'hint',icon:'💡',de:'Hinweis-Booster',es:'Pista',cost:25}
];
