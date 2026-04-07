// ── Données statiques de l'application MathMentor ─────────────────────────────
// BTS GCGP S2 – 4 chapitres : SYSLIN, POLY, FVAR, FRAT
// Généré automatiquement — ne pas modifier à la main

window.APP_DATA = {
  curriculum: [{
    code: "SYSLIN",
    semester: "S2",
    title: "Systèmes linéaires",
    focus: ["substitution", "pivot de Gauss", "systèmes incompatibles", "bilans matière"],
    objective: "Résoudre des systèmes d'équations linéaires par différentes méthodes (substitution, pivot de Gauss) et les appliquer aux bilans matière et thermiques en génie des procédés.",
    prerequisites: ["algèbre de base", "équations du premier degré", "notion de variable"],
    applications: ["mélange de solutions", "bilans sur réacteurs", "réseaux de conduites", "bilans thermiques sur échangeurs"],
    lessons: [
      {
        title: "Définition d'un système d'équations",
        summary: "Un système d'équations est un ensemble d'équations faisant intervenir plusieurs inconnues dépendant les unes des autres. Résoudre un système signifie déterminer toutes les valeurs possibles des inconnues satisfaisant simultanément toutes les équations. Exemple caractéristique du cours : x + 2y + 2z = 2 (L₁), x + 3y − 2z = −1 (L₂), 3x + 5y + 8z = 8 (L₃). Dans les problèmes concrets, toutes les solutions mathématiques ne sont pas forcément acceptables (contraintes physiques, domaines de définition). Il faut donc, après résolution, vérifier que chaque solution trouvée est compatible avec le contexte du problème.",
        qcm: [
          {
            question: "Sous quelle forme matricielle compact note-t-on un système linéaire ?",
            choices: ["A·x = b", "A/x = b", "A·x + b = 0", "x = A⁻¹"],
            answer: 0,
            explanation: "A est la matrice des coefficients, x le vecteur des inconnues et b le vecteur des seconds membres."
          },
          {
            question: "Un système carré (n = p) admet une solution unique quand :",
            choices: ["det(A) ≠ 0 (système de Cramer)", "det(A) = 0", "A est triangulaire", "b = 0"],
            answer: 0,
            explanation: "Si det(A) ≠ 0 le système est de Cramer et admet exactement une solution. Si det(A) = 0 il y a soit infinité de solutions, soit aucune."
          },
          {
            question: "Qu'est-ce que la matrice augmentée [A|b] ?",
            choices: ["La matrice A complétée par le vecteur b en dernière colonne", "Le produit A × b", "La matrice inverse de A", "La transposée de A"],
            answer: 0,
            explanation: "[A|b] ∈ M_{n,p+1}(ℝ) contient toute l'information utile pour résoudre le système par les méthodes de réduction."
          }
        ]
      },
      {
        title: "Méthode par substitution",
        summary: "La méthode par substitution est peut-être la plus simple car systématique, mais parfois fastidieuse. Elle consiste à remplacer successivement chaque variable par son expression en fonction des autres. Application au système du cours (x + 2y + 2z = 2, x + 3y − 2z = −1, 3x + 5y + 8z = 8) en trois étapes : Étape 1 — de L₁ on tire x = 2 − 2y − 2z, que l'on substitue dans L₂ et L₃ pour obtenir y − 4z = −3 et −y + 2z = 2. Étape 2 — de la nouvelle L₂ on tire y = −3 + 4z, que l'on substitue dans la nouvelle L₃ pour obtenir −2z = −1. Étape 3 — on remonte : z = 1/2, puis y = −3 + 4×(1/2) = −1, puis x = 2 − 2(−1) − 2(1/2) = 3. Remarque importante : dans les problèmes concrets, toutes les solutions ne sont pas forcément acceptables ; il faut faire attention aux domaines de définition.",
        qcm: [
          {
            question: "Quelle est la première étape de la méthode par substitution ?",
            choices: ["Isoler une inconnue dans l'équation la plus simple", "Calculer le déterminant de A", "Triangulariser la matrice augmentée", "Poser un paramètre libre t"],
            answer: 0,
            explanation: "On choisit l'équation où une variable s'exprime le plus facilement, on l'isole, puis on substitue partout ailleurs."
          },
          {
            question: "Pour le système 2x + y = 7 et x − y = 2, quelle est la solution ?",
            choices: ["x = 3, y = 1", "x = 1, y = 3", "x = 2, y = 3", "x = 3, y = 2"],
            answer: 0,
            explanation: "De L2 : y = x − 2. Substitution dans L1 : 2x + x − 2 = 7 → 3x = 9 → x = 3, y = 1. Vérification : 2·3 + 1 = 7 ✓."
          },
          {
            question: "Quand la méthode par substitution est-elle la plus avantageuse ?",
            choices: ["Systèmes 2×2 où une variable s'exprime facilement", "Systèmes 10×10 denses", "Quand le déterminant est nul", "Quand les coefficients sont tous décimaux"],
            answer: 0,
            explanation: "La substitution est rapide et lisible pour les petits systèmes. Pour les grands systèmes, le pivot de Gauss est préférable."
          }
        ]
      },
      {
        title: "Méthode du pivot de Gauss",
        summary: "La méthode du pivot de Gauss transforme le système en un système équivalent triangulaire (qui admet exactement les mêmes solutions). Les opérations autorisées sur les lignes sont : échange de deux lignes, multiplication d'une ligne par un nombre non nul, addition d'un multiple d'une ligne à une autre. Application au système du cours (x + 2y + 2z = 2, x + 3y − 2z = −1, 3x + 5y + 8z = 8) : L₂' ← L₂ − L₁ donne y − 4z = −3 ; L₃' ← L₃ − 3L₁ donne −y + 2z = 2. Puis L₃'' ← L₃' + L₂' donne −2z = −1, soit z = 1/2. Remontée : y = −3 + 4×(1/2) = −1, puis x = 2 − 2(−1) − 2(1/2) = 3. Ces trois opérations élémentaires sur les lignes ne modifient pas l'ensemble des solutions du système.",
        qcm: [
          {
            question: "Quel est l'objectif de la méthode du pivot de Gauss ?",
            choices: ["Obtenir une forme triangulaire supérieure avec des zéros sous la diagonale", "Calculer l'inverse de A", "Diagonaliser A", "Trouver le déterminant de A"],
            answer: 0,
            explanation: "Les opérations Lᵢ ← Lᵢ + k·Lⱼ éliminent les coefficients sous le pivot colonne par colonne jusqu'à obtenir un système triangulaire facile à résoudre par remontée."
          },
          {
            question: "Quelle opération élémentaire sur les lignes est autorisée dans le pivot de Gauss ?",
            choices: ["Lᵢ ← Lᵢ + k·Lⱼ (combinaison linéaire)", "Lᵢ ← Lᵢ² (carré d'une ligne)", "Lᵢ ← Lᵢ × Lⱼ (produit de deux lignes)", "Remplacer tous les coefficients par leur valeur absolue"],
            answer: 0,
            explanation: "On peut : multiplier une ligne par un scalaire non nul, ajouter un multiple d'une ligne à une autre, et permuter deux lignes. Ces opérations préservent les solutions."
          },
          {
            question: "Dans l'exemple 3×3 du cours, après réduction gaussienne, quelle est la valeur de z ?",
            choices: ["z = 2", "z = 1", "z = 3", "z = −2"],
            answer: 0,
            explanation: "L3' ← L3' + L2' donne −5z = −10 → z = 2. Puis remontée : y = 3, x = 1."
          }
        ]
      },
      {
        title: "Changement de variable",
        summary: "Le changement de variable s'applique quand le système ne fait pas intervenir les inconnues directement mais des expressions de celles-ci : x², |x|, √x, etc. On pose alors de nouvelles inconnues pour se ramener à un système linéaire classique. Exemple du cours : x² + y² = 5 et x² − y² = 3. On pose u = x² et v = y², ce qui donne le système linéaire u + v = 5 et u − v = 3. Résolution : u = 4 et v = 1, d'où x = ±2 et y = ±1. Remarque importante : dans les problèmes concrets, toutes les solutions mathématiques ne sont pas forcément acceptables (quantités positives imposées, domaines de définition à respecter). Il faut donc systématiquement vérifier la validité de chaque solution obtenue dans le contexte physique du problème.",
        qcm: [
          {
            question: "Pourquoi introduit-on parfois un paramètre libre t ∈ ℝ dans la solution ?",
            choices: ["Parce qu'une inconnue est libre (infinité de solutions)", "Pour simplifier les calculs numériques", "Pour rendre le système incompatible", "Parce que le déterminant vaut 1"],
            answer: 0,
            explanation: "Quand une colonne ne contient pas de pivot, l'inconnue correspondante est libre : on la note t et on exprime les autres en fonction de t."
          },
          {
            question: "Si u = x + y et v = x − y simplifient le système, comment s'appelle cette technique ?",
            choices: ["Changement de variable", "Substitution arrière", "Pivot de Gauss", "Méthode des résidus"],
            answer: 0,
            explanation: "On remplace des expressions complexes par de nouvelles variables pour obtenir un système plus simple, souvent diagonal."
          },
          {
            question: "En génie des procédés, à quoi sert un changement de variable dans un bilan ?",
            choices: ["Substituer une relation de stœchiométrie pour réduire le nombre d'inconnues", "Augmenter le nombre d'équations", "Calculer le déterminant plus rapidement", "Éviter la vérification finale"],
            answer: 0,
            explanation: "Par exemple FA = F₀ − ξ réduit le nombre d'inconnues indépendantes dans un bilan réactionnel."
          }
        ]
      },
      {
        title: "Écriture des solutions",
        summary: "Il faut écrire TOUTES les solutions possibles d'un système. Exemple du cours : x² + y = 3 et x² − y = −1. Après résolution, on obtient x² = 1 et y = 2, d'où x = 1 ou x = −1 (deux valeurs). On doit indiquer toutes les solutions, soit sous forme de systèmes : {x = 1, y = 2} ou {x = −1, y = 2}, soit sous forme de couples : (x, y) ∈ {(1, 2) ; (−1, 2)}, soit en notation ensembliste : S = {(1, 2) ; (−1, 2)}. On ne doit pas oublier de solutions ni en inventer : dans cet exemple il y a exactement deux couples solutions. Cette rigueur dans l'écriture des solutions est essentielle, notamment dans les problèmes concrets où chaque solution peut correspondre à un état physique différent.",
        qcm: [
          {
            question: "Combien de cas distincts peut-on rencontrer après la réduction gaussienne d'un système ?",
            choices: ["3 cas : solution unique, infinité de solutions, aucune solution", "2 cas : solution ou pas de solution", "4 cas selon la taille de la matrice", "Autant de cas que d'équations"],
            answer: 0,
            explanation: "Après réduction : (1) système de Cramer → solution unique ; (2) variable libre → infinité de solutions ; (3) contradiction 0 = c ≠ 0 → aucune solution."
          },
          {
            question: "Comment note-t-on l'ensemble solution quand il n'y a aucune solution ?",
            choices: ["S = ∅", "S = {0}", "S = ℝ", "S = {t | t ∈ ℝ}"],
            answer: 0,
            explanation: "L'ensemble vide ∅ signifie qu'aucun triplet (x, y, z) ne satisfait toutes les équations simultanément."
          },
          {
            question: "L'ensemble S = {((5−t)/3, (2t+2)/3, t) | t ∈ ℝ} décrit :",
            choices: ["Une infinité de solutions (droite paramétrée dans ℝ³)", "Une solution unique", "Un système incompatible", "La matrice inverse"],
            answer: 0,
            explanation: "z = t est libre, donc il y a une infinité de solutions formant une droite affine dans ℝ³."
          }
        ]
      },
      {
        title: "Systèmes sans solution",
        summary: "Un système sans solution apparaît lorsque deux lignes au moins sont incompatibles entre elles, ce qui mène à une contradiction lors de la résolution. Exemple du cours : x + y + z = 1 (L₁), x + y + 2z = 1 (L₂), x + y = 3 (L₃). La soustraction L₂ − L₁ donne z = 0, mais L₁ − L₃ donne z = −2 : contradiction, il n'y a pas de solution. Pour un système 2×2 de la forme α₁x + β₁y = γ₁ et α₂x + β₂y = γ₂, on définit le déterminant det S = α₁β₂ − α₂β₁. Le système admet une solution unique si et seulement si det S ≠ 0. Si det S = 0, le système est soit incompatible (aucune solution), soit indéterminé (infinité de solutions), selon que les seconds membres sont cohérents ou non.",
        qcm: [
          {
            question: "Quel signe caractéristique indique qu'un système est incompatible après réduction gaussienne ?",
            choices: ["Une ligne de la forme 0 = c avec c ≠ 0 (contradiction)", "Une ligne nulle 0 = 0", "Un pivot nul sur la diagonale", "Un déterminant positif"],
            answer: 0,
            explanation: "0 = c (c ≠ 0) est une contradiction : aucune valeur de x, y, z ne peut satisfaire cette équation."
          },
          {
            question: "En 2D, que représente géométriquement un système incompatible ?",
            choices: ["Deux droites parallèles qui ne se croisent jamais", "Deux droites confondues", "Deux droites perpendiculaires", "Un point d'intersection unique"],
            answer: 0,
            explanation: "Des droites parallèles distinctes n'ont aucun point commun, ce qui se traduit par l'absence de solution dans le système."
          },
          {
            question: "Dans un bilan de procédé, que signifie obtenir un système incompatible ?",
            choices: ["Des mesures contradictoires ou une erreur de modélisation", "Que le débit est nul", "Que toutes les mesures sont correctes", "Qu'une variable est libre"],
            answer: 0,
            explanation: "Un système incompatible dans un bilan signale une incohérence physique : capteur défaillant, fuite non modélisée, ou erreur de données."
          }
        ]
      },
    ],
    examples: [
      {
        title: "Mélange de deux courants",
        problem: "Un courant de 10 kg/h à 30% en A est mélangé à un courant de 20 kg/h à 10% en A. Quelle est la composition du mélange ?",
        solution: "Bilan global : F = 10 + 20 = 30 kg/h. Bilan sur A : 10×0.3 + 20×0.1 = 3 + 2 = 5 kg/h. Composition : 5/30 = 16.7% en A.",
        applicationNote: "Ce type de calcul est omniprésent dans les procédés de mélange, dilution et conditionnement."
      },
      {
        title: "Pivot de Gauss 2×2",
        problem: "Résoudre : 2x + y = 7 et x − y = 2.",
        solution: "L2 ← L2 − (1/2)·L1 : −(3/2)y = −3/2 → y = 1. Substitution : 2x = 7 − 1 = 6 → x = 3.",
        applicationNote: "En génie des procédés, x et y représentent souvent des débits inconnus dans deux branches d'un réseau."
      },
      {
        title: "Pivot de Gauss 3×3 — bilan sur échangeur",
        problem: "Résoudre le système 3×3 représentant les bilans matière sur un nœud à trois flux (x, y, z en kg/h) : x + y + z = 6 (L1), 2x + y − z = 3 (L2), x + 2y − z = 5 (L3).",
        solution: "Étape 1 — Triangularisation. L2 ← L2 − 2·L1 : (2−2)x + (1−2)y + (−1−2)z = 3−12 → −y − 3z = −9 (L2'). L3 ← L3 − L1 : (1−1)x + (2−1)y + (−1−1)z = 5−6 → y − 2z = −1 (L3'). Étape 2 — Élimination de y. L3' ← L3' + L2' : (y−y) + (−2z−3z) = −1+(−9) → −5z = −10 → z = 2. Étape 3 — Remontée. Depuis L2' : −y − 6 = −9 → y = 3. Depuis L1 : x = 6 − 3 − 2 = 1. Vérification complète : L1 : 1+3+2=6 ✓ ; L2 : 2+3−2=3 ✓ ; L3 : 1+6−2=5 ✓.",
        applicationNote: "Le pivot de Gauss 3×3 est la méthode standard pour les bilans matière couplés sur les procédés à trois composants ou trois flux."
      },
      {
        title: "Système avec infinité de solutions — paramètre libre",
        problem: "Résoudre : x + 2y − z = 3 (L1), 2x + 4y − 2z = 6 (L2), x − y + z = 1 (L3).",
        solution: "L2 ← L2 − 2·L1 : 0 = 0 (ligne nulle). L3 ← L3 − L1 : −3y + 2z = −2. Posons z = t (paramètre libre). Depuis L3' : y = (2t + 2)/3. Depuis L1 : x = 3 − 2y + z = 3 − 2(2t+2)/3 + t = 3 − (4t+4)/3 + t = (9 − 4t − 4 + 3t)/3 = (5 − t)/3. Solution : (x, y, z) = ((5−t)/3, (2t+2)/3, t) pour tout t ∈ ℝ. L2 est redondante : le système a un degré de liberté.",
        applicationNote: "Un degré de liberté en procédé signifie qu'une mesure supplémentaire (pression différentielle, composition…) est nécessaire pour fermer le bilan."
      },
      {
        title: "Système incompatible — détection de mesures contradictoires",
        problem: "Un opérateur mesure des débits : x + y = 50 (L1), 3x + 3y = 180 (L2). Détecter l'incohérence.",
        solution: "L2 ← L2 − 3·L1 : 0·x + 0·y = 180 − 150 = 30 → 0 = 30. Contradiction : le système est incompatible. L2 devrait être 3×50 = 150, mais les mesures donnent 180. Cela indique soit une erreur de facteur (L2 ≠ 3·L1 physiquement), soit une mesure erronée. Le bilan global devrait satisfaire 3×50 = 150 ≠ 180 : il y a 30 unités de débit non comptabilisées (fuite, erreur de capteur).",
        applicationNote: "En analyse de procédé, la détection d'un système incompatible après réduction gaussienne est la première étape du diagnostic de cohérence des mesures (data reconciliation)."
      }
    ]
  },
  {
    code: "POLY",
    semester: "S2",
    title: "Polynômes",
    focus: ["opérations sur les polynômes", "racines", "théorème du facteur", "schéma de Horner", "factorisation"],
    objective: "Maîtriser les opérations sur les polynômes, trouver leurs racines par différentes méthodes et appliquer ces outils aux équations caractéristiques et aux corrélations expérimentales en génie des procédés.",
    prerequisites: ["calcul algébrique", "équations du second degré (discriminant)", "notion de degré"],
    applications: ["courbes de calibration de capteurs", "équations d'état cubiques (Van der Waals)", "polynômes caractéristiques de systèmes dynamiques", "ajustement de données expérimentales"],
    lessons: [
      {
        title: "Introduction",
        summary: "Les fonctions polynomiales x ↦ a₀ + a₁x + … + aₙxⁿ ont déjà été rencontrées au lycée. Dans tout ce chapitre, on travaille dans ℝ ou ℂ. Les polynômes constituent un outil fondamental en mathématiques et dans leurs applications : ils interviennent dans la modélisation de nombreux phénomènes physiques, chimiques et industriels. Ce chapitre présente la définition formelle des polynômes à coefficients dans un corps K (ℝ ou ℂ), les opérations que l'on peut leur appliquer (addition, multiplication, division), ainsi que l'étude de leurs racines et de leur factorisation.",
        qcm: [
          {
            question: "Dans quelles applications du génie des procédés les polynômes interviennent-ils ? (choisir la réponse la plus complète)",
            choices: ["Calibration de capteurs, équations d'état cubiques (Van der Waals), polynômes caractéristiques de systèmes dynamiques", "Seulement pour les intégrales numériques", "Uniquement pour les bilans matière", "Seulement pour la résolution de systèmes linéaires"],
            answer: 0,
            explanation: "Les polynômes sont omniprésents : ajustement de courbes de calibration (degré 2-3), équation de Van der Waals (cubique en V), polynôme caractéristique des EDO pour la stabilité."
          },
          {
            question: "Que représentent les racines d'un polynôme en génie des procédés ?",
            choices: ["Les points d'équilibre ou les pôles d'un système dynamique", "Les maxima de la fonction polynomiale", "Les coefficients de la matrice du système", "Les valeurs initiales des inconnues"],
            answer: 0,
            explanation: "Les racines réelles positives sont des états d'équilibre physiques ; les racines complexes à partie réelle négative indiquent un système stable."
          }
        ]
      },
      {
        title: "Définition",
        summary: "Un polynôme à coefficients dans K est P(X) = Σ_{k≥0} aₖXᵏ avec aₖ ∈ K, les termes étant nuls à partir d'un certain rang. Le degré est le plus grand entier n tel que aₙ ≠ 0. Par convention, le polynôme nul a pour degré −∞. Deux polynômes A et B sont égaux si et seulement si pour tout k, aₖ = bₖ (même coefficients à chaque degré). Vocabulaire : X est l'indéterminée, aₖ est le coefficient du terme de degré k, aₖXᵏ est un monôme de degré k, et K[X] désigne l'ensemble de tous les polynômes à coefficients dans K. Exemple du cours : P(X) = 1 + 3X² + 5X⁴ est de degré 4 dans ℝ[X] ; le coefficient de degré 2 est 3 ; le coefficient de degré 3 est nul (terme absent) ; le monôme de degré 4 est 5X⁴.",
        qcm: [
          {
            question: "Quelle est la liste de coefficients de P(X) = 2X³ − X + 3 pour l'algorithme de Horner ?",
            choices: ["[2, 0, −1, 3]", "[2, −1, 3]", "[2, 1, −1, 3]", "[3, −1, 0, 2]"],
            answer: 0,
            explanation: "Le terme X² est absent : son coefficient est 0. On écrit toujours tous les coefficients, y compris les nuls, par ordre décroissant."
          },
          {
            question: "En appliquant Horner à P(X) = 2X³ − X + 3 pour X = 2, quel est P(2) ?",
            choices: ["17", "15", "13", "21"],
            answer: 0,
            explanation: "b₃=2 ; b₂=2×2+0=4 ; b₁=4×2+(−1)=7 ; b₀=7×2+3=17. Vérification : 2×8−2+3=17 ✓."
          },
          {
            question: "Par convention, quel est le degré d'un polynôme constant non nul, par exemple P(X) = 5 ?",
            choices: ["0", "1", "−∞", "Indéfini"],
            answer: 0,
            explanation: "deg(5) = 0 car 5 = 5·X⁰. En revanche deg(0) = −∞ par convention."
          }
        ]
      },
      {
        title: "Opérations sur polynômes",
        summary: "Trois opérations fondamentales s'appliquent aux polynômes. Multiplication par un scalaire λ ≠ 0 : le polynôme λA a pour coefficients bₖ = λ·aₖ, et deg(λA) = deg A. Addition : le polynôme S = A + B a pour coefficients sₖ = aₖ + bₖ, et deg(S) ≤ max(deg A, deg B) (l'inégalité stricte est possible en cas d'annulations des coefficients dominants). Multiplication : le polynôme R = A·B a pour coefficients rₖ = Σ_{i+j=k} aᵢ·bⱼ, et deg(R) = deg(A) + deg(B). Pour la division, deux variantes : la division par puissances décroissantes (on ordonne par degrés décroissants et on divise comme en primaire) donne A = B·Q + R avec deg R < deg B ; B divise A si R = 0 ; cette division n'est utile que si deg A ≥ deg B. La division par puissances croissantes à l'ordre n consiste à ordonner par puissances croissantes et à s'arrêter dès que le reste est factorisable par X^{n+1} ; le degré de Q est inférieur à n ; c'est l'utilisation voulue qui impose l'ordre d'arrêt.",
        qcm: [
          {
            question: "Si deg(A) = 3 et deg(B) = 2, quel est deg(A·B) ?",
            choices: ["5", "6", "3", "2"],
            answer: 0,
            explanation: "deg(A·B) = deg(A) + deg(B) = 3 + 2 = 5. Le produit multiplie les degrés comme une addition."
          },
          {
            question: "Qu'énonce le théorème du reste pour la division de P par (X − a) ?",
            choices: ["Le reste est P(a)", "Le reste est P(0)", "Le reste est toujours nul", "Le reste est le coefficient dominant de P"],
            answer: 0,
            explanation: "P = Q·(X−a) + R avec R constante. En substituant X = a : P(a) = 0 + R → R = P(a)."
          },
          {
            question: "Que signifie P(a) = 0 pour la division euclidienne de P par (X − a) ?",
            choices: ["(X − a) divise P(X) exactement (reste nul)", "P est le polynôme nul", "a est le coefficient dominant de P", "Le quotient est nul"],
            answer: 0,
            explanation: "P(a) = 0 ⟺ reste = 0 ⟺ (X − a) | P(X). C'est le théorème du facteur, fondement de la factorisation."
          }
        ]
      },
      {
        title: "Racines des polynômes et factorisation",
        summary: "Factoriser un polynôme, c'est le mettre sous forme de PRODUIT de facteurs du type (X − nombre) ou (aX² + bX + c) avec Δ < 0 dans ℝ. Pour le second degré P(X) = aX² + bX + c : discriminant Δ = b² − 4ac ; si Δ > 0 deux racines réelles distinctes et P(X) = a(X − X₁)(X − X₂) ; si Δ = 0 racine double X₀ = −b/(2a) et P(X) = a(X − X₀)² ; si Δ < 0 pas de racine réelle. Par définition, X₀ est racine de P si P(X₀) = 0 ; dans ce cas, il existe un polynôme Q de degré n − 1 tel que P(X) = (X − X₀)·Q(X). L'ordre de multiplicité ν de X₀ est le plus grand entier tel que P soit divisible par (X − X₀)ν. Propriété : X₀ est d'ordre ν si et seulement si P(X₀) = P'(X₀) = … = P^{(ν−1)}(X₀) = 0. La somme des ordres de multiplicité est égale au degré du polynôme : Σνᵢ = n. Tout polynôme de degré ≥ 1 a au moins une racine complexe. Pour un polynôme à coefficients réels, les racines complexes sont conjuguées deux à deux. Factorisation dans ℂ : P(X) = aₙ·∏(X − Xᵢ)^νᵢ. Factorisation dans ℝ : les racines complexes conjuguées restent regroupées en facteurs irréductibles du second degré de la forme X² + |X₀|² − 2X·ℜ(X₀).",
        qcm: [
          {
            question: "Pour P(X) = X² − 5X + 6, quel est le discriminant Δ ?",
            choices: ["Δ = 1", "Δ = 4", "Δ = −1", "Δ = 25"],
            answer: 0,
            explanation: "Δ = b² − 4ac = 25 − 24 = 1. Racines : x = (5 ± 1)/2, soit x₁ = 3 et x₂ = 2."
          },
          {
            question: "Que se passe-t-il si Δ < 0 pour un polynôme de degré 2 à coefficients réels ?",
            choices: ["Pas de racine réelle, deux racines complexes conjuguées", "Une seule racine réelle double", "Deux racines réelles distinctes", "Le polynôme est identiquement nul"],
            answer: 0,
            explanation: "Δ < 0 implique √Δ imaginaire : les racines sont (−b ± i√|Δ|)/(2a), complexes conjuguées, sans partie réelle commune."
          },
          {
            question: "Pour chercher les racines rationnelles de P(X) = X³ − 6X² + 11X − 6, quels candidats teste-t-on ?",
            choices: ["±1, ±2, ±3, ±6 (diviseurs du terme constant 6)", "±1 seulement", "±6 seulement", "Tous les entiers de 0 à 6"],
            answer: 0,
            explanation: "Théorème des racines rationnelles : toute racine entière divise c₀ = 6. On teste ±1, ±2, ±3, ±6. Ici P(1) = 0 ✓."
          }
        ]
      },
      {
        title: "Division euclidienne : puissances décroissantes et croissantes",
        summary: "La division euclidienne par puissances décroissantes s'effectue en ordonnant le dividende A et le diviseur B par degrés décroissants, puis en divisant comme en primaire : on divise le terme de plus haut degré de A par celui de B pour obtenir le premier terme de Q, on soustrait, et on recommence. Le résultat est A = B·Q + R avec deg R < deg B. On dit que B divise A si R = 0. Cette division n'est pertinente que si deg A ≥ deg B. La division par puissances croissantes à l'ordre n s'effectue en ordonnant par puissances croissantes (de X⁰ vers Xⁿ). On s'arrête dès que le reste est factorisable par X^{n+1}, autrement dit dès que tous les termes du reste ont un degré supérieur à n. Le quotient Q obtenu vérifie deg Q < n. Contrairement à la division décroissante, cette division ne s'arrête a priori jamais : c'est l'utilisation prévue (développement limité, approximation à un certain ordre) qui impose l'ordre d'arrêt n.",
        qcm: [
          {
            question: "Dans le schéma de Horner pour diviser P(X) par (X − a), que représente la dernière valeur du tableau ?",
            choices: ["P(a), c'est-à-dire le reste de la division", "Le coefficient dominant du quotient", "Le degré de P", "La valeur de a²"],
            answer: 0,
            explanation: "La dernière valeur calculée est précisément P(a). Si P(a) = 0, a est une racine et la division est exacte."
          },
          {
            question: "Pour P(X) = X³ − 4X² + X + 6 et a = 2, quels sont les coefficients du quotient Q(X) ?",
            choices: ["1, −2, −3 donc Q(X) = X² − 2X − 3", "1, −4, 1 donc Q(X) = X² − 4X + 1", "1, 2, 3 donc Q(X) = X² + 2X + 3", "−4, 1, 6"],
            answer: 0,
            explanation: "Horner : b₂=1 ; b₁=1×2+(−4)=−2 ; b₀=−2×2+1=−3 ; reste=−3×2+6=0. Quotient Q(X)=X²−2X−3."
          },
          {
            question: "Quel est l'avantage principal de l'algorithme de Horner par rapport à l'évaluation directe ?",
            choices: ["Il ne nécessite que n multiplications et n additions (au lieu de ~2n)", "Il évite de trouver les racines", "Il fonctionne uniquement pour les polynômes de degré 2", "Il permet d'éviter la division euclidienne"],
            answer: 0,
            explanation: "Horner imbrique les multiplications : P(a) = (…((cₙ·a + cₙ₋₁)·a + …)·a + c₀, soit n multiplications et n additions exactement."
          }
        ]
      },
    ],
    examples: [
      {
        title: "Évaluation par Horner",
        problem: "Évaluer P(X) = 2X³ − X² + 3X − 4 en X = 2.",
        solution: "Coefficients : [2, −1, 3, −4]. b₃=2. b₂=2×2+(−1)=3. b₁=3×2+3=9. b₀=9×2+(−4)=14. P(2)=14.",
        applicationNote: "Très utilisé pour évaluer rapidement des corrélations polynomiales de Cp(T) à une température donnée."
      },
      {
        title: "Factorisation complète",
        problem: "Factoriser P(X) = X³ − 6X² + 11X − 6.",
        solution: "P(1) = 1−6+11−6 = 0 ✓. Division par (X−1) : Q(X) = X²−5X+6. Δ = 1. x₂ = 3, x₃ = 2. Factorisation : (X−1)(X−2)(X−3).",
        applicationNote: "La factorisation permet d'identifier les points d'équilibre d'un procédé décrits par une équation polynomiale."
      },
      {
        title: "Addition et multiplication de polynômes",
        problem: "Soit A(X) = 3X² − 2X + 1 et B(X) = X² + X − 3. Calculer S(X) = A + B et P(X) = A·B.",
        solution: "S(X) = (3+1)X² + (−2+1)X + (1−3) = 4X² − X − 2. Pour P(X) : (3X²)(X²) = 3X⁴ ; (3X²)(X) = 3X³ ; (3X²)(−3) = −9X² ; (−2X)(X²) = −2X³ ; (−2X)(X) = −2X² ; (−2X)(−3) = 6X ; (1)(X²) = X² ; (1)(X) = X ; (1)(−3) = −3. Regroupement : P(X) = 3X⁴ + (3−2)X³ + (−9−2+1)X² + (6+1)X − 3 = 3X⁴ + X³ − 10X² + 7X − 3. Vérification : P(1) = 3+1−10+7−3 = −2 = A(1)·B(1) = 2·(−1) = −2 ✓.",
        applicationNote: "La multiplication polynomiale est l'opération clé pour développer des équations d'état factorisées ou des fonctions de transfert de systèmes en série."
      },
      {
        title: "Division euclidienne complète",
        problem: "Diviser P(X) = 2X³ + 3X² − 5X + 1 par D(X) = X² − X + 2.",
        solution: "Étape 1 : 2X³ ÷ X² = 2X. Soustraire 2X·(X²−X+2) = 2X³−2X²+4X de P : reste (3X²+2X²) + (−5X−4X) + 1 = 5X² − 9X + 1. Étape 2 : 5X² ÷ X² = 5. Soustraire 5·(X²−X+2) = 5X²−5X+10 du reste : (−9X+5X) + (1−10) = −4X − 9. Résultat : P(X) = (2X + 5)·(X²−X+2) + (−4X − 9). Vérification : deg(R) = 1 < deg(D) = 2 ✓. Vérification numérique en X=0 : P(0) = 1 ; Q(0)·D(0)+R(0) = 5·2+(−9) = 1 ✓.",
        applicationNote: "La division euclidienne est le premier pas de la décomposition en éléments simples des fractions rationnelles (chapitre FRAT)."
      },
      {
        title: "Racines d'un polynôme de degré 3 — application Van der Waals",
        problem: "Trouver toutes les racines de P(X) = X³ − 3X² − X + 3.",
        solution: "Racines entières candidates : ±1, ±3. P(1) = 1−3−1+3 = 0 ✓. Division par (X−1) : P(X) = (X−1)(X²−2X−3). Discriminant de X²−2X−3 : Δ = 4+12 = 16. Racines : x = (2±4)/2, donc x₂ = 3 et x₃ = −1. Factorisation complète : P(X) = (X−1)(X−3)(X+1). Vérification : P(3) = 27−27−3+3 = 0 ✓ et P(−1) = −1−3+1+3 = 0 ✓.",
        applicationNote: "Pour l'équation de Van der Waals cubique en V, on cherche de même les racines réelles positives, qui représentent les volumes molaires possibles (liquide, vapeur ou état intermédiaire)."
      }
    ]
  },
  {
    code: "FVAR",
    semester: "S2",
    title: "Fonctions de Plusieurs Variables",
    focus: [
      "Dérivées partielles ∂f/∂x et ∂f/∂y",
      "Gradient et direction de montée maximale",
      "Intégrales doubles",
      "Applications thermodynamiques (gaz parfait, Van der Waals)",
    ],
    objective:
      "Maîtriser le calcul différentiel et intégral pour les fonctions à plusieurs variables, et l'appliquer à des problèmes de physico-chimie (thermodynamique, transfert de chaleur).",
    prerequisites: [
      "Dérivation et intégration d'une variable",
      "Algèbre linéaire de base",
      "Notions de thermodynamique (P, V, T, n)",
    ],
    applications: [
      "Équation d'état des gaz parfaits PV = nRT",
      "Équation de Van der Waals pour gaz réels",
      "Équation de la chaleur (diffusion thermique)",
      "Optimisation de coûts de procédés industriels",
    ],
    lessons: [
      {
        title: "Exemple introductif et définition des fonctions de plusieurs variables",
        summary: "Exemple introductif : le volume V d'un gaz parfait est donné par V = nRT/P, qui est une fonction de trois variables n, T et P. On écrit formellement V : ℝ₊³ → ℝ₊, (n, T, P) ↦ nRT/P. Définition générale : une fonction de n variables est une application f : E → F dont le domaine de définition D = D₁ × D₂ × … × Dₙ est un produit cartésien. La représentation graphique d'une fonction de 2 variables est une surface dans ℝ³ : à chaque point (x ; y) du domaine on associe un point (x ; y ; z = f(x ; y)) dans l'espace tridimensionnel.",
        qcm: [
          {
            question: "Quel est le domaine de définition de f(x, y) = ln(x + y) ?",
            choices: ["x + y > 0 (demi-plan strictement positif)", "x > 0 et y > 0 séparément", "x + y ≥ 0", "Tous les (x, y) ∈ ℝ²"],
            answer: 0,
            explanation: "Le logarithme est défini uniquement pour des valeurs strictement positives. Il faut donc x + y > 0."
          },
          {
            question: "Que représentent les courbes de niveau f(x, y) = c pour f = P(T, V) = nRT/V ?",
            choices: ["Des isothermes (T constant), appelées isothermes de Boyle", "Des isobares (P constant)", "Des isochores (V constant)", "Des courbes de chaleur spécifique"],
            answer: 0,
            explanation: "Les courbes de niveau de P(T,V) = const correspondent à T constant : ce sont les isothermes de Boyle PV = const."
          },
          {
            question: "En combien de dimensions vit le graphe d'une fonction f(x, y) ?",
            choices: ["3 dimensions (surface dans ℝ³)", "2 dimensions (courbe dans ℝ²)", "4 dimensions", "1 dimension"],
            answer: 0,
            explanation: "f associe à chaque point (x, y) du plan ℝ² une valeur z = f(x,y) : le graphe est une surface dans ℝ³."
          }
        ]
      },
      {
        title: "Dérivées partielles d'ordre 1 et d'ordres supérieurs",
        summary: "La dérivée partielle ∂f/∂xᵢ est obtenue en dérivant f par rapport à xᵢ en gardant toutes les autres variables constantes. Sa définition par limite est : ∂f/∂xᵢ = lim_{h→0} [f(…, xᵢ + h, …) − f(…, xᵢ, …)] / h. La notation ∂f/∂xᵢ|_{xⱼ, j≠i} rappelle que les autres variables sont fixées. Attention : pour une fonction d'une seule variable, on écrit df/dx et non ∂f/∂x. Les dérivées d'ordre supérieur se calculent à partir des dérivées d'ordre précédent : on définit ∂²f/∂x², ∂²f/∂y², ∂²f/∂x∂y et ∂²f/∂y∂x. Résultat fondamental : ∂²f/∂y∂x = ∂²f/∂x∂y toujours (les dérivées mixtes sont égales). De même, les dérivées d'ordre n se calculent à partir des dérivées d'ordre n − 1.",
        qcm: [
          {
            question: "Comment calcule-t-on ∂f/∂x pour f(x, y) = 3x²y + y³ ?",
            choices: ["On dérive par rapport à x en traitant y comme une constante : ∂f/∂x = 6xy", "On dérive par rapport aux deux variables simultanément", "On pose y = 0 puis on dérive", "∂f/∂x = 3x² + 3y²"],
            answer: 0,
            explanation: "∂f/∂x = 6xy (y est une constante). De même ∂f/∂y = 3x² + 3y²."
          },
          {
            question: "Qu'affirme le théorème de Schwarz sur les dérivées mixtes ?",
            choices: ["∂²f/∂x∂y = ∂²f/∂y∂x si f est de classe C²", "∂f/∂x = ∂f/∂y en tout point", "Les dérivées partielles d'ordre 2 sont toujours nulles", "On ne peut pas dériver deux fois en variables différentes"],
            answer: 0,
            explanation: "Si f est suffisamment régulière (C²), l'ordre de dérivation n'a pas d'importance : on peut dériver d'abord par rapport à x puis y, ou l'inverse."
          },
          {
            question: "Que modélise l'équation aux dérivées partielles ∂u/∂t = k·∂²u/∂x² ?",
            choices: ["La diffusion thermique (équation de la chaleur)", "La propagation d'une onde sonore", "Un bilan matière en régime permanent", "La loi de Van der Waals"],
            answer: 0,
            explanation: "L'équation de la chaleur décrit comment la température u(x,t) évolue au cours du temps par diffusion thermique dans un milieu."
          }
        ]
      },
      {
        title: "Différentielle d'une fonction de plusieurs variables",
        summary: "La différentielle d'une fonction f de n variables est df = Σᵢ (∂f/∂xᵢ) dxᵢ = (∂f/∂x₁) dx₁ + (∂f/∂x₂) dx₂ + … + (∂f/∂xₙ) dxₙ. Elle représente la variation infinitésimale de f résultant des variations infinitésimales dxᵢ de chaque variable. Autrement dit, df donne l'approximation linéaire de la variation de f lorsque chaque variable subit une petite variation dxᵢ, la contribution de chaque variable étant pondérée par la dérivée partielle correspondante.",
        qcm: [
          {
            question: "Quelle est l'expression de la différentielle totale df de f(x, y) ?",
            choices: ["df = (∂f/∂x) dx + (∂f/∂y) dy", "df = ∂f/∂x + ∂f/∂y", "df = f(x+dx, y+dy)", "df = (∂²f/∂x²) dx² + (∂²f/∂y²) dy²"],
            answer: 0,
            explanation: "La différentielle totale donne la variation linéaire approchée de f pour de petits déplacements (dx, dy)."
          },
          {
            question: "Si x = x(t) et y = y(t), comment s'écrit df/dt (règle de la chaîne) ?",
            choices: ["df/dt = (∂f/∂x)(dx/dt) + (∂f/∂y)(dy/dt)", "df/dt = ∂f/∂t", "df/dt = (∂f/∂x)·(∂f/∂y)", "df/dt = dx/dt + dy/dt"],
            answer: 0,
            explanation: "La règle de la chaîne généralise la dérivation en chaîne : chaque variable contribue selon sa dérivée partielle fois sa vitesse de variation."
          },
          {
            question: "Quelle est la condition d'exactitude de la différentielle M(x,y) dx + N(x,y) dy ?",
            choices: ["∂M/∂y = ∂N/∂x", "M = N", "∂M/∂x = ∂N/∂y", "M·N = 0"],
            answer: 0,
            explanation: "Par le théorème de Schwarz, si ∂M/∂y = ∂N/∂x, la forme différentielle est exacte : elle dérive d'une fonction potentiel (fonction d'état en thermodynamique)."
          }
        ]
      },
      {
        title: "Équations aux dérivées partielles (EDP)",
        summary: "Une EDP est une équation faisant intervenir les dérivées partielles d'une fonction inconnue. Exemples du cours : (1) ∂²f/∂x² = 0 avec ∂²f/∂x∂y = 3y², f(1,0) = 0 et f(0,0) = 1 ; (2) ∂f/∂x = 2xy + y² et ∂f/∂y = x² + 2xy avec f(0,0) = 3 ; (3) ∂²f/∂x² + f(x,y) = 0 et ∂f/∂y = cos(x) avec f(0,0) = 3. Application importante : la fonction T(x,t) = T₀ e^{−αx} sin(ωt − αx) avec α = √(ωρc / 2λ) vérifie l'équation de la chaleur ∂²T/∂x² = (ρc/λ) ∂T/∂t. Cette équation modélise la diffusion thermique dans un milieu (par exemple, la propagation des variations de température dans le sol en fonction de la profondeur x et du temps t).",
        qcm: [
          {
            question: "Qu'est-ce qui distingue une EDP d'une EDO classique ?",
            choices: ["Une EDP fait intervenir des dérivées partielles par rapport à plusieurs variables indépendantes", "Une EDP n'a pas de solution", "Une EDP est linéaire par définition", "Une EDP concerne uniquement les fonctions d'une variable"],
            answer: 0,
            explanation: "Dans une EDO, l'inconnue dépend d'une seule variable. Dans une EDP, l'inconnue (ex. T(x,t)) dépend de plusieurs variables indépendantes et l'équation fait intervenir ses dérivées partielles."
          },
          {
            question: "L'équation de la chaleur ∂T/∂t = k·∂²T/∂x² modélise :",
            choices: ["La diffusion thermique : comment la température T(x,t) évolue dans le temps par conduction", "La propagation d'une onde sonore", "L'équation d'état des gaz parfaits", "Un bilan matière en régime stationnaire"],
            answer: 0,
            explanation: "L'équation de la chaleur est une EDP du 2ème ordre en espace et du 1er ordre en temps. Elle décrit comment une distribution de température diffuse dans un milieu au cours du temps."
          },
          {
            question: "Pour résoudre ∂f/∂x = 2xy + y², on intègre par rapport à x en traitant y comme une constante. Le résultat est :",
            choices: ["f(x, y) = x²y + xy² + C(y), où C(y) est une fonction arbitraire de y", "f(x, y) = x²y + xy² + C (constante)", "f(x, y) = 2y + 0 (on dérive par rapport à x uniquement)", "f(x, y) = x² + y²"],
            answer: 0,
            explanation: "En intégrant par rapport à x, y est constante : ∫(2xy + y²)dx = x²y + xy² + C(y). La constante d'intégration peut être une fonction quelconque de y, à déterminer via la deuxième condition."
          }
        ]
      },
      {
        title: "Intégrales multiples",
        summary: "Pour calculer une intégrale multiple I = ∫∫…∫ f(x₁ ; … ; xₙ) dxₙ … dx₁, on intègre successivement par rapport à chaque variable en gardant les autres constantes. On commence par intégrer selon xₙ, ce qui donne une fonction g(x₁, …, xₙ₋₁), puis on intègre selon xₙ₋₁, et ainsi de suite. L'ordre d'intégration n'a pas d'importance : le résultat est le même quelle que soit la variable par laquelle on commence. Exemple du cours : ∫₀¹ ∫₀^π ∫₋₁² x z² sin(y) dz dy dx — on intègre d'abord selon z, puis selon y, puis selon x. Application : le calcul de l'aire d'un disque de rayon R par intégrale double en coordonnées polaires donne A = ∫₀ᴿ ∫₀^{2π} r dr dθ = πR².",
        qcm: [
          {
            question: "Quel théorème permet d'évaluer une intégrale double comme deux intégrales simples successives ?",
            choices: ["Le théorème de Fubini : ∬_D f dA = ∫_a^b (∫_{g(x)}^{h(x)} f dy) dx", "Le théorème de Schwarz sur les dérivées mixtes", "Le théorème de Gauss-Jordan", "Le théorème des accroissements finis"],
            answer: 0,
            explanation: "Fubini autorise de décomposer une intégrale double en deux intégrales simples imbriquées. On intègre d'abord par rapport à la variable intérieure en fixant l'autre, puis on intègre le résultat."
          },
          {
            question: "Pour calculer ∫₀¹ ∫₀^π x·sin(y) dy dx, quelle est la bonne démarche ?",
            choices: ["Intégrer d'abord par rapport à y (variable intérieure) en traitant x comme une constante, puis intégrer le résultat par rapport à x", "Intégrer simultanément par rapport aux deux variables", "Calculer ∂(x·sin y)/∂x d'abord", "Poser u = x·sin y et changer de variable"],
            answer: 0,
            explanation: "On applique Fubini : ∫₀¹ [∫₀^π x·sin(y) dy] dx = ∫₀¹ x·[−cos(y)]₀^π dx = ∫₀¹ 2x dx = [x²]₀¹ = 1."
          },
          {
            question: "En coordonnées polaires (r, θ), l'aire du disque de rayon R se calcule par ∬ r dr dθ. Le résultat est :",
            choices: ["A = πR² (en intégrant r de 0 à R et θ de 0 à 2π)", "A = 2πR", "A = R²", "A = 4πR²"],
            answer: 0,
            explanation: "∫₀^{2π} ∫₀^R r dr dθ = 2π · [r²/2]₀^R = 2π · R²/2 = πR². Le jacobien de la transformation polaire est r, d'où le facteur r dans l'intégrale."
          }
        ]
      },
    ],
    examples: [
      {
        title: "Dérivées partielles d'un polynôme",
        problem: "Soit f(x,y) = 2x²y + 3xy². Calculer ∂f/∂x et ∂f/∂y.",
        solution: "∂f/∂x = 4xy + 3y² (y traité comme constante) ; ∂f/∂y = 2x² + 6xy (x traité comme constante).",
        applicationNote: "Même méthode pour les équations d'état thermodynamiques."
      },
      {
        title: "Gradient et gaz parfait",
        problem: "P(V,T) = nRT/V avec n = 1 mol, R = 8.314. Calculer ∇P en (V=0.025 m³, T=300 K).",
        solution: "∂P/∂T = R/V = 8.314/0.025 = 332.6 Pa/K ; ∂P/∂V = −RT/V² = −8.314×300/0.025² = −2494.2/6.25×10⁻⁴ = −3 990 720 Pa/m³. Gradient ∇P = (332.6, −3 990 720).",
        applicationNote: "La grande valeur de ∂P/∂V montre la forte sensibilité de la pression au volume."
      },
      {
        title: "Domaine de définition d'une fonction de deux variables",
        problem: "Déterminer le domaine de définition de f(x, y) = ln(x + y − 1) / √(4 − x² − y²).",
        solution: "Condition 1 (logarithme) : x + y − 1 > 0 ↔ y > 1 − x (demi-plan strictement au-dessus de la droite x + y = 1). Condition 2 (racine carrée au dénominateur) : 4 − x² − y² > 0 (strict car dénominateur ≠ 0) ↔ x² + y² < 4 (intérieur strict du disque de rayon 2). Domaine D : {(x, y) ∈ ℝ² | x² + y² < 4 ET x + y > 1}. C'est l'intersection d'un disque ouvert et d'un demi-plan ouvert.",
        applicationNote: "En thermodynamique, déterminer le domaine de définition d'une équation d'état (P, V, T) revient à identifier les plages physiquement accessibles (volume > b, T > 0, etc.)."
      },
      {
        title: "Dérivées partielles d'ordre 2 et matrice hessienne",
        problem: "Soit f(x, y) = x³ + xy² − 3x. Calculer toutes les dérivées partielles d'ordre 2 et la matrice hessienne en (1, 0).",
        solution: "∂f/∂x = 3x² + y² − 3 ; ∂f/∂y = 2xy. Dérivées d'ordre 2 : ∂²f/∂x² = 6x ; ∂²f/∂y² = 2x ; ∂²f/∂x∂y = 2y ; ∂²f/∂y∂x = 2y (Schwarz ✓). Hessienne : H(x,y) = [[6x, 2y],[2y, 2x]]. En (1, 0) : H(1,0) = [[6, 0],[0, 2]]. det(H) = 12 > 0 et ∂²f/∂x²|_(1,0) = 6 > 0 → (1, 0) est un minimum local. Vérification : ∇f(1,0) = (3+0−3, 0) = (0, 0) ✓, c'est bien un point critique.",
        applicationNote: "La matrice hessienne est l'outil standard pour l'optimisation de fonctions de coût ou de rendement dépendant de plusieurs paramètres opératoires."
      },
      {
        title: "Intégrale double sur domaine triangulaire",
        problem: "Calculer ∬_D (x + y) dA où D est le triangle de sommets (0,0), (1,0), (0,1).",
        solution: "Le domaine D est défini par : 0 ≤ x ≤ 1 et 0 ≤ y ≤ 1 − x. Intégrale intérieure : ∫_0^{1−x} (x+y) dy = [xy + y²/2]_0^{1−x} = x(1−x) + (1−x)²/2 = (1−x)(x + (1−x)/2) = (1−x)(x/2 + 1/2) = (1−x)(1+x)/2 = (1−x²)/2. Intégrale extérieure : ∫_0^1 (1−x²)/2 dx = (1/2)[x − x³/3]_0^1 = (1/2)(1 − 1/3) = (1/2)(2/3) = 1/3. Résultat : ∬_D (x+y) dA = 1/3.",
        applicationNote: "Les intégrales sur domaines triangulaires apparaissent dans le calcul de flux thermiques sur des surfaces d'échange de géométrie complexe."
      }
    ],
  },
  {
    code: "FRAT",
    semester: "S2",
    title: "Fractions Rationnelles et Transformée de Laplace",
    focus: [
      "Décomposition en éléments simples (DES)",
      "Pôles simples, pôles doubles, pôles complexes conjugués",
      "Intégration par DES",
      "Transformée de Laplace inverse et réponse indicielle",
    ],
    objective:
      "Maîtriser la décomposition en éléments simples pour intégrer des fractions rationnelles et inverser des transformées de Laplace, outils essentiels en automatique et en génie chimique.",
    prerequisites: [
      "Calcul de racines d'un polynôme (méthode algébrique, discriminant)",
      "Intégration de fractions simples (ln, arctan)",
      "Notions de base en automatique (fonction de transfert)",
    ],
    applications: [
      "Inversion de transformées de Laplace en automatique",
      "Réponse temporelle de systèmes du 1er et 2nd ordre",
      "Calcul d'intégrales en modélisation de procédés",
      "Analyse de stabilité par position des pôles",
    ],
    lessons: [
      {
        title: "Fractions rationnelles",
        summary: "Une fraction rationnelle est un quotient F(X) = N(X)/D(X) où N est le numérateur et D le dénominateur (D est un polynôme non nul). Exemples : X²/(3X + 1), 1/((X − 2)(X + 3)), X³/(X⁷ + X⁴ − 1). Opérations : l'addition s'effectue en mettant au même dénominateur ; la multiplication donne N₁N₂/D₁D₂ ; la simplification est possible si N et D ont une racine commune R : on écrit N = Ñ·R et D = D̃·R pour obtenir F = Ñ/D̃ ; une fraction est irréductible s'il n'existe plus de racine commune. Partie entière E(X) et reste R(X) : on effectue la division euclidienne N = D·E + R avec deg R < deg D, ce qui donne F = E + R/D. Si deg N < deg D, alors E = 0. Si deg N = deg D, alors E est une constante égale à lim_{X→∞} F(X). Pôles : Y₀ est pôle de F irréductible si D(Y₀) = 0 et N(Y₀) ≠ 0 ; si Y₀ est racine de D d'ordre α, alors Y₀ est pôle d'ordre α.",
        qcm: [
          {
            question: "F(X) = P(X)/Q(X) est dite propre quand :",
            choices: ["deg P < deg Q", "deg P = deg Q", "deg P > deg Q", "Q est constant"],
            answer: 0,
            explanation: "Une fraction propre (strictement propre) vérifie deg P < deg Q. C'est la condition pour appliquer directement la DES sans division préalable."
          },
          {
            question: "Pour F(X) = (X²+1)/(X²−1), que faut-il faire avant la DES ?",
            choices: ["Effectuer la division euclidienne pour extraire la partie entière", "Factoriser le numérateur", "Chercher les racines de X²+1", "Rien, on peut décomposer directement"],
            answer: 0,
            explanation: "deg(num) = deg(dén) = 2 → fraction impropre. Division : X²+1 = 1·(X²−1) + 2, soit F = 1 + 2/(X²−1). On applique la DES à la partie propre 2/((X−1)(X+1))."
          },
          {
            question: "Que sont les pôles d'une fraction rationnelle F(X) = P(X)/Q(X) ?",
            choices: ["Les racines du dénominateur Q(X)", "Les racines du numérateur P(X)", "Les valeurs où F(X) = 0", "Les coefficients de Q"],
            answer: 0,
            explanation: "Les pôles sont les valeurs de X qui annulent Q(X). Un pôle d'ordre m correspond à une racine de multiplicité m de Q."
          }
        ]
      },
      {
        title: "Décomposition en éléments simples des fractions rationnelles",
        summary: "La décomposition en éléments simples (DES) suit quatre étapes. Étape 1 — déterminer la partie entière (effectuer la division euclidienne si deg N ≥ deg D). Étape 2 — factoriser le dénominateur dans ℝ ou ℂ. Étape 3 — poser la forme générale de la DES selon la nature des pôles et leurs multiplicités : à chaque facteur (X − X₀)ⁿ on associe n termes A₁/(X − X₀) + A₂/(X − X₀)² + … + Aₙ/(X − X₀)ⁿ ; à chaque facteur irréductible (X² + pX + q)ⁿ dans ℝ on associe n termes (a₁X + b₁)/(X² + pX + q) + … + (aₙX + bₙ)/(X² + pX + q)ⁿ. Étape 4 — déterminer les coefficients par trois méthodes : (a) résidus : pour un pôle simple a, le coefficient est A = (X − a)·F(X)|_{X=a} ; (b) valeurs particulières : substituer des valeurs de X qui ne sont pas des pôles ; (c) division par puissances croissantes pour les pôles multiples : poser h = X − a, développer N(a + h)/D(a + h) par puissances croissantes. Lien ℂ↔ℝ : pour les pôles complexes conjugués Z₁ et Z₂, les coefficients réels a et b des termes de 2ᵉ espèce s'obtiennent via a = A + B et b = −(AZ₁ + BZ₂) où A et B sont les résidus complexes.",
        qcm: [
          {
            question: "Quelle est la 1ère étape de la décomposition en éléments simples ?",
            choices: ["Vérifier que F est propre (deg P < deg Q)", "Factoriser le numérateur", "Identifier les coefficients par valeurs particulières", "Calculer la dérivée de F"],
            answer: 0,
            explanation: "On doit d'abord s'assurer que la fraction est propre. Si elle est impropre, on effectue la division euclidienne pour extraire la partie entière."
          },
          {
            question: "Pour une racine simple r de Q, comment calcule-t-on le résidu A par la méthode de couverture ?",
            choices: ["A = [(X−r)·F(X)] évalué en X = r", "A = F(r)", "A = F'(r)", "A = Q'(r)"],
            answer: 0,
            explanation: "On multiplie F par (X−r) — ce qui couvre le facteur (X−r) au dénominateur — puis on évalue en X = r : A = lim_{X→r}(X−r)·F(X)."
          },
          {
            question: "Quel terme de décomposition correspond à un facteur quadratique irréductible X²+pX+q (Δ < 0) ?",
            choices: ["(AX + B)/(X²+pX+q)", "A/(X²+pX+q)", "A/(X−r₁) + A/(X−r₂) avec r₁,r₂ complexes", "A·X + B"],
            answer: 0,
            explanation: "Un facteur irréductible du second degré donne un terme de la forme (AX+B)/(X²+pX+q). On trouve A et B par identification."
          }
        ]
      },
      {
        title: "Primitives des fractions rationnelles réelles",
        summary: "Pour calculer la primitive d'une fraction rationnelle, on effectue toujours d'abord la DES, puis on intègre terme à terme. Éléments de 1ʳᵉ espèce A/(X − a)ⁿ : si n = 1, la primitive est A·ln|X − a| + cste ; si n > 1, la primitive est −A / ((n−1)(X − a)^{n−1}) + cste. Éléments de 2ᵉ espèce (aX + b)/(X² + pX + q) avec X² + pX + q irréductible dans ℝ (Δ < 0) : on décompose l'intégrale en I = (a/2)·I₁ + (b − ap/2)·I₂ où I₁ = ln|X² + pX + q| et I₂ = (1/δ)·arctan((X + p/2)/δ) avec δ = √(q − (p/2)²) > 0. La formule résumée est : ∫ (at + b)/(t² + pt + q) dt = (a/2) ln|X² + pX + q| + (b − ap/2)/δ · arctan((X + p/2)/δ) + cste.",
        qcm: [
          {
            question: "Quelle est la primitive de A/(X − r) ?",
            choices: ["A·ln|X − r| + C", "A/(X − r)² + C", "A·e^(X−r) + C", "A·arctan(X − r) + C"],
            answer: 0,
            explanation: "C'est la primitive fondamentale de 1/(X−r). Elle apparaît chaque fois qu'on intègre un terme issu d'un pôle simple."
          },
          {
            question: "Quelle est la primitive de B/(X − r)² (pôle double) ?",
            choices: ["−B/(X − r) + C", "B·ln|X − r| + C", "2B/(X − r)³ + C", "B·(X−r) + C"],
            answer: 0,
            explanation: "∫(X−r)^(−2) dX = (X−r)^(−1)/(−1) = −1/(X−r). Donc ∫B/(X−r)² dX = −B/(X−r) + C."
          },
          {
            question: "En transformée de Laplace inverse, L⁻¹{A/(s − r)} vaut :",
            choices: ["A·e^(rt) pour t ≥ 0", "A·r·t", "A·e^(−rt)", "A·sin(rt)"],
            answer: 0,
            explanation: "L{e^(rt)} = 1/(s−r), donc L⁻¹{A/(s−r)} = A·e^(rt)·1(t). Si r < 0, ce terme s'amortit (stable)."
          }
        ]
      },
      {
        title: "Transformée de Laplace — définition et propriétés",
        summary: "La transformée de Laplace d'une fonction causale f(t) (définie pour t ≥ 0) est F(s) = L{f(t)} = ∫₀^+∞ f(t)·e^(−st) dt, où s ∈ ℂ est la variable de Laplace. Transformées usuelles à connaître : L{1(t)} = 1/s ; L{t} = 1/s² ; L{tⁿ} = n!/s^(n+1) ; L{e^(at)} = 1/(s−a) ; L{sin(ωt)} = ω/(s²+ω²) ; L{cos(ωt)} = s/(s²+ω²). Propriétés fondamentales : (1) Linéarité : L{af+bg} = aF+bG. (2) Dérivation : L{f'(t)} = s·F(s) − f(0⁺), L{f''(t)} = s²F(s) − sf(0⁺) − f'(0⁺). Cette propriété est la raison principale de l'utilisation de Laplace : elle transforme les EDO en équations algébriques. (3) Décalage en s (amortissement) : L{e^(at)·f(t)} = F(s−a). (4) Valeur initiale : lim_{t→0⁺} f(t) = lim_{s→+∞} s·F(s). (5) Valeur finale : lim_{t→+∞} f(t) = lim_{s→0} s·F(s) (si la limite existe, c.-à-d. si tous les pôles de sF(s) sont à partie réelle strictement négative). En génie des procédés, la transformée de Laplace permet de calculer la réponse temporelle d'un procédé décrit par une EDO : Laplace → algèbre → DES → Laplace inverse → f(t).",
        qcm: [
          {
            question: "Quelle est la transformée de Laplace de e^(at) ?",
            choices: ["1/(s − a) pour s > a", "1/(s + a)", "a/(s² + a²)", "s/(s² + a²)"],
            answer: 0,
            explanation: "C'est une transformée fondamentale à connaître : L{e^(at)} = 1/(s−a). Elle est valable pour s > a (convergence de l'intégrale)."
          },
          {
            question: "Quel est le principal avantage de la transformée de Laplace pour résoudre des EDO ?",
            choices: ["Elle transforme les EDO en équations algébriques (plus simples à résoudre)", "Elle élimine les conditions initiales", "Elle transforme les intégrales en dérivées", "Elle s'applique seulement aux fonctions constantes"],
            answer: 0,
            explanation: "La propriété de dérivation L{f'(t)} = s·F(s) − f(0⁺) transforme chaque dérivée en multiplication par s. L'EDO devient une équation algébrique en F(s)."
          },
          {
            question: "Comment calcule-t-on la valeur finale lim_{t→+∞} f(t) à partir de F(s) ?",
            choices: ["lim_{s→0} s·F(s) (théorème de la valeur finale)", "lim_{s→+∞} s·F(s)", "lim_{s→0} F(s)", "F(0)"],
            answer: 0,
            explanation: "Théorème de la valeur finale : lim_{t→∞} f(t) = lim_{s→0} s·F(s), applicable si tous les pôles de sF(s) sont à partie réelle négative."
          }
        ]
      },
      {
        title: "Analyse fréquentielle et stabilité des procédés",
        summary: "La fonction de transfert d'un système linéaire est G(s) = Y(s)/U(s), rapport de la sortie Y sur l'entrée U dans le domaine de Laplace. Pour un système du 1ᵉʳ ordre : G(s) = K/(τs+1), avec K le gain statique et τ la constante de temps. Réponse indicielle (entrée échelon U(s) = 1/s) : Y(s) = K/(s(τs+1)) → y(t) = K(1 − e^(−t/τ)). Pour un système du 2ᵉ ordre standard : G(s) = ωₙ²/(s²+2ζωₙs+ωₙ²) avec ωₙ la pulsation naturelle et ζ le facteur d'amortissement. Régimes : ζ > 1 sur-amorti (2 pôles réels négatifs, pas d'oscillation) ; ζ = 1 amortissement critique (pôle double) ; 0 < ζ < 1 sous-amorti (pôles complexes conjugués, oscillations amorties) ; ζ = 0 oscillant permanent ; ζ < 0 instable. Critère de stabilité : le système est stable si et seulement si tous les pôles de G(s) ont une partie réelle strictement négative (pôles dans le demi-plan gauche). La DES est l'outil central pour calculer la réponse temporelle : inverser Y(s) = G(s)·U(s) par décomposition en éléments simples puis inversion terme à terme.",
        qcm: [
          {
            question: "Un système est stable si et seulement si :",
            choices: ["Tous les pôles de G(s) ont une partie réelle strictement négative", "Le gain statique K > 0", "Les pôles sont réels", "La fonction de transfert est propre"],
            answer: 0,
            explanation: "Critère de stabilité BIBO : pôles dans le demi-plan gauche ouvert (Re(pôle) < 0). Tout pôle à partie réelle positive ou nulle rend le système instable ou marginalement stable."
          },
          {
            question: "Pour un système du 2ᵉ ordre avec ζ > 1, quel est le régime de réponse ?",
            choices: ["Sur-amorti : 2 pôles réels négatifs, pas d'oscillation", "Sous-amorti : oscillations amorties", "Amortissement critique : pôle double", "Instable : oscillations croissantes"],
            answer: 0,
            explanation: "ζ > 1 → discriminant positif → 2 pôles réels distincts négatifs → réponse exponentielle décroissante sans oscillation."
          },
          {
            question: "Quelle est la réponse indicielle (échelon) d'un système du 1ᵉʳ ordre G(s) = K/(τs+1) ?",
            choices: ["y(t) = K(1 − e^(−t/τ))", "y(t) = K·e^(−t/τ)", "y(t) = K·t·e^(−t/τ)", "y(t) = K·sin(t/τ)"],
            answer: 0,
            explanation: "Y(s) = K/(s(τs+1)) → DES → K/s − Kτ/(τs+1) → inversion → y(t) = K(1 − e^(−t/τ)). La réponse tend vers K en régime permanent."
          }
        ]
      },
    ],
    examples: [
      {
        title: "DES pôles simples",
        problem: "F(X) = 3/((X − 2)(X + 1)). Décomposer.",
        solution: "A = 3/(2+1) = 1 (couverture en X=2) ; B = 3/(−1−2) = −1 (couverture en X=−1). F(X) = 1/(X−2) − 1/(X+1). Vérification : [1·(X+1) − 1·(X−2)] / [(X−2)(X+1)] = 3/[(X−2)(X+1)]. ✓",
        applicationNote: "Méthode des résidus directement applicable à l'inversion de Laplace en automatique."
      },
      {
        title: "Inversion Laplace avec pôles complexes",
        problem: "F(s) = (2s + 3)/((s+1)² + 4). Trouver f(t) = L⁻¹{F(s)}.",
        solution: "Réécrire : (2s+3) = 2(s+1) + 1. Donc F(s) = 2(s+1)/((s+1)²+4) + (1/2)·2/((s+1)²+4). f(t) = 2e^(−t)cos(2t) + (1/2)e^(−t)sin(2t).",
        applicationNote: "Technique essentielle pour la réponse temporelle des systèmes du 2nd ordre sous-amortis."
      },
      {
        title: "DES fraction propre — pôles simples — intégration complète",
        problem: "Décomposer F(X) = (X + 4)/((X − 1)(X + 3)) puis calculer ∫F(X) dX.",
        solution: "Résidu en X=1 : A = (1+4)/((1+3)) = 5/4. Résidu en X=−3 : B = (−3+4)/((−3−1)) = 1/(−4) = −1/4. DES : F(X) = (5/4)/(X−1) − (1/4)/(X+3). Vérification en X=0 : F(0) = 4/(−1·3) = −4/3. DES(0) : (5/4)/(−1) − (1/4)/(3) = −5/4 − 1/12 = −15/12 − 1/12 = −16/12 = −4/3 ✓. Intégrale : ∫F dX = (5/4)·ln|X−1| − (1/4)·ln|X+3| + C.",
        applicationNote: "Ce type d'intégrale apparaît dans la résolution analytique de bilans de procédé en régime transitoire et dans le calcul de temps de résidence."
      },
      {
        title: "DES avec pôle double — identification complète",
        problem: "Décomposer G(X) = (2X + 1)/((X−2)²·(X+1)).",
        solution: "Forme : A/(X−2) + B/(X−2)² + C/(X+1). Résidu B en X=2 : B = (2·2+1)/((2+1)) = 5/3. Résidu C en X=−1 : C = (2·(−1)+1)/(((−1)−2)²) = (−1)/(9) = −1/9. Pour A : multiplier par (X−2)² et différencier par rapport à X, évaluer en X=2. G·(X−2)² = (2X+1)/(X+1). Sa dérivée : [(2)(X+1) − (2X+1)(1)]/(X+1)² = [2X+2−2X−1]/(X+1)² = 1/(X+1)². En X=2 : A = 1/(3)² = 1/9. Vérification en X=0 : G(0) = 1/((−2)²·1) = 1/4. DES(0) : (1/9)/(−2) + (5/3)/(4) + (−1/9)/(1) = −1/18 + 5/12 − 1/9 = −2/36 + 15/36 − 4/36 = 9/36 = 1/4 ✓.",
        applicationNote: "Les pôles doubles en Laplace correspondent à des termes t·e^(at) dans la réponse temporelle, caractéristiques d'un système à amortissement critique."
      },
      {
        title: "Inversion de Laplace par DES — système du 2ᵉ ordre",
        problem: "Calculer f(t) = L⁻¹{F(s)} pour F(s) = 4/(s(s² + 4s + 4)).",
        solution: "Factoriser : s²+4s+4 = (s+2)². Forme DES : A/s + B/(s+2) + C/(s+2)². Résidu A en s=0 : A = 4/(4) = 1. Résidu C (pôle double s=−2) : C = 4/(−2) = −2. Pour B : multiplier par (s+2)² → 4/s ; différencier → −4/s² ; évaluer en s=−2 : −4/4 = −1. Donc F(s) = 1/s − 1/(s+2) − 2/(s+2)². Inversion : f(t) = 1(t) − e^(−2t) − 2t·e^(−2t) = 1 − e^(−2t)(1 + 2t) pour t ≥ 0. Vérification f(0) : 1 − 1·(1+0) = 0 ✓. Valeur finale f(∞) : 1 (la réponse converge vers 1).",
        applicationNote: "Un pôle double en s=−2 correspond à un système du 2ᵉ ordre à amortissement critique (ζ=1) : la réponse monte sans osciller mais plus lentement qu'un pôle simple."
      }
    ],
  },
],

  exercises: [
  // ─── SYSLIN ──────────────────────────────────────────────────────────────────
  {
    id: "exo-syslin-01",
    title: "Mélange de deux solutions salines",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `On souhaite préparer 5 litres d'une solution saline à 18 g/L en mélangeant :
- Une solution A à 30 g/L
- Une solution B à 10 g/L

Soient x (en L) le volume de solution A et y (en L) le volume de solution B utilisés.

1. Écrire le système de deux équations (conservation du volume et de la masse de sel).
2. Résoudre par substitution.
3. Vérifier le résultat.`,
    correction: [
      "Mise en équations : bilan volume : x + y = 5 ; bilan sel : 30x + 10y = 5×18 = 90.",
      "Substitution : y = 5 − x → 30x + 10(5 − x) = 90 → 20x = 40 → x = 2 L.",
      "y = 5 − 2 = 3 L.",
      "Vérification : 30×2 + 10×3 = 60 + 30 = 90 g ✓. La solution finale contient bien 90/5 = 18 g/L ✓."
    ],
    keywords: ["substitution", "bilan matière", "mélange", "solution saline", "système 2×2"],
  },
  {
    id: "exo-syslin-02",
    title: "Système 2×2 par pivot de Gauss — débits en réseau",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Résoudre le système suivant par pivot de Gauss :
  3x + 2y = 16   (L1)
   x −  y =  2   (L2)

x et y représentent les débits (en m³/h) dans deux branches d'un réseau de conduites.

1. Effectuer les opérations élémentaires pour triangulariser.
2. Remonter par substitution arrière.
3. Interpréter physiquement.`,
    correction: [
      "L2 ← L2 − (1/3)·L1 : (1 − 1)x + (−1 − 2/3)y = 2 − 16/3 → −(5/3)y = −10/3 → y = 2 m³/h.",
      "Substitution dans L1 : 3x + 2×2 = 16 → 3x = 12 → x = 4 m³/h.",
      "Vérification : 3×4 + 2×2 = 12 + 4 = 16 ✓ et 4 − 2 = 2 ✓. Débit total : x + y = 6 m³/h.",
    ],
    keywords: ["pivot de Gauss", "substitution arrière", "réseau de conduites", "débit", "système 2×2"],
  },
  {
    id: "exo-syslin-03",
    title: "Bilan sur séparateur — deux sorties",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Un séparateur reçoit une alimentation de 100 kg/h contenant 40% massique du composant A.
Il produit deux sorties :
- F1 (kg/h) : enrichie à 60% en A
- F2 (kg/h) : appauvrie à 20% en A

1. Écrire le bilan global et le bilan sur A.
2. Résoudre le système 2×2.
3. Vérifier.`,
    correction: [
      "Bilan global : F1 + F2 = 100 ; bilan sur A : 0.6·F1 + 0.2·F2 = 40.",
      "F2 = 100 − F1 → 0.6F1 + 0.2(100 − F1) = 40 → 0.4F1 = 20 → F1 = 50 kg/h.",
      "F2 = 100 − 50 = 50 kg/h.",
      "Vérification : 50 + 50 = 100 ✓ ; 0.6×50 + 0.2×50 = 30 + 10 = 40 kg/h ✓.",
    ],
    keywords: ["bilan matière", "séparateur", "fraction massique", "substitution"],
  },
  {
    id: "exo-syslin-04",
    title: "Système 3×3 par pivot de Gauss — nœud à trois flux",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Les bilans matière sur un nœud de procédé donnent le système :
   x +  y +  z = 100   (L1)
  2x −  y +  z =  40   (L2)
   x + 2y −  z =  20   (L3)

1. Appliquer le pivot de Gauss.
2. Résoudre par substitution arrière.
3. Vérifier dans les trois équations.`,
    correction: [
      "L2 ← L2 − 2·L1 : −3y − z = −160. L3 ← L3 − L1 : y − 2z = −80.",
      "Élimination de y dans L3 : L3 ← L3 + (1/3)·L2' : (1 − 1)y + (−2 − 1/3)z = −80 − 160/3 → −(7/3)z = −400/3 → z = 400/7 ≈ 57.1.",
      "Depuis L2' : −3y = −160 + 400/7 = −720/7 → y = 240/7 ≈ 34.3. Depuis L1 : x = 100 − 240/7 − 400/7 = 60/7 ≈ 8.6.",
      "Vérification L1 : 60/7 + 240/7 + 400/7 = 700/7 = 100 ✓. L2 : 120/7 − 240/7 + 400/7 = 280/7 = 40 ✓. L3 : 60/7 + 480/7 − 400/7 = 140/7 = 20 ✓.",
    ],
    keywords: ["pivot de Gauss", "système 3×3", "substitution arrière", "bilan nœud"],
  },
  {
    id: "exo-syslin-05",
    title: "Bilan matière sur réacteur — trois composants",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Réaction A → B + C dans un réacteur continu.
Alimentation : 120 mol/h (50% A, 30% B, 20% C).
Avancement de réaction : ξ = 30 mol/h.
Sorties F_A, F_B, F_C (mol/h) vérifient :
- F_A + F_B + F_C = 120   (bilan global)
- F_B + F_C = 90           (bilan B+C après réaction)
- F_B − F_C = 0            (stœchiométrie B:C = 1:1)

1. Résoudre le système.
2. Interpréter physiquement.`,
    correction: [
      "Depuis L1 − L2 : F_A = 120 − 90 = 30 mol/h (réactif non converti).",
      "Depuis L2 + L3 : 2·F_B = 90 → F_B = 45 mol/h.",
      "Depuis L3 : F_C = F_B = 45 mol/h.",
      "Vérification : 30 + 45 + 45 = 120 ✓. Interprétation : 30 mol/h de A n'ont pas réagi, 45 mol/h de B et C produits en proportions égales, conforme à la stœchiométrie 1:1.",
    ],
    keywords: ["bilan matière", "réacteur", "avancement", "stœchiométrie", "système 3×3"],
  },
  {
    id: "exo-syslin-06",
    title: "Bilan thermique sur trois échangeurs en série",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Trois échangeurs en série : les températures de sortie T1, T2, T3 (°C) vérifient les bilans enthalpiques :
  2T1 −  T2       = 80    (L1)
  −T1 + 3T2 − T3 = 120   (L2)
        −T2 + 2T3 = 100   (L3)

1. Résoudre par pivot de Gauss.
2. Donner T1, T2, T3 en °C.`,
    correction: [
      "L2 ← L2 + (1/2)·L1 : (5/2)T2 − T3 = 160. L3 inchangée : −T2 + 2T3 = 100.",
      "L3 ← L3 + (2/5)·L2' : (2 + 2/5)T3 = 100 + 64 → (12/5)T3 = 164 → T3 ≈ 68.3 °C.",
      "Depuis L2' : (5/2)T2 = 160 + 68.3 = 228.3 → T2 ≈ 91.3 °C.",
      "Depuis L1 : 2T1 = 80 + 91.3 = 171.3 → T1 ≈ 85.7 °C. Profil décroissant de T1 à T3 cohérent avec un échangeur en série où le fluide se refroidit progressivement.",
    ],
    keywords: ["bilan thermique", "échangeur", "système 3×3", "pivot de Gauss", "température"],
  },
  {
    id: "exo-syslin-07",
    title: "Système incompatible — bilan de procédé incohérent",
    topic: "SYSLIN",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Un opérateur modélise un procédé par :
   x +  y = 10   (L1)
  2x + 2y = 30   (L2)

1. Appliquer le pivot de Gauss. Que se passe-t-il ?
2. Conclure sur la nature du système.
3. Interpréter physiquement l'incohérence.
4. Généraliser : sous quelle condition un système est-il incompatible ?`,
    correction: [
      "L2 ← L2 − 2·L1 : 0x + 0y = 30 − 20 = 10 → 0 = 10.",
      "Cette égalité est une contradiction : le système est incompatible, il n'admet aucune solution.",
      "Interprétation : L2 est le double de L1 mais son second membre est 30 ≠ 2×10 = 20. Les deux équations représentent le même bilan physique mais avec des mesures contradictoires. L'opérateur a commis une erreur (facteur 2 incorrect, ou mesure de 30 erronée — le bilan réel devrait donner 20).",
      "Condition générale : après pivot de Gauss, si une ligne donne 0 = c avec c ≠ 0, le système est incompatible. Géométriquement : deux droites (ou plans) parallèles, aucune intersection.",
    ],
    keywords: ["système incompatible", "pivot de Gauss", "cohérence", "contradiction", "bilan matière"],
  },
  {
    id: "exo-syslin-08",
    title: "Système indéterminé — réseau hydraulique avec degré de liberté",
    topic: "SYSLIN",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Un réseau hydraulique à trois tuyaux donne le système :
   x +  y + z =  50   (L1)
  2x + 2y + 2z = 100   (L2) — redondant
   x +  y     =  30   (L3)

1. Appliquer le pivot de Gauss. Que donne L2 ?
2. Résoudre le système réduit avec un paramètre libre t.
3. Donner les conditions physiques sur t.
4. Interpréter le degré de liberté.`,
    correction: [
      "L2 ← L2 − 2·L1 : 0 = 0 (ligne nulle, redondante). L3 ← L3 − L1 : −z = −20 → z = 20 m³/h déterminé.",
      "Du système réduit : z = 20 et x + y = 30. Paramètre libre t = x : solution (x, y, z) = (t, 30 − t, 20).",
      "Conditions physiques : x ≥ 0 → t ≥ 0 ; y = 30 − t ≥ 0 → t ≤ 30. Donc 0 ≤ t ≤ 30 m³/h.",
      "Interprétation : L2 est redondante, le système a un degré de liberté. Il manque une équation (loi de perte de charge, résistance hydraulique) pour fixer la répartition entre x et y. z = 20 m³/h est imposé par la géométrie du réseau.",
    ],
    keywords: ["système indéterminé", "paramètre libre", "degré de liberté", "réseau hydraulique"],
  },
  // ─── POLY ─────────────────────────────────────────────────────────────────
  {
    id: "exo-poly-01",
    title: "Opérations sur les polynômes",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soient P(X) = 2X² − 3X + 1 et Q(X) = X² + X − 2.

1. Calculer P(2) et Q(2), puis P(2) + Q(2).
2. Calculer S(X) = P(X) + Q(X) et vérifier S(2) = P(2) + Q(2).
3. Calculer R(X) = P(X)·Q(X) en développant complètement.
4. Vérifier R(2) = P(2)·Q(2).`,
    correction: [
      "P(2) = 8 − 6 + 1 = 3. Q(2) = 4 + 2 − 2 = 4. P(2) + Q(2) = 7.",
      "S(X) = 3X² − 2X − 1. S(2) = 12 − 4 − 1 = 7 ✓.",
      "R(X) = (2X² − 3X + 1)(X² + X − 2). Développement : 2X⁴ + 2X³ − 4X² − 3X³ − 3X² + 6X + X² + X − 2 = 2X⁴ − X³ − 6X² + 7X − 2.",
      "R(2) = 32 − 8 − 24 + 14 − 2 = 12. Vérification : P(2)×Q(2) = 3×4 = 12 ✓.",
    ],
    keywords: ["polynômes", "addition", "multiplication", "évaluation"],
  },
  {
    id: "exo-poly-02",
    title: "Évaluation par schéma de Horner",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soit P(X) = 3X³ − 2X² + X − 5.

1. Évaluer P(2) par le schéma de Horner (décrire chaque étape).
2. Vérifier par calcul direct.
3. Application : calculer Cp(T) = 3T³ − 2T² + T − 5 (J/mol·K) à T = 2 K (valeur symbolique).`,
    correction: [
      "Coefficients : [3, −2, 1, −5] en X = 2. b₃ = 3.",
      "b₂ = 3×2 + (−2) = 4. b₁ = 4×2 + 1 = 9. b₀ = 9×2 + (−5) = 13. P(2) = 13.",
      "Vérification directe : 3×8 − 2×4 + 2 − 5 = 24 − 8 + 2 − 5 = 13 ✓.",
      "Application : Cp(2) = 13 J/mol·K par le même calcul. Horner est plus rapide pour les évaluations répétées (n multiplications vs 2n−1 en direct).",
    ],
    keywords: ["schéma de Horner", "évaluation", "algorithme", "Cp(T)"],
  },
  {
    id: "exo-poly-03",
    title: "Racines et factorisation — polynôme du second degré",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soit P(X) = 2X² − 5X + 3.

1. Vérifier si x = 1 est racine en calculant P(1).
2. Calculer le discriminant Δ et trouver les deux racines.
3. Écrire la factorisation complète.
4. Vérifier en développant.`,
    correction: [
      "P(1) = 2 − 5 + 3 = 0 ✓. x = 1 est bien racine.",
      "Δ = 25 − 24 = 1 > 0. x₁ = (5 + 1)/4 = 3/2, x₂ = (5 − 1)/4 = 1.",
      "P(X) = 2(X − 1)(X − 3/2) = (X − 1)(2X − 3).",
      "Vérification : (X − 1)(2X − 3) = 2X² − 3X − 2X + 3 = 2X² − 5X + 3 ✓.",
    ],
    keywords: ["racines", "discriminant", "factorisation", "second degré", "théorème du facteur"],
  },
  {
    id: "exo-poly-04",
    title: "Division euclidienne et factorisation complète",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Soit A(X) = X³ + 2X² − 5X + 2.

1. Vérifier que x = 1 est racine.
2. Diviser A(X) par (X − 1) pour obtenir Q(X).
3. Factoriser complètement A(X).
4. Application : les racines sont des points d'équilibre d'un procédé ; lesquels sont physiquement acceptables (valeurs positives) ?`,
    correction: [
      "A(1) = 1 + 2 − 5 + 2 = 0 ✓. (X − 1) est un facteur.",
      "A(X) = (X−1)(X² + aX + b). Identification : a−1=2 → a=3 ; −b=2 → b=−2 ; b−a=−2−3=−5 ✓. Q(X) = X² + 3X − 2.",
      "Δ = 9 + 8 = 17. x₂ = (−3 + √17)/2 ≈ 0.56, x₃ = (−3 − √17)/2 ≈ −3.56. Factorisation : A(X) = (X−1)(X−x₂)(X−x₃).",
      "Points d'équilibre positifs : x=1 et x≈0.56. La racine x≈−3.56 (négative) n'est pas physiquement admissible pour un débit ou une concentration.",
    ],
    keywords: ["division euclidienne", "factorisation", "racines", "polynôme du 3ème degré"],
  },
  {
    id: "exo-poly-05",
    title: "Factorisation complète — racines entières",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Soit P(X) = X³ − 6X² + 11X − 6.

1. Tester x = 1, 2, 3 (tous sont racines : vérifier).
2. Diviser par (X − 1) pour obtenir Q(X).
3. Factoriser Q(X) et en déduire la factorisation complète.
4. Vérifier la factorisation en développant.`,
    correction: [
      "P(1) = 1 − 6 + 11 − 6 = 0 ✓. P(2) = 8 − 24 + 22 − 6 = 0 ✓. P(3) = 27 − 54 + 33 − 6 = 0 ✓.",
      "P(X) = (X−1)(X² + aX + b). a−1=−6 → a=−5 ; −b=−6 → b=6 ; b−a=6−(−5)=11 ✓. Q(X) = X² − 5X + 6.",
      "Δ = 25 − 24 = 1. x₂ = (5+1)/2 = 3, x₃ = (5−1)/2 = 2. P(X) = (X−1)(X−2)(X−3).",
      "Vérification : (X−1)(X−2) = X²−3X+2. (X²−3X+2)(X−3) = X³−3X²−3X²+9X+2X−6 = X³−6X²+11X−6 ✓.",
    ],
    keywords: ["factorisation", "racines entières", "polynôme du 3ème degré", "division euclidienne"],
  },
  {
    id: "exo-poly-06",
    title: "Courbe de calibration d'un capteur de pression",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Un capteur de pression délivre une tension P (V) en fonction de la température T (°C).
Modèle : P(T) = aT² + bT + c. Mesures de calibration :
- P(0) = 1.0 V
- P(50) = 3.5 V
- P(100) = 7.0 V

1. Écrire le système 3×3 sur a, b, c.
2. Résoudre.
3. Prédire P(75°C).`,
    correction: [
      "P(0) = c = 1. P(50) → 2500a + 50b = 2.5 (L1). P(100) → 10000a + 100b = 6 (L2).",
      "L2 − 4·L1 : −100b = −4 → b = 0.04. Depuis L1 : 2500a = 2.5 − 2 = 0.5 → a = 0.0002.",
      "P(T) = 0.0002T² + 0.04T + 1. Vérifications : P(0)=1 ✓, P(50)=0.5+2+1=3.5 ✓, P(100)=2+4+1=7 ✓.",
      "P(75) = 0.0002×5625 + 0.04×75 + 1 = 1.125 + 3 + 1 = 5.125 V.",
    ],
    keywords: ["calibration", "capteur", "régression polynomiale", "système 3×3", "corrélation"],
  },
  {
    id: "exo-poly-07",
    title: "Racine double et factorisation — stabilité d'un procédé",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "25 min",
    statement: `Soit P(X) = X³ − 3X − 2.

1. Tester x = −1 : calculer P(−1). Conclure.
2. Diviser P(X) par (X + 1) pour obtenir Q(X).
3. Identifier si P a une racine double et factoriser complètement.
4. Application : si ces racines sont les valeurs propres d'un système de procédé, commenter la stabilité.`,
    correction: [
      "P(−1) = −1 + 3 − 2 = 0 ✓. (X + 1) est un facteur.",
      "P(X) = (X+1)(X² + aX + b). a+1=0 → a=−1 ; −b=−2 → b=2 ; b−a=2−(−1)=3... Corrigeons : P(X) = X³+0·X²−3X−2. Développement de (X+1)(X²+aX+b) = X³+(a+1)X²+(b+a)X+b. Identification : a+1=0 → a=−1 ; b=−2 ; b+a=−2−1=−3 ✓. Q(X) = X² − X − 2.",
      "Racines de Q : Δ=1+8=9. x=(1±3)/2. x₂=2, x₃=−1. Racine double en x=−1. P(X) = (X+1)²(X−2).",
      "Valeurs propres : −1 (double, négatif) → mode stable, décroissance en te^(−t). +2 (positive) → mode instable, croissance exponentielle. Le système est instable en raison de la valeur propre +2. Une régulation est nécessaire.",
    ],
    keywords: ["racine double", "factorisation", "valeurs propres", "stabilité", "système dynamique"],
  },
  {
    id: "exo-poly-08",
    title: "Équation de Van der Waals cubique — Newton-Raphson",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "35 min",
    statement: `L'équation de Van der Waals en V (m³/mol) est :
  P(V) = V³ − (b + RT/P)V² + (a/P)V − ab/P = 0

Paramètres : R=8.314 J/(mol·K), T=300 K, P=10⁶ Pa, a=0.3 J·m³/mol², b=4×10⁻⁵ m³/mol.

1. Calculer les coefficients numériques.
2. Évaluer P(V₀) pour V₀ = 2.4×10⁻³ m³/mol.
3. Calculer P'(V₀).
4. Effectuer une itération de Newton-Raphson : V₁ = V₀ − P(V₀)/P'(V₀).`,
    correction: [
      "RT/P = 8.314×300/10⁶ = 2.494×10⁻³. b+RT/P = 4×10⁻⁵ + 2.494×10⁻³ = 2.534×10⁻³. a/P = 3×10⁻⁷. ab/P = 1.2×10⁻¹¹.",
      "P(V₀) = (2.4×10⁻³)³ − 2.534×10⁻³×(2.4×10⁻³)² + 3×10⁻⁷×2.4×10⁻³ − 1.2×10⁻¹¹ = 1.382×10⁻⁸ − 1.459×10⁻⁸ + 7.2×10⁻¹⁰ − 1.2×10⁻¹¹ ≈ −5.7×10⁻¹⁰ m³/mol.",
      "P'(V) = 3V² − 2×2.534×10⁻³·V + 3×10⁻⁷. P'(V₀) = 3×5.76×10⁻⁶ − 5.068×10⁻³×2.4×10⁻³ + 3×10⁻⁷ ≈ 1.728×10⁻⁵ − 1.216×10⁻⁵ + 3×10⁻⁷ = 5.42×10⁻⁶.",
      "Newton : V₁ = 2.4×10⁻³ − (−5.7×10⁻¹⁰)/(5.42×10⁻⁶) = 2.4×10⁻³ + 1.05×10⁻⁴ ≈ 2.505×10⁻³ m³/mol. Une nouvelle itération convergerait vers le volume molaire gazeux exact à 300 K et 1 MPa.",
    ],
    keywords: ["Van der Waals", "équation cubique", "Newton-Raphson", "volume molaire", "résolution numérique"],
  },
// ─── FVAR ───────────────────────────────────────────────────────────────────
  {
    id: "exo-fvar-01",
    title: "Dérivées partielles d'un polynôme et gradient",
    topic: "FVAR",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soit la fonction f(x, y) = 3x²y − 2xy² + 5x.

1. Calculer la dérivée partielle ∂f/∂x.
2. Calculer la dérivée partielle ∂f/∂y.
3. Calculer le gradient ∇f en le point (1, 2).
4. Interpréter le gradient : dans quelle direction f croît-elle le plus vite en (1, 2) ?`,
    correction: [
      "∂f/∂x : on dérive par rapport à x en traitant y comme une constante. ∂f/∂x = 6xy − 2y² + 5.",
      "∂f/∂y : on dérive par rapport à y en traitant x comme une constante. ∂f/∂y = 3x² − 4xy.",
      "Calcul du gradient en (1, 2) : ∂f/∂x|(1,2) = 6(1)(2) − 2(4) + 5 = 12 − 8 + 5 = 9. ∂f/∂y|(1,2) = 3(1) − 4(1)(2) = 3 − 8 = −5. Donc ∇f(1,2) = (9, −5).",
      "Interprétation : la direction de montée maximale est le vecteur (9, −5). La norme ‖∇f‖ = √(81 + 25) = √106 ≈ 10.3 représente le taux de croissance maximal de f en (1, 2).",
    ],
    keywords: ["dérivée partielle", "gradient", "polynôme", "direction de montée"],
  },
  {
    id: "exo-fvar-02",
    title: "Dérivées partielles du gaz parfait PV = nRT",
    topic: "FVAR",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `On considère l'équation d'état du gaz parfait PV = nRT avec n = 1 mol et R = 8.314 J·mol⁻¹·K⁻¹.

On exprime P en fonction de V et T : P(V, T) = RT/V.

1. Calculer ∂P/∂T|_V (à volume constant). Interpréter physiquement.
2. Calculer ∂P/∂V|_T (à température constante). Interpréter physiquement.
3. Calculer ∂V/∂T|_P (à partir de V = RT/P, à pression constante). Interpréter physiquement.
4. Vérifier la relation cyclique : (∂P/∂T)_V · (∂T/∂V)_P · (∂V/∂P)_T = −1.`,
    correction: [
      "∂P/∂T|_V = R/V. Interprétation : à volume constant, la pression augmente linéairement avec T (loi de Gay-Lussac). Unité : Pa/K.",
      "∂P/∂V|_T = −RT/V². La valeur est négative : à température constante, la pression diminue quand le volume augmente (loi de Boyle-Mariotte). Plus V est petit, plus la sensibilité est grande.",
      "V = RT/P → ∂V/∂T|_P = R/P. Interprétation : à pression constante, le volume augmente linéairement avec T (loi de Charles).",
      "Relation cyclique : (R/V) · (P/R) · (−V²/RT) = (R/V)·(P/R)·(−V²/RT) = −PV/(RT) = −1 car PV = RT pour n=1. Relation vérifiée. ✓",
    ],
    keywords: ["gaz parfait", "dérivée partielle", "thermodynamique", "relation cyclique", "PV=nRT"],
  },
  {
    id: "exo-fvar-03",
    title: "Gradient et direction de montée maximale",
    topic: "FVAR",
    semester: "S2",
    level: "facile",
    duration: "10 min",
    statement: `Soit f(x, y) = x² + 2y².

1. Calculer ∂f/∂x et ∂f/∂y.
2. Calculer le gradient ∇f(x, y).
3. Calculer ∇f en le point A = (1, 1).
4. Calculer la norme ‖∇f(1, 1)‖.
5. Dans quelle direction unitaire u faut-il se déplacer depuis A pour que f augmente le plus vite ? Donner les coordonnées de ce vecteur unitaire.`,
    correction: [
      "∂f/∂x = 2x et ∂f/∂y = 4y.",
      "∇f(x, y) = (2x, 4y).",
      "En (1, 1) : ∇f(1, 1) = (2·1, 4·1) = (2, 4).",
      "‖∇f(1, 1)‖ = √(4 + 16) = √20 = 2√5 ≈ 4.47.",
      "La direction de montée maximale est le vecteur unitaire u = ∇f/‖∇f‖ = (2, 4)/(2√5) = (1/√5, 2/√5) ≈ (0.447, 0.894). Le taux de croissance maximal est 2√5 ≈ 4.47 par unité de déplacement.",
    ],
    keywords: ["gradient", "vecteur unitaire", "direction de montée", "norme", "ellipsoïde"],
  },
  {
    id: "exo-fvar-04",
    title: "Dérivée partielle de l'équation de Van der Waals",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `L'équation de Van der Waals pour un gaz réel s'écrit :
(P + a/V²)(V − b) = RT

avec R = 8.314 J·mol⁻¹·K⁻¹, et pour le dioxyde de carbone CO₂ : a = 0.3640 Pa·m⁶·mol⁻², b = 4.267 × 10⁻⁵ m³·mol⁻¹.

1. Exprimer P en fonction de V et T.
2. Calculer ∂P/∂V|_T (dérivée de la pression par rapport au volume à T constante).
3. Calculer numériquement ∂P/∂V|_T pour T = 300 K et V = 1 × 10⁻³ m³/mol.
4. Comparer au résultat du gaz parfait ∂P/∂V|_T = −RT/V² dans les mêmes conditions.
5. Interpréter physiquement la différence entre les deux modèles.`,
    correction: [
      "P = RT/(V − b) − a/V².",
      "∂P/∂V|_T = −RT/(V − b)² + 2a/V³. (Dériver terme à terme : d/dV[RT(V−b)⁻¹] = −RT(V−b)⁻², d/dV[−aV⁻²] = 2aV⁻³.)",
      "Calcul numérique avec T = 300 K, V = 10⁻³ m³/mol, b = 4.267×10⁻⁵ m³/mol : V−b = 10⁻³ − 4.267×10⁻⁵ = 9.573×10⁻⁴ m³/mol. −RT/(V−b)² = −8.314×300/(9.573×10⁻⁴)² = −2494.2/(9.164×10⁻⁷) ≈ −2.721×10⁹ Pa·mol/m³. 2a/V³ = 2×0.364/(10⁻³)³ = 0.728/10⁻⁹ = 7.28×10⁸ Pa·mol/m³. ∂P/∂V|_T (VdW) ≈ −2.721×10⁹ + 7.28×10⁸ ≈ −1.993×10⁹ Pa·mol/m³.",
      "Gaz parfait : ∂P/∂V|_T = −RT/V² = −8.314×300/(10⁻³)² = −2494.2/10⁻⁶ ≈ −2.494×10⁹ Pa·mol/m³.",
      "Le terme 2a/V³ > 0 dans Van der Waals représente les forces attractives inter-moléculaires. Ces forces réduisent la sensibilité de P à V : la pression diminue moins vite avec V qu'un gaz parfait. À très petit V, le terme répulsif (b) domine.",
    ],
    keywords: ["Van der Waals", "dérivée partielle", "compressibilité", "gaz réel", "gaz parfait"],
  },
  {
    id: "exo-fvar-05",
    title: "Vérification de l'équation de la chaleur",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `On considère la fonction u(x, t) = e^(−kt) · sin(x), où k > 0 est une constante.

1. Calculer ∂u/∂t.
2. Calculer ∂u/∂x, puis ∂²u/∂x².
3. Vérifier que u satisfait l'équation de la chaleur : ∂u/∂t = k · ∂²u/∂x².
4. Donner une interprétation physique : que représente u(x, t) dans un contexte de diffusion thermique ?`,
    correction: [
      "∂u/∂t = −k · e^(−kt) · sin(x). (On dérive e^(−kt) par rapport à t, sin(x) est une constante.)",
      "∂u/∂x = e^(−kt) · cos(x). Puis ∂²u/∂x² = −e^(−kt) · sin(x). (Dériver cos(x) par rapport à x.)",
      "Vérification : k · ∂²u/∂x² = k · (−e^(−kt) · sin(x)) = −k · e^(−kt) · sin(x) = ∂u/∂t. ✓ L'équation est bien vérifiée.",
      "Interprétation physique : u(x, t) représente la distribution de température le long d'une barre (axe x) au temps t. La forme sin(x) décrit le profil spatial initial. Le facteur e^(−kt) modélise la dissipation thermique : l'amplitude diminue exponentiellement, la barre tend uniformément vers T = 0. k est la diffusivité thermique.",
    ],
    keywords: ["équation de la chaleur", "dérivées partielles", "vérification", "diffusion", "thermique"],
  },
  {
    id: "exo-fvar-06",
    title: "Calcul d'une intégrale double",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Calculer l'intégrale double suivante :

∫₀¹ ∫₀² (2xy + y²) dx dy

1. Calculer d'abord l'intégrale intérieure ∫₀² (2xy + y²) dx en traitant y comme une constante.
2. Calculer ensuite l'intégrale extérieure ∫₀¹ [résultat] dy.
3. Donner la valeur numérique finale.
4. Interpréter ce résultat comme le flux total d'une grandeur f(x,y) = 2xy + y² sur le rectangle [0,2]×[0,1].`,
    correction: [
      "Intégrale intérieure : ∫₀² (2xy + y²) dx = [x²y + xy²]₀² = (4y + 2y²) − 0 = 4y + 2y².",
      "Intégrale extérieure : ∫₀¹ (4y + 2y²) dy = [2y² + (2/3)y³]₀¹ = 2 + 2/3 = 8/3.",
      "Valeur finale : ∬f dA = 8/3 ≈ 2.667.",
      "Interprétation : si f(x,y) représente une densité de flux (par exemple un flux de chaleur ou de masse) en chaque point (x,y) du rectangle [0,2]×[0,1], alors l'intégrale double donne le flux total traversant cette surface, soit 8/3 unités. La fonction augmente avec x et y, donc le flux est plus intense vers le coin supérieur droit.",
    ],
    keywords: ["intégrale double", "Fubini", "intégration itérée", "flux", "surface"],
  },
  {
    id: "exo-fvar-07",
    title: "Points critiques et classification par la hessienne",
    topic: "FVAR",
    semester: "S2",
    level: "avancé",
    duration: "35 min",
    statement: `Soit la fonction f(x, y) = x³ − 3x + y² − 4y + 5.

1. Calculer les dérivées partielles ∂f/∂x et ∂f/∂y.
2. Trouver tous les points critiques en résolvant ∇f = (0, 0).
3. Calculer la matrice hessienne H(x, y) = [[∂²f/∂x², ∂²f/∂x∂y],[∂²f/∂y∂x, ∂²f/∂y²]].
4. Pour chaque point critique, calculer det(H) et ∂²f/∂x², puis classifier (minimum local, maximum local ou col).
5. Calculer la valeur de f en chaque point critique.`,
    correction: [
      "∂f/∂x = 3x² − 3 et ∂f/∂y = 2y − 4.",
      "Points critiques : 3x² − 3 = 0 → x² = 1 → x = 1 ou x = −1. 2y − 4 = 0 → y = 2. Deux points critiques : P₁ = (1, 2) et P₂ = (−1, 2).",
      "Hessienne : ∂²f/∂x² = 6x, ∂²f/∂y² = 2, ∂²f/∂x∂y = 0. H(x,y) = [[6x, 0],[0, 2]].",
      "En P₁ = (1, 2) : H = [[6, 0],[0, 2]], det(H) = 12 > 0, ∂²f/∂x² = 6 > 0 → minimum local. En P₂ = (−1, 2) : H = [[−6, 0],[0, 2]], det(H) = −12 < 0 → col (point selle).",
      "f(1, 2) = 1 − 3 + 4 − 8 + 5 = −1. f(−1, 2) = −1 + 3 + 4 − 8 + 5 = 3. Conclusion : P₁ = (1, 2) est un minimum local avec f = −1 ; P₂ = (−1, 2) est un point selle avec f = 3.",
    ],
    keywords: ["points critiques", "hessienne", "minimum", "maximum", "col", "classification"],
  },
  {
    id: "exo-fvar-08",
    title: "Optimisation d'un coût de procédé industriel",
    topic: "FVAR",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Le coût de fonctionnement d'un réacteur chimique est modélisé par :

C(T, P) = 0.01T² + 0.02P² − 0.005TP

où T est la température en centaines de °C et P est la pression en bar.

1. Calculer ∂C/∂T et ∂C/∂P.
2. Trouver le point critique en résolvant le système ∇C = (0, 0).
3. Calculer la hessienne H et son déterminant pour vérifier qu'il s'agit d'un minimum.
4. Calculer le coût minimal C(T*, P*).
5. Interpréter le résultat : pourquoi ce minimum est-il physiquement attendu ?`,
    correction: [
      "∂C/∂T = 0.02T − 0.005P et ∂C/∂P = 0.04P − 0.005T.",
      "Système : 0.02T − 0.005P = 0 → P = 4T. Substitution dans la 2ème équation : 0.04(4T) − 0.005T = 0 → 0.16T − 0.005T = 0 → 0.155T = 0 → T = 0, donc P = 0. Point critique : (T*, P*) = (0, 0).",
      "H = [[0.02, −0.005],[−0.005, 0.04]]. det(H) = (0.02)(0.04) − (−0.005)² = 0.0008 − 0.000025 = 0.000775 > 0. ∂²C/∂T² = 0.02 > 0. Donc (0, 0) est bien un minimum local (et global car la fonction est convexe).",
      "C(0, 0) = 0. Le coût minimal théorique est nul.",
      "Interprétation : le modèle représente un coût marginal. Sans charge opératoire de base, le coût minimal est atteint à T = 0, P = 0 (arrêt du réacteur). En pratique, des contraintes (T_min, P_min > 0) imposeraient une optimisation sous contraintes. Ce résultat montre que les coûts quadratiques dominent et que le terme couplage −0.005TP réduit légèrement le coût quand T et P sont tous deux positifs.",
    ],
    keywords: ["optimisation", "minimum", "gradient nul", "hessienne", "coût de procédé", "convexité"],
  },

  // ─── FRAT ───────────────────────────────────────────────────────────────────
  {
    id: "exo-frat-01",
    title: "DES — pôles simples par la méthode des résidus",
    topic: "FRAT",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Décomposer en éléments simples la fraction rationnelle :

F(X) = 1 / ((X − 1)(X + 2))

1. Vérifier que deg(numérateur) < deg(dénominateur).
2. Écrire la forme de la DES : A/(X − 1) + B/(X + 2).
3. Calculer A et B par la méthode de couverture (résidus).
4. Vérifier le résultat en remettant sur le même dénominateur.`,
    correction: [
      "deg(N) = 0 < deg(D) = 2. La fraction est propre, on peut décomposer directement.",
      "Forme : F(X) = A/(X − 1) + B/(X + 2).",
      "Résidu en X = 1 : A = (X−1)·F(X)|_{X=1} = 1/(1+2) = 1/3. Résidu en X = −2 : B = (X+2)·F(X)|_{X=−2} = 1/(−2−1) = −1/3. Donc F(X) = (1/3)/(X−1) − (1/3)/(X+2).",
      "Vérification : [(1/3)(X+2) − (1/3)(X−1)] / [(X−1)(X+2)] = [(1/3)·3] / [(X−1)(X+2)] = 1/[(X−1)(X+2)]. ✓",
    ],
    keywords: ["DES", "pôles simples", "résidus", "couverture", "fraction rationnelle"],
  },
  {
    id: "exo-frat-02",
    title: "DES — fraction avec numérateur de degré 1",
    topic: "FRAT",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Décomposer en éléments simples :

F(X) = (2X + 1) / ((X + 1)(X − 2))

1. Vérifier que la fraction est propre.
2. Écrire la DES sous la forme A/(X + 1) + B/(X − 2).
3. Calculer A et B par la méthode de couverture.
4. Vérifier en développant la somme.`,
    correction: [
      "deg(N) = 1 < deg(D) = 2. Fraction propre. ✓",
      "Forme : F(X) = A/(X + 1) + B/(X − 2).",
      "Résidu en X = −1 : A = (2(−1)+1)/((−1)−2) = (−1)/(−3) = 1/3. Résidu en X = 2 : B = (2·2+1)/((2)+1) = 5/3. Donc F(X) = (1/3)/(X+1) + (5/3)/(X−2).",
      "Vérification : [(1/3)(X−2) + (5/3)(X+1)] / [(X+1)(X−2)] = [(1/3)X − 2/3 + (5/3)X + 5/3] / D = [(6/3)X + 3/3] / D = (2X+1)/D. ✓",
    ],
    keywords: ["DES", "pôles simples", "résidus", "numérateur degré 1"],
  },
  {
    id: "exo-frat-03",
    title: "Intégration par décomposition en éléments simples",
    topic: "FRAT",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Calculer l'intégrale indéfinie :

∫ 1 / ((X − 1)(X + 2)) dX

1. Utiliser la décomposition obtenue dans exo-frat-01 : F(X) = (1/3)/(X−1) − (1/3)/(X+2).
2. Intégrer terme à terme.
3. Donner la primitive avec la constante d'intégration.
4. Vérifier en dérivant le résultat.`,
    correction: [
      "On utilise : F(X) = (1/3)·1/(X−1) − (1/3)·1/(X+2).",
      "Intégration : ∫(1/3)·1/(X−1) dX = (1/3)·ln|X−1| et ∫(−1/3)·1/(X+2) dX = −(1/3)·ln|X+2|.",
      "Primitive : ∫F(X) dX = (1/3)·ln|X−1| − (1/3)·ln|X+2| + C = (1/3)·ln|( X−1)/(X+2)| + C.",
      "Vérification : d/dX[(1/3)ln|(X−1)/(X+2)|] = (1/3)·[(X+2)/(X−1)]·[(X+2−(X−1))/(X+2)²] = (1/3)·[3/((X−1)(X+2))] = 1/((X−1)(X+2)). ✓",
    ],
    keywords: ["intégration", "DES", "logarithme", "primitive", "fractions rationnelles"],
  },
  {
    id: "exo-frat-04",
    title: "DES — pôle double",
    topic: "FRAT",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Décomposer en éléments simples :

F(X) = X / ((X + 1)²(X − 1))

1. Identifier la nature des pôles (pôle double en X = −1, pôle simple en X = 1).
2. Écrire la forme de la DES : A/(X + 1) + B/(X + 1)² + C/(X − 1).
3. Calculer C par la méthode de couverture en X = 1.
4. Calculer B par la méthode de couverture en X = −1.
5. Calculer A (par dérivation ou identification de coefficients).
6. Vérifier le résultat.`,
    correction: [
      "Pôle double en X = −1 → termes A/(X+1) + B/(X+1)². Pôle simple en X = 1 → terme C/(X−1). deg(N)=1 < deg(D)=3, fraction propre.",
      "Forme : F(X) = A/(X+1) + B/(X+1)² + C/(X−1).",
      "Résidu simple en X = 1 : C = (X−1)·F(X)|_{X=1} = 1/((1+1)²) = 1/4.",
      "Pour B (pôle double) : B = (X+1)²·F(X)|_{X=−1} = (−1)/(−1−1) = (−1)/(−2) = 1/2.",
      "Pour A : multiplier F(X) par (X+1)² et dériver par rapport à X, évaluer en X = −1. d/dX[X/(X−1)]|_{X=−1} = [(X−1)−X]/(X−1)²|_{X=−1} = −1/(−2)² = −1/4. Donc A = −1/4.",
      "F(X) = −(1/4)/(X+1) + (1/2)/(X+1)² + (1/4)/(X−1). Vérification (X=0) : F(0) = 0/(1·(−1)) = 0. DES : −1/4 + 1/2 − 1/4 = 0. ✓",
    ],
    keywords: ["DES", "pôle double", "résidu", "dérivation", "fraction rationnelle"],
  },
  {
    id: "exo-frat-05",
    title: "DES — fraction impropre avec division euclidienne",
    topic: "FRAT",
    semester: "S2",
    level: "intermédiaire",
    duration: "30 min",
    statement: `Décomposer en éléments simples :

F(X) = (X² + 3) / (X² − 4)

Remarque : deg(numérateur) = deg(dénominateur) = 2, la fraction est impropre.

1. Effectuer la division euclidienne de X² + 3 par X² − 4.
2. Factoriser X² − 4 = (X − 2)(X + 2).
3. Décomposer la partie propre en éléments simples.
4. Donner la DES complète de F(X).`,
    correction: [
      "Division euclidienne : X² + 3 = 1·(X² − 4) + 7. Donc F(X) = 1 + 7/(X² − 4).",
      "Factorisation : X² − 4 = (X − 2)(X + 2).",
      "DES de G(X) = 7/((X−2)(X+2)) : A = 7/(2+2) = 7/4 (résidu en X=2). B = 7/(−2−2) = −7/4 (résidu en X=−2). G(X) = (7/4)/(X−2) − (7/4)/(X+2).",
      "DES complète : F(X) = 1 + (7/4)/(X−2) − (7/4)/(X+2). Vérification (X=0) : F(0) = (0+3)/(0−4) = −3/4. DES : 1 + (7/4)/(−2) − (7/4)/(2) = 1 − 7/8 − 7/8 = 1 − 14/8 = 1 − 7/4 = −3/4. ✓",
    ],
    keywords: ["DES", "fraction impropre", "division euclidienne", "pôles simples"],
  },
  {
    id: "exo-frat-06",
    title: "Réponse indicielle d'un système du 3ᵉ ordre via Laplace",
    topic: "FRAT",
    semester: "S2",
    level: "intermédiaire",
    duration: "30 min",
    statement: `On considère la fonction de transfert :

H(s) = 1 / (s(s + 1)(s + 2))

1. Décomposer H(s) en éléments simples.
2. La réponse indicielle est h(t) = L⁻¹{H(s)} (l'entrée échelon est déjà incluse dans le terme 1/s).
3. Inverser chaque terme de la DES.
4. Donner h(t) et vérifier h(0) = 0 et lim_{t→∞} h(t).`,
    correction: [
      "DES : H(s) = A/s + B/(s+1) + C/(s+2). Résidu en s=0 : A = 1/((0+1)(0+2)) = 1/2. Résidu en s=−1 : B = 1/((−1)(−1+2)) = 1/(−1·1) = −1. Résidu en s=−2 : C = 1/((−2)(−2+1)) = 1/((−2)(−1)) = 1/2. H(s) = (1/2)/s − 1/(s+1) + (1/2)/(s+2).",
      "Inversion : L⁻¹{1/s} = 1(t) (échelon unité), L⁻¹{1/(s+a)} = e^(−at).",
      "h(t) = (1/2)·1(t) − e^(−t) + (1/2)·e^(−2t) pour t ≥ 0.",
      "Vérification : h(0) = 1/2 − 1 + 1/2 = 0. ✓ lim_{t→∞} h(t) = 1/2 − 0 + 0 = 1/2. Valeur finale cohérente avec le théorème de la valeur finale : lim_{s→0} s·H(s) = lim_{s→0} 1/((s+1)(s+2)) = 1/2. ✓",
    ],
    keywords: ["Laplace", "DES", "réponse indicielle", "inversion", "automatique", "valeur finale"],
  },
  {
    id: "exo-frat-07",
    title: "DES — pôles complexes conjugués",
    topic: "FRAT",
    semester: "S2",
    level: "avancé",
    duration: "35 min",
    statement: `Décomposer en éléments simples :

F(X) = (2X² + 1) / ((X² + 1)(X − 2))

Les pôles complexes sont ±i (de X² + 1 = 0) et le pôle réel est X = 2.

1. Vérifier que la fraction est propre.
2. Écrire la forme : (AX + B)/(X² + 1) + C/(X − 2).
3. Calculer C par la méthode de couverture en X = 2.
4. Trouver A et B par identification des coefficients (après mise au même dénominateur).
5. Vérifier.`,
    correction: [
      "deg(N) = 2 = deg(X²+1)+(X−2)−1 = 3−1. Numérateur de degré 2, dénominateur de degré 3. Fraction propre. ✓",
      "Forme : F(X) = (AX + B)/(X² + 1) + C/(X − 2).",
      "Résidu en X = 2 : C = (2·4+1)/((4+1)) = 9/5.",
      "Identification : F(X) = (AX+B)(X−2)/[(X²+1)(X−2)] + (9/5)(X²+1)/[(X²+1)(X−2)]. Numérateur commun = (AX+B)(X−2) + (9/5)(X²+1) = 2X²+1. Développement : AX²−2AX+BX−2B + (9/5)X²+9/5 = 2X²+1. Coefficient X² : A + 9/5 = 2 → A = 1/5. Coefficient X : −2A + B = 0 → B = 2A = 2/5. Terme constant : −2B + 9/5 = 1 → −4/5 + 9/5 = 5/5 = 1. ✓",
      "F(X) = ((1/5)X + 2/5)/(X²+1) + (9/5)/(X−2) = (1/5)·(X+2)/(X²+1) + (9/5)/(X−2). Vérification en X=0 : F(0) = 1/(1·(−2)) = −1/2. DES : (2/5)/1 + (9/5)/(−2) = 2/5 − 9/10 = 4/10 − 9/10 = −5/10 = −1/2. ✓",
    ],
    keywords: ["DES", "pôles complexes", "identification", "fraction propre", "pôles imaginaires"],
  },
  {
    id: "exo-frat-08",
    title: "Inversion de Laplace — compléter le carré",
    topic: "FRAT",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Calculer la transformée de Laplace inverse :

F(s) = (s + 3) / (s² + 2s + 5)

1. Compléter le carré au dénominateur : s² + 2s + 5 = (s + a)² + b².
2. Réécrire le numérateur s + 3 en fonction de (s + a).
3. Séparer F(s) en deux termes correspondant aux formules L⁻¹{(s+a)/((s+a)²+b²)} et L⁻¹{b/((s+a)²+b²)}.
4. Donner f(t) = L⁻¹{F(s)}.
5. Vérifier la valeur initiale : f(0) = lim_{s→∞} s·F(s).`,
    correction: [
      "Compléter le carré : s² + 2s + 5 = (s+1)² − 1 + 5 = (s+1)² + 4. Donc a = 1 et b = 2.",
      "Réécrire le numérateur : s + 3 = (s + 1) + 2.",
      "Séparation : F(s) = (s+1)/((s+1)²+4) + 2/((s+1)²+4). Le second terme : 2/((s+1)²+4) = (2/2)·2/((s+1)²+4) = 1·b/((s+a)²+b²) avec le bon facteur.",
      "Inversion : L⁻¹{(s+1)/((s+1)²+4)} = e^(−t)cos(2t). L⁻¹{2/((s+1)²+4)} = e^(−t)sin(2t) (car L⁻¹{b/((s+a)²+b²)} = e^(−at)sin(bt), ici b=2, le terme vaut e^(−t)sin(2t)). f(t) = e^(−t)cos(2t) + e^(−t)sin(2t) = e^(−t)(cos(2t) + sin(2t)).",
      "Vérification valeur initiale : lim_{s→∞} s·F(s) = lim_{s→∞} s(s+3)/(s²+2s+5) = lim_{s→∞} (s²+3s)/(s²+2s+5) = 1. f(0) = e⁰(cos(0)+sin(0)) = 1·(1+0) = 1. ✓",
    ],
    keywords: ["Laplace inverse", "compléter le carré", "pôles complexes", "exponentielle amortie", "valeur initiale"],
  },

],
  methods: {
    SYSLIN: {
      title: "Quand utiliser quelle méthode ?",
      rows: [
        { situation: "Système 2×2 simple, une variable s'isole facilement", method: "Substitution", tip: "Isoler la variable avec le plus petit coefficient" },
        { situation: "Système 2×2 ou 3×3 général", method: "Pivot de Gauss", tip: "L2 ← L2 − (a₂₁/a₁₁)·L1 pour éliminer la 1ère colonne" },
        { situation: "Ligne nulle 0=0 après réduction", method: "Système indéterminé", tip: "Poser un paramètre libre t et exprimer les autres inconnues en fonction de t" },
        { situation: "Contradiction 0=c (c≠0) après réduction", method: "Système incompatible", tip: "Conclure S = ∅, vérifier les données du problème" },
      ]
    },
    POLY: {
      title: "Quand utiliser quelle méthode ?",
      rows: [
        { situation: "Évaluer P(a) rapidement", method: "Schéma de Horner", tip: "Lister tous les coefficients (mettre 0 si terme absent)" },
        { situation: "Degré 2 : trouver les racines", method: "Discriminant Δ = b²−4ac", tip: "Δ>0 : 2 racines réelles ; Δ=0 : racine double ; Δ<0 : racines complexes" },
        { situation: "Degré ≥ 3 : trouver une racine", method: "Théorème des racines rationnelles", tip: "Tester ±(diviseurs de c₀)/(diviseurs de cₙ)" },
        { situation: "Factoriser après avoir trouvé une racine r", method: "Division euclidienne par (X−r)", tip: "Utiliser l'algorithme de Horner ou la division longue" },
      ]
    },
    FVAR: {
      title: "Quand utiliser quelle méthode ?",
      rows: [
        { situation: "Calculer ∂f/∂x", method: "Dériver par rapport à x en fixant y", tip: "Traiter y comme une constante, appliquer les règles habituelles" },
        { situation: "Vérifier qu'une fonction est solution d'une EDP", method: "Substitution directe", tip: "Calculer chaque membre séparément, vérifier l'égalité" },
        { situation: "Classifier un point critique", method: "Matrice hessienne H", tip: "det(H)>0 et ∂²f/∂x²>0 → min ; det(H)>0 et <0 → max ; det(H)<0 → col" },
        { situation: "Calculer ∬_D f dA", method: "Théorème de Fubini (intégrales itérées)", tip: "Dessiner D, fixer l'ordre d'intégration, bornes intérieures en fonction de la variable extérieure" },
      ]
    },
    FRAT: {
      title: "Quand utiliser quelle méthode ?",
      rows: [
        { situation: "Vérifier si F est propre", method: "Comparer deg(P) et deg(Q)", tip: "Si deg P ≥ deg Q → division euclidienne d'abord" },
        { situation: "Pôle simple r", method: "Résidu : A = lim_{X→r} (X−r)·F(X)", tip: "Méthode de couverture : cacher (X−r) et évaluer en r" },
        { situation: "Pôle double r", method: "B = lim_{X→r} (X−r)²·F(X) ; A par dérivation", tip: "A = d/dX[(X−r)²·F(X)]|_{X=r}" },
        { situation: "Facteur irréductible X²+pX+q", method: "Identification des coefficients", tip: "Mettre au même dénominateur, identifier les puissances de X" },
        { situation: "Intégrer après DES", method: "∫A/(X−r)dX = A·ln|X−r|", tip: "Pôle double : ∫B/(X−r)²dX = −B/(X−r) ; quadratique : compléter le carré → arctan" },
      ]
    }
  }
};
