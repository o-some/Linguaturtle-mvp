export const englishCollections = {
  garden: { en: 'Garden', subtitleEn: 'Fruit, vegetables and nature' },
  library: { en: 'Library', subtitleEn: 'School, books and first sentences' },
  animals: { en: 'Animal World', subtitleEn: 'Pets, forest and farm' },
  home: { en: 'Home', subtitleEn: 'Rooms, furniture and everyday life' },
  family: { en: 'Family', subtitleEn: 'People and relationships' },
  body: { en: 'Body & Feelings', subtitleEn: 'Body parts and emotions' },
  travel: { en: 'On the Move', subtitleEn: 'Vehicles, places and travel' },
  actions: { en: 'Actions', subtitleEn: 'Important everyday verbs' },
};

export const englishWords = {
  'garden-apple':'apple','garden-pear':'pear','garden-banana':'banana','garden-strawberry':'strawberry','garden-grapes':'grapes','garden-carrot':'carrot','garden-tomato':'tomato','garden-cucumber':'cucumber','garden-lemon':'lemon','garden-orange':'orange','garden-flower':'flower','garden-tree':'tree','garden-potato':'potato','garden-onion':'onion','garden-pepper':'pepper','garden-watermelon':'watermelon','garden-cherries':'cherries','garden-mushroom':'mushroom',
  'library-book':'book','library-pen':'pencil','library-chair':'chair','library-table':'table','library-lamp':'lamp','library-door':'door','library-window':'window','library-clock':'clock','library-letter':'letter','library-picture':'picture','library-school':'school','library-teacher':'teacher','library-pencilcase':'pencil case','library-paper':'paper','library-scissors':'scissors','library-backpack':'backpack','library-notebook':'notebook','library-ruler':'ruler',
  'animals-dog':'dog','animals-cat':'cat','animals-bird':'bird','animals-fish':'fish','animals-horse':'horse','animals-cow':'cow','animals-pig':'pig','animals-rabbit':'rabbit','animals-lion':'lion','animals-elephant':'elephant','animals-bear':'bear','animals-fox':'fox','animals-frog':'frog','animals-turtle':'turtle','animals-bee':'bee','animals-butterfly':'butterfly','animals-duck':'duck','animals-sheep':'sheep',
  'home-bed':'bed','home-sofa':'sofa','home-key':'key','home-mirror':'mirror','home-bathtub':'bathtub','home-broom':'broom','home-basket':'basket','home-plant':'plant','home-pillow':'pillow','home-blanket':'blanket','home-kitchen':'kitchen','home-bathroom':'bathroom','home-gardenhome':'garden','home-fridge':'fridge','home-plate':'plate','home-cup':'cup','home-spoon':'spoon','home-fork':'fork',
  'family-mother':'mother','family-father':'father','family-sister':'sister','family-brother':'brother','family-grandmother':'grandmother','family-grandfather':'grandfather','family-baby':'baby','family-familyword':'family','family-friend':'friend','family-girl':'girl','family-boy':'boy','family-woman':'woman','family-man':'man','family-child':'child','family-aunt':'aunt','family-uncle':'uncle',
  'body-eye':'eye','body-ear':'ear','body-nose':'nose','body-mouth':'mouth','body-tooth':'tooth','body-hand':'hand','body-foot':'foot','body-leg':'leg','body-arm':'arm','body-heart':'heart','body-head':'head','body-hair':'hair','body-happy':'happy','body-sad':'sad','body-tired':'tired','body-angry':'angry','body-afraid':'afraid','body-hungry':'hungry',
  'travel-car':'car','travel-bus':'bus','travel-train':'train','travel-ship':'ship','travel-airplane':'airplane','travel-bicycle':'bicycle','travel-station':'station','travel-airport':'airport','travel-ticket':'ticket','travel-suitcase':'suitcase','travel-hotel':'hotel','travel-street':'street','travel-bridge':'bridge','travel-city':'city','travel-village':'village','travel-map':'map',
  'actions-run':'run','actions-walk':'walk','actions-sleep':'sleep','actions-eat':'eat','actions-drink':'drink','actions-read':'read','actions-write':'write','actions-sing':'sing','actions-dance':'dance','actions-paint':'paint','actions-play':'play','actions-listen':'listen','actions-speak':'speak','actions-open':'open','actions-close':'close','actions-help':'help','actions-laugh':'laugh','actions-learn':'learn'
};

export const englishValues = {
  'Tula sucht einen Apfel':'Tula looks for an apple',
  'Tula geht in den Garten.':'Tula goes to the garden.',
  'Sie sieht einen roten Apfel.':'She sees a red apple.',
  'Tula teilt den Apfel mit einem Freund.':'Tula shares the apple with a friend.',
  'Ein Tag am Hafen':'A day at the harbor',
  'Tula hört die Möwen.':'Tula hears the seagulls.',
  'Ein kleines Schiff kommt an.':'A small ship arrives.',
  'Tula sagt freundlich Hallo.':'Tula says hello kindly.',
  'Ein gemütlicher Abend':'A cozy evening',
  'Tula liest ein Buch.':'Tula reads a book.',
  'Die Lampe leuchtet warm.':'The lamp glows warmly.',
  'Dann schläft Tula ein.':'Then Tula falls asleep.',
  'Guten Morgen':'Good morning',
  'Wo ist der Hafen?':'Where is the harbor?',
  'Ich möchte eine Fahrkarte':'I would like a ticket',
  'Wann fährt das Schiff?':'When does the ship leave?',
  'Danke':'Thank you',
  'Auf Wiedersehen':'Goodbye',
  'Olivenbaum':'Olive tree','Wolkenbett':'Cloud bed','Goldene Lampe':'Golden lamp','Bücherregal':'Bookshelf','Aquarium':'Aquarium','Goldene Krone':'Golden crown',
  'Satzwerkstatt':'Sentence Workshop','Palast-Memory':'Palace Memory','Goldene Minute':'Golden Minute','Doppel-XP':'Double XP','Hinweis':'Hint','Startsprung':'Head start'
};

export const englishValue = value => englishValues[value] || value || '';
