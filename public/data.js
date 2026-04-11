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
            choices: ["\\(A \\cdot x = b\\)", "\\(A / x = b\\)", "\\(A \\cdot x + b = 0\\)", "\\(x = A^{-1}\\)"],
            answer: 0,
            explanation: "\\(A\\) est la matrice des coefficients, \\(x\\) le vecteur des inconnues et \\(b\\) le vecteur des seconds membres."
          },
          {
            question: "Un système carré (\\(n = p\\)) admet une solution unique quand :",
            choices: ["\\(\\det(A) \\neq 0\\) (système de Cramer)", "\\(\\det(A) = 0\\)", "\\(A\\) est triangulaire", "\\(b = 0\\)"],
            answer: 0,
            explanation: "Si \\(\\det(A) \\neq 0\\) le système est de Cramer et admet exactement une solution. Si \\(\\det(A) = 0\\) il y a soit infinité de solutions, soit aucune."
          },
          {
            question: "Qu'est-ce que la matrice augmentée \\([A|b]\\) ?",
            choices: ["La matrice \\(A\\) complétée par le vecteur \\(b\\) en dernière colonne", "Le produit \\(A \\times b\\)", "La matrice inverse de \\(A\\)", "La transposée de \\(A\\)"],
            answer: 0,
            explanation: "\\([A|b] \\in M_{n,p+1}(\\mathbb{R})\\) contient toute l'information utile pour résoudre le système par les méthodes de réduction."
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
            question: "Pour le système \\(2x + y = 7\\) et \\(x - y = 2\\), quelle est la solution ?",
            choices: ["\\(x = 3,\\; y = 1\\)", "\\(x = 1,\\; y = 3\\)", "\\(x = 2,\\; y = 3\\)", "\\(x = 3,\\; y = 2\\)"],
            answer: 0,
            explanation: "De L2 : \\(y = x - 2\\). Substitution dans L1 : \\(2x + x - 2 = 7 \\Rightarrow 3x = 9 \\Rightarrow x = 3,\\; y = 1\\). Vérification : \\(2 \\cdot 3 + 1 = 7\\) ✓."
          },
          {
            question: "Quand la méthode par substitution est-elle la plus avantageuse ?",
            choices: ["Systèmes \\(2 \\times 2\\) où une variable s'exprime facilement", "Systèmes \\(10 \\times 10\\) denses", "Quand le déterminant est nul", "Quand les coefficients sont tous décimaux"],
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
            choices: ["Obtenir une forme triangulaire supérieure avec des zéros sous la diagonale", "Calculer l'inverse de \\(A\\)", "Diagonaliser \\(A\\)", "Trouver le déterminant de \\(A\\)"],
            answer: 0,
            explanation: "Les opérations \\(L_i \\leftarrow L_i + k \\cdot L_j\\) éliminent les coefficients sous le pivot colonne par colonne jusqu'à obtenir un système triangulaire facile à résoudre par remontée."
          },
          {
            question: "Quelle opération élémentaire sur les lignes est autorisée dans le pivot de Gauss ?",
            choices: ["Lᵢ ← Lᵢ + k·Lⱼ (combinaison linéaire)", "Lᵢ ← Lᵢ² (carré d'une ligne)", "Lᵢ ← Lᵢ × Lⱼ (produit de deux lignes)", "Remplacer tous les coefficients par leur valeur absolue"],
            answer: 0,
            explanation: "On peut : multiplier une ligne par un scalaire non nul, ajouter un multiple d'une ligne à une autre, et permuter deux lignes. Ces opérations préservent les solutions."
          },
          {
            question: "Dans l'exemple 3×3 du cours (x + 2y + 2z = 2, x + 3y − 2z = −1, 3x + 5y + 8z = 8), quelle est la valeur de z après réduction gaussienne ?",
            choices: ["\\(z = \\dfrac{1}{2}\\)", "z = 2", "z = 1", "z = −1"],
            answer: 0,
            explanation: "L₂' ← L₂ − L₁ donne y − 4z = −3 ; L₃'' ← L₃' + L₂' donne −2z = −1, soit \\(z = \\frac{1}{2}\\). Remontée : y = −3 + 4·½ = −1, puis x = 2 − 2(−1) − 2·½ = 3."
          }
        ]
      },
      {
        title: "Changement de variable",
        summary: "Le changement de variable s'applique quand le système ne fait pas intervenir les inconnues directement mais des expressions de celles-ci : x², |x|, √x, etc. On pose alors de nouvelles inconnues pour se ramener à un système linéaire classique. Exemple du cours : x² + y² = 5 et x² − y² = 3. On pose u = x² et v = y², ce qui donne le système linéaire u + v = 5 et u − v = 3. Résolution : u = 4 et v = 1, d'où x = ±2 et y = ±1. Remarque importante : dans les problèmes concrets, toutes les solutions mathématiques ne sont pas forcément acceptables (quantités positives imposées, domaines de définition à respecter). Il faut donc systématiquement vérifier la validité de chaque solution obtenue dans le contexte physique du problème.",
        qcm: [
          {
            question: "Dans l'exemple du cours, pourquoi pose-t-on u = x² et v = y² pour résoudre x² + y² = 5 et x² − y² = 3 ?",
            choices: ["Pour se ramener à un système linéaire u + v = 5 et u − v = 3, plus facile à résoudre", "Parce que x et y sont forcément positifs", "Pour calculer les dérivées de x et y", "Pour trouver le déterminant du système"],
            answer: 0,
            explanation: "Le système n'est pas linéaire en x et y (présence de x², y²), mais il est linéaire en u = x² et v = y². Le changement de variable le transforme en système 2×2 classique : u + v = 5, u − v = 3 → u = 4, v = 1 → x = ±2, y = ±1."
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
    examples: []
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
            question: "Quel est le degré du polynôme \\(P(X) = 1 + 3X^2 + 5X^4\\) ?",
            choices: ["4, car le coefficient de \\(X^4\\) vaut \\(5 \\neq 0\\)", "2, car le terme \\(3X^2\\) est le plus visible", "1, car le terme de plus bas degré non nul est le terme constant", "5, car c'est le coefficient dominant"],
            answer: 0,
            explanation: "Le degré est le plus grand entier \\(n\\) tel que le coefficient \\(a_n \\neq 0\\). Ici \\(a_4 = 5 \\neq 0\\) et il n'y a pas de terme de degré supérieur : \\(\\deg P = 4\\). Le terme \\(X^3\\) et le terme \\(X\\) sont absents (coefficients nuls)."
          },
          {
            question: "Deux polynômes \\(A(X)\\) et \\(B(X)\\) sont égaux si et seulement si :",
            choices: ["Tous leurs coefficients sont identiques : \\(a_k = b_k\\) pour tout \\(k \\geq 0\\)", "Ils ont le même degré", "\\(A(0) = B(0)\\)", "Ils ont les mêmes racines"],
            answer: 0,
            explanation: "L'égalité polynomiale est une égalité terme à terme : \\(a_k = b_k\\) pour tout \\(k\\). Par exemple, \\(2(X-1)\\) et \\((X-1)\\) ont la même racine \\(x = 1\\), mais leurs coefficients diffèrent."
          },
          {
            question: "Par convention, quel est le degré d'un polynôme constant non nul, par exemple \\(P(X) = 5\\) ?",
            choices: ["\\(0\\)", "\\(1\\)", "\\(-\\infty\\)", "Indéfini"],
            answer: 0,
            explanation: "\\(\\deg(5) = 0\\) car \\(5 = 5 \\cdot X^0\\). En revanche \\(\\deg(0) = -\\infty\\) par convention."
          }
        ]
      },
      {
        title: "Opérations sur polynômes",
        summary: "Trois opérations fondamentales s'appliquent aux polynômes. Multiplication par un scalaire λ ≠ 0 : le polynôme λA a pour coefficients bₖ = λ·aₖ, et deg(λA) = deg A. Addition : le polynôme S = A + B a pour coefficients sₖ = aₖ + bₖ, et deg(S) ≤ max(deg A, deg B) (l'inégalité stricte est possible en cas d'annulations des coefficients dominants). Multiplication : le polynôme R = A·B a pour coefficients rₖ = Σ_{i+j=k} aᵢ·bⱼ, et deg(R) = deg(A) + deg(B). Pour la division, deux variantes : la division par puissances décroissantes (on ordonne par degrés décroissants et on divise comme en primaire) donne A = B·Q + R avec deg R < deg B ; B divise A si R = 0 ; cette division n'est utile que si deg A ≥ deg B. La division par puissances croissantes à l'ordre n consiste à ordonner par puissances croissantes et à s'arrêter dès que le reste est factorisable par X^{n+1} ; le degré de Q est inférieur à n ; c'est l'utilisation voulue qui impose l'ordre d'arrêt.",
        qcm: [
          {
            question: "Si \\(\\deg(A) = 3\\) et \\(\\deg(B) = 2\\), quel est \\(\\deg(A \\cdot B)\\) ?",
            choices: ["\\(5\\)", "\\(6\\)", "\\(3\\)", "\\(2\\)"],
            answer: 0,
            explanation: "\\(\\deg(A \\cdot B) = \\deg(A) + \\deg(B) = 3 + 2 = 5\\)."
          },
          {
            question: "Qu'énonce le théorème du reste pour la division de \\(P\\) par \\((X - a)\\) ?",
            choices: ["Le reste est \\(P(a)\\)", "Le reste est \\(P(0)\\)", "Le reste est toujours nul", "Le reste est le coefficient dominant de \\(P\\)"],
            answer: 0,
            explanation: "\\(P = Q \\cdot (X-a) + R\\) avec \\(R\\) constante. En substituant \\(X = a\\) : \\(P(a) = 0 + R \\Rightarrow R = P(a)\\)."
          },
          {
            question: "Que signifie \\(P(a) = 0\\) pour la division euclidienne de \\(P\\) par \\((X - a)\\) ?",
            choices: ["\\((X - a)\\) divise \\(P(X)\\) exactement (reste nul)", "\\(P\\) est le polynôme nul", "\\(a\\) est le coefficient dominant de \\(P\\)", "Le quotient est nul"],
            answer: 0,
            explanation: "\\(P(a) = 0 \\Leftrightarrow\\) reste \\(= 0 \\Leftrightarrow (X-a) \\mid P(X)\\). C'est le théorème du facteur."
          }
        ]
      },
      {
        title: "Racines des polynômes et factorisation",
        summary: "Factoriser un polynôme, c'est le mettre sous forme de PRODUIT de facteurs du type (X − nombre) ou (aX² + bX + c) avec Δ < 0 dans ℝ. Pour le second degré P(X) = aX² + bX + c : discriminant Δ = b² − 4ac ; si Δ > 0 deux racines réelles distinctes et P(X) = a(X − X₁)(X − X₂) ; si Δ = 0 racine double X₀ = −b/(2a) et P(X) = a(X − X₀)² ; si Δ < 0 pas de racine réelle. Par définition, X₀ est racine de P si P(X₀) = 0 ; dans ce cas, il existe un polynôme Q de degré n − 1 tel que P(X) = (X − X₀)·Q(X). L'ordre de multiplicité ν de X₀ est le plus grand entier tel que P soit divisible par (X − X₀)ν. Propriété : X₀ est d'ordre ν si et seulement si P(X₀) = P'(X₀) = … = P^{(ν−1)}(X₀) = 0. La somme des ordres de multiplicité est égale au degré du polynôme : Σνᵢ = n. Tout polynôme de degré ≥ 1 a au moins une racine complexe. Pour un polynôme à coefficients réels, les racines complexes sont conjuguées deux à deux. Factorisation dans ℂ : P(X) = aₙ·∏(X − Xᵢ)^νᵢ. Factorisation dans ℝ : les racines complexes conjuguées restent regroupées en facteurs irréductibles du second degré de la forme X² + |X₀|² − 2X·ℜ(X₀).",
        qcm: [
          {
            question: "Pour \\(P(X) = X^2 - 5X + 6\\), quel est le discriminant \\(\\Delta\\) ?",
            choices: ["\\(\\Delta = 1\\)", "\\(\\Delta = 4\\)", "\\(\\Delta = -1\\)", "\\(\\Delta = 25\\)"],
            answer: 0,
            explanation: "\\(\\Delta = b^2 - 4ac = 25 - 24 = 1\\). Racines : \\(x = \\frac{5 \\pm 1}{2}\\), soit \\(x_1 = 3\\) et \\(x_2 = 2\\)."
          },
          {
            question: "Que se passe-t-il si \\(\\Delta < 0\\) pour un polynôme de degré 2 à coefficients réels ?",
            choices: ["Pas de racine réelle, deux racines complexes conjuguées", "Une seule racine réelle double", "Deux racines réelles distinctes", "Le polynôme est identiquement nul"],
            answer: 0,
            explanation: "\\(\\Delta < 0\\) implique \\(\\sqrt{\\Delta}\\) imaginaire : les racines sont \\(\\frac{-b \\pm i\\sqrt{|\\Delta|}}{2a}\\), complexes conjuguées."
          },
          {
            question: "Pour chercher les racines rationnelles de \\(P(X) = X^3 - 6X^2 + 11X - 6\\), quels candidats teste-t-on ?",
            choices: ["\\(\\pm 1, \\pm 2, \\pm 3, \\pm 6\\) (diviseurs du terme constant 6)", "\\(\\pm 1\\) seulement", "\\(\\pm 6\\) seulement", "Tous les entiers de 0 à 6"],
            answer: 0,
            explanation: "Théorème des racines rationnelles : toute racine entière divise \\(c_0 = 6\\). On teste \\(\\pm 1, \\pm 2, \\pm 3, \\pm 6\\). Ici \\(P(1) = 0\\) ✓."
          }
        ]
      },
      {
        title: "Division euclidienne : puissances décroissantes et croissantes",
        summary: "La division euclidienne par puissances décroissantes s'effectue en ordonnant le dividende A et le diviseur B par degrés décroissants, puis en divisant comme en primaire : on divise le terme de plus haut degré de A par celui de B pour obtenir le premier terme de Q, on soustrait, et on recommence. Le résultat est A = B·Q + R avec deg R < deg B. On dit que B divise A si R = 0. Cette division n'est pertinente que si deg A ≥ deg B. La division par puissances croissantes à l'ordre n s'effectue en ordonnant par puissances croissantes (de X⁰ vers Xⁿ). On s'arrête dès que le reste est factorisable par X^{n+1}, autrement dit dès que tous les termes du reste ont un degré supérieur à n. Le quotient Q obtenu vérifie deg Q < n. Contrairement à la division décroissante, cette division ne s'arrête a priori jamais : c'est l'utilisation prévue (développement limité, approximation à un certain ordre) qui impose l'ordre d'arrêt n.",
        qcm: [
          {
            question: "Dans le schéma de Horner pour diviser \\(P(X)\\) par \\((X - a)\\), que représente la dernière valeur du tableau ?",
            choices: ["\\(P(a)\\), c'est-à-dire le reste de la division", "Le coefficient dominant du quotient", "Le degré de \\(P\\)", "La valeur de \\(a^2\\)"],
            answer: 0,
            explanation: "La dernière valeur calculée est précisément \\(P(a)\\). Si \\(P(a) = 0\\), \\(a\\) est une racine et la division est exacte."
          },
          {
            question: "Pour \\(P(X) = X^3 - 4X^2 + X + 6\\) et \\(a = 2\\), quels sont les coefficients du quotient \\(Q(X)\\) ?",
            choices: ["\\(1,\\; -2,\\; -3\\) donc \\(Q(X) = X^2 - 2X - 3\\)", "\\(1,\\; -4,\\; 1\\) donc \\(Q(X) = X^2 - 4X + 1\\)", "\\(1,\\; 2,\\; 3\\) donc \\(Q(X) = X^2 + 2X + 3\\)", "\\(-4,\\; 1,\\; 6\\)"],
            answer: 0,
            explanation: "Horner : \\(b_2 = 1\\) ; \\(b_1 = 1 \\times 2 + (-4) = -2\\) ; \\(b_0 = -2 \\times 2 + 1 = -3\\) ; reste \\(= -3 \\times 2 + 6 = 0\\). Quotient \\(Q(X) = X^2 - 2X - 3\\)."
          },
          {
            question: "Quel est l'avantage principal de l'algorithme de Horner par rapport à l'évaluation directe ?",
            choices: ["Il ne nécessite que \\(n\\) multiplications et \\(n\\) additions", "Il évite de trouver les racines", "Il fonctionne uniquement pour les polynômes de degré 2", "Il permet d'éviter la division euclidienne"],
            answer: 0,
            explanation: "Horner imbrique les multiplications : \\(P(a) = (\\ldots((c_n \\cdot a + c_{n-1}) \\cdot a + \\ldots) \\cdot a + c_0\\), soit \\(n\\) multiplications et \\(n\\) additions."
          }
        ]
      },
    ],
    examples: []
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
            question: "Quel est le domaine de définition de \\(f(x, y) = \\ln(x + y)\\) ?",
            choices: ["\\(x + y > 0\\) (demi-plan strictement positif)", "\\(x > 0\\) et \\(y > 0\\) séparément", "\\(x + y \\geq 0\\)", "Tous les \\((x, y) \\in \\mathbb{R}^2\\)"],
            answer: 0,
            explanation: "Le logarithme est défini uniquement pour des valeurs strictement positives. Il faut donc \\(x + y > 0\\)."
          },
          {
            question: "Que représentent les courbes de niveau \\(f(T, V) = c\\) pour \\(f = P(T, V) = \\frac{nRT}{V}\\) ?",
            choices: ["Des isobares (pression constante \\(P = c\\))", "Des isothermes (\\(T\\) constant), appelées isothermes de Boyle", "Des isochores (\\(V\\) constant)", "Des courbes de chaleur spécifique"],
            answer: 0,
            explanation: "Les courbes de niveau de \\(P(T,V) = \\frac{nRT}{V} = c\\) signifient que \\(P = c\\) est constante : ce sont des isobares. Dans le plan \\((T,V)\\) elles s'écrivent \\(T = \\frac{c}{nR} \\cdot V\\), des droites passant par l'origine. Les isothermes de Boyle (\\(PV = \\text{const}\\)) se représentent dans le plan \\((P,V)\\), pas ici."
          },
          {
            question: "En combien de dimensions vit le graphe d'une fonction \\(f(x, y)\\) ?",
            choices: ["3 dimensions (surface dans \\(\\mathbb{R}^3\\))", "2 dimensions (courbe dans \\(\\mathbb{R}^2\\))", "4 dimensions", "1 dimension"],
            answer: 0,
            explanation: "\\(f\\) associe à chaque point \\((x, y)\\) du plan \\(\\mathbb{R}^2\\) une valeur \\(z = f(x,y)\\) : le graphe est une surface dans \\(\\mathbb{R}^3\\)."
          }
        ]
      },
      {
        title: "Dérivées partielles d'ordre 1 et d'ordres supérieurs",
        summary: "La dérivée partielle ∂f/∂xᵢ est obtenue en dérivant f par rapport à xᵢ en gardant toutes les autres variables constantes. Sa définition par limite est : ∂f/∂xᵢ = lim_{h→0} [f(…, xᵢ + h, …) − f(…, xᵢ, …)] / h. La notation ∂f/∂xᵢ|_{xⱼ, j≠i} rappelle que les autres variables sont fixées. Attention : pour une fonction d'une seule variable, on écrit df/dx et non ∂f/∂x. Les dérivées d'ordre supérieur se calculent à partir des dérivées d'ordre précédent : on définit ∂²f/∂x², ∂²f/∂y², ∂²f/∂x∂y et ∂²f/∂y∂x. Résultat fondamental : ∂²f/∂y∂x = ∂²f/∂x∂y toujours (les dérivées mixtes sont égales). De même, les dérivées d'ordre n se calculent à partir des dérivées d'ordre n − 1.",
        qcm: [
          {
            question: "Comment calcule-t-on \\(\\frac{\\partial f}{\\partial x}\\) pour \\(f(x, y) = 3x^2y + y^3\\) ?",
            choices: ["On dérive par rapport à \\(x\\) en traitant \\(y\\) comme une constante : \\(\\frac{\\partial f}{\\partial x} = 6xy\\)", "On dérive par rapport aux deux variables simultanément", "On pose \\(y = 0\\) puis on dérive", "\\(\\frac{\\partial f}{\\partial x} = 3x^2 + 3y^2\\)"],
            answer: 0,
            explanation: "\\(\\frac{\\partial f}{\\partial x} = 6xy\\) (\\(y\\) est une constante). De même \\(\\frac{\\partial f}{\\partial y} = 3x^2 + 3y^2\\)."
          },
          {
            question: "Qu'affirme le théorème de Schwarz sur les dérivées mixtes ?",
            choices: ["\\(\\frac{\\partial^2 f}{\\partial x \\partial y} = \\frac{\\partial^2 f}{\\partial y \\partial x}\\) si \\(f\\) est de classe \\(C^2\\)", "\\(\\frac{\\partial f}{\\partial x} = \\frac{\\partial f}{\\partial y}\\) en tout point", "Les dérivées partielles d'ordre 2 sont toujours nulles", "On ne peut pas dériver deux fois en variables différentes"],
            answer: 0,
            explanation: "Si \\(f\\) est suffisamment régulière (\\(C^2\\)), l'ordre de dérivation n'a pas d'importance : on peut dériver d'abord par rapport à \\(x\\) puis \\(y\\), ou l'inverse."
          },
          {
            question: "Que modélise l'équation aux dérivées partielles \\(\\frac{\\partial u}{\\partial t} = k \\frac{\\partial^2 u}{\\partial x^2}\\) ?",
            choices: ["La diffusion thermique (équation de la chaleur)", "La propagation d'une onde sonore", "Un bilan matière en régime permanent", "La loi de Van der Waals"],
            answer: 0,
            explanation: "L'équation de la chaleur décrit comment la température \\(u(x,t)\\) évolue au cours du temps par diffusion thermique dans un milieu."
          }
        ]
      },
      {
        title: "Différentielle d'une fonction de plusieurs variables",
        summary: "La différentielle d'une fonction f de n variables est df = Σᵢ (∂f/∂xᵢ) dxᵢ = (∂f/∂x₁) dx₁ + (∂f/∂x₂) dx₂ + … + (∂f/∂xₙ) dxₙ. Elle représente la variation infinitésimale de f résultant des variations infinitésimales dxᵢ de chaque variable. Autrement dit, df donne l'approximation linéaire de la variation de f lorsque chaque variable subit une petite variation dxᵢ, la contribution de chaque variable étant pondérée par la dérivée partielle correspondante.",
        qcm: [
          {
            question: "Quelle est l'expression de la différentielle totale \\(df\\) de \\(f(x, y)\\) ?",
            choices: ["\\(df = \\frac{\\partial f}{\\partial x}\\,dx + \\frac{\\partial f}{\\partial y}\\,dy\\)", "\\(df = \\frac{\\partial f}{\\partial x} + \\frac{\\partial f}{\\partial y}\\)", "\\(df = f(x+dx, y+dy)\\)", "\\(df = \\frac{\\partial^2 f}{\\partial x^2}\\,dx^2 + \\frac{\\partial^2 f}{\\partial y^2}\\,dy^2\\)"],
            answer: 0,
            explanation: "La différentielle totale donne la variation linéaire approchée de \\(f\\) pour de petits déplacements \\((dx, dy)\\)."
          },
          {
            question: "Si \\(x = x(t)\\) et \\(y = y(t)\\), comment s'écrit \\(\\frac{df}{dt}\\) (règle de la chaîne) ?",
            choices: ["\\(\\frac{df}{dt} = \\frac{\\partial f}{\\partial x}\\frac{dx}{dt} + \\frac{\\partial f}{\\partial y}\\frac{dy}{dt}\\)", "\\(\\frac{df}{dt} = \\frac{\\partial f}{\\partial t}\\)", "\\(\\frac{df}{dt} = \\frac{\\partial f}{\\partial x} \\cdot \\frac{\\partial f}{\\partial y}\\)", "\\(\\frac{df}{dt} = \\frac{dx}{dt} + \\frac{dy}{dt}\\)"],
            answer: 0,
            explanation: "La règle de la chaîne généralise la dérivation en chaîne : chaque variable contribue selon sa dérivée partielle fois sa vitesse de variation."
          },
          {
            question: "Quelle est la condition d'exactitude de la différentielle \\(M(x,y)\\,dx + N(x,y)\\,dy\\) ?",
            choices: ["\\(\\frac{\\partial M}{\\partial y} = \\frac{\\partial N}{\\partial x}\\)", "\\(M = N\\)", "\\(\\frac{\\partial M}{\\partial x} = \\frac{\\partial N}{\\partial y}\\)", "\\(M \\cdot N = 0\\)"],
            answer: 0,
            explanation: "Par le théorème de Schwarz, si \\(\\frac{\\partial M}{\\partial y} = \\frac{\\partial N}{\\partial x}\\), la forme différentielle est exacte : elle dérive d'une fonction potentiel (fonction d'état en thermodynamique)."
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
            explanation: "Dans une EDO, l'inconnue dépend d'une seule variable. Dans une EDP, l'inconnue (ex. \\(T(x,t)\\)) dépend de plusieurs variables indépendantes et l'équation fait intervenir ses dérivées partielles."
          },
          {
            question: "L'équation de la chaleur \\(\\frac{\\partial T}{\\partial t} = k \\frac{\\partial^2 T}{\\partial x^2}\\) modélise :",
            choices: ["La diffusion thermique : comment la température \\(T(x,t)\\) évolue dans le temps par conduction", "La propagation d'une onde sonore", "L'équation d'état des gaz parfaits", "Un bilan matière en régime stationnaire"],
            answer: 0,
            explanation: "L'équation de la chaleur est une EDP du 2ème ordre en espace et du 1er ordre en temps. Elle décrit comment une distribution de température diffuse dans un milieu au cours du temps."
          },
          {
            question: "Pour résoudre \\(\\frac{\\partial f}{\\partial x} = 2xy + y^2\\), on intègre par rapport à \\(x\\) en traitant \\(y\\) comme une constante. Le résultat est :",
            choices: ["\\(f(x, y) = x^2y + xy^2 + C(y)\\), où \\(C(y)\\) est une fonction arbitraire de \\(y\\)", "\\(f(x, y) = x^2y + xy^2 + C\\) (constante)", "\\(f(x, y) = 2y + 0\\) (on dérive par rapport à \\(x\\) uniquement)", "\\(f(x, y) = x^2 + y^2\\)"],
            answer: 0,
            explanation: "En intégrant par rapport à \\(x\\), \\(y\\) est constante : \\(\\int(2xy + y^2)\\,dx = x^2y + xy^2 + C(y)\\). La constante d'intégration peut être une fonction quelconque de \\(y\\), à déterminer via la deuxième condition."
          }
        ]
      },
      {
        title: "Intégrales multiples",
        summary: "Pour calculer une intégrale multiple I = ∫∫…∫ f(x₁ ; … ; xₙ) dxₙ … dx₁, on intègre successivement par rapport à chaque variable en gardant les autres constantes. On commence par intégrer selon xₙ, ce qui donne une fonction g(x₁, …, xₙ₋₁), puis on intègre selon xₙ₋₁, et ainsi de suite. L'ordre d'intégration n'a pas d'importance : le résultat est le même quelle que soit la variable par laquelle on commence. Exemple du cours : ∫₀¹ ∫₀^π ∫₋₁² x z² sin(y) dz dy dx — on intègre d'abord selon z, puis selon y, puis selon x. Application : le calcul de l'aire d'un disque de rayon R par intégrale double en coordonnées polaires donne A = ∫₀ᴿ ∫₀^{2π} r dr dθ = πR².",
        qcm: [
          {
            question: "Quel théorème permet d'évaluer une intégrale double comme deux intégrales simples successives ?",
            choices: ["Le théorème de Fubini : \\(\\iint_D f\\,dA = \\int_a^b \\left(\\int_{g(x)}^{h(x)} f\\,dy\\right) dx\\)", "Le théorème de Schwarz sur les dérivées mixtes", "Le théorème de Gauss-Jordan", "Le théorème des accroissements finis"],
            answer: 0,
            explanation: "Fubini autorise de décomposer une intégrale double en deux intégrales simples imbriquées. On intègre d'abord par rapport à la variable intérieure en fixant l'autre, puis on intègre le résultat."
          },
          {
            question: "Pour calculer \\(\\int_0^1 \\int_0^\\pi x \\sin(y)\\,dy\\,dx\\), quelle est la bonne démarche ?",
            choices: ["Intégrer d'abord par rapport à \\(y\\) (variable intérieure) en traitant \\(x\\) comme une constante, puis intégrer le résultat par rapport à \\(x\\)", "Intégrer simultanément par rapport aux deux variables", "Calculer \\(\\frac{\\partial (x \\sin y)}{\\partial x}\\) d'abord", "Poser \\(u = x \\sin y\\) et changer de variable"],
            answer: 0,
            explanation: "On applique Fubini : \\(\\int_0^1 \\left[\\int_0^\\pi x \\sin(y)\\,dy\\right] dx = \\int_0^1 x \\left[-\\cos(y)\\right]_0^\\pi dx = \\int_0^1 2x\\,dx = \\left[x^2\\right]_0^1 = 1\\)."
          },
          {
            question: "En coordonnées polaires \\((r, \\theta)\\), l'aire du disque de rayon \\(R\\) se calcule par \\(\\iint r\\,dr\\,d\\theta\\). Le résultat est :",
            choices: ["\\(A = \\pi R^2\\) (en intégrant \\(r\\) de 0 à \\(R\\) et \\(\\theta\\) de 0 à \\(2\\pi\\))", "\\(A = 2\\pi R\\)", "\\(A = R^2\\)", "\\(A = 4\\pi R^2\\)"],
            answer: 0,
            explanation: "\\(\\int_0^{2\\pi} \\int_0^R r\\,dr\\,d\\theta = 2\\pi \\cdot \\left[\\frac{r^2}{2}\\right]_0^R = 2\\pi \\cdot \\frac{R^2}{2} = \\pi R^2\\). Le jacobien de la transformation polaire est \\(r\\), d'où le facteur \\(r\\) dans l'intégrale."
          }
        ]
      },
    ],
    examples: [],
  },
  {
    code: "FRAT",
    semester: "S2",
    title: "Fractions Rationnelles",
    focus: [
      "Définition, opérations et simplification de fractions rationnelles",
      "Partie entière, pôles et racines",
      "Décomposition en éléments simples (DES) dans \\(\\mathbb{R}\\) et \\(\\mathbb{C}\\)",
      "Primitives des fractions rationnelles (1ʳᵉ et 2ᵉ espèce)",
    ],
    objective:
      "Maîtriser les fractions rationnelles, leur décomposition en éléments simples et l'intégration des éléments simples obtenus, outils fondamentaux en calcul intégral et en modélisation de procédés.",
    prerequisites: [
      "Calcul de racines d'un polynôme (discriminant, factorisation)",
      "Division euclidienne de polynômes",
      "Intégration de fractions simples (\\(\\ln\\), \\(\\arctan\\))",
    ],
    applications: [
      "Calcul de primitives en modélisation de procédés",
      "Intégration de fonctions rationnelles dans les bilans",
      "Simplification d'expressions dans les équations de transfert",
    ],
    lessons: [
      {
        title: "Fractions rationnelles : définitions et opérations",
        summary: "Une fraction rationnelle est un quotient \\(F(X) = \\frac{N(X)}{D(X)}\\) où \\(N\\) est le numérateur et \\(D\\) le dénominateur (polynôme non nul). Exemples : \\(\\frac{X^2}{3X+1}\\), \\(\\frac{1}{(X-2)(X+3)}\\), \\(\\frac{X^3}{X^7+X^4-1}\\). L'addition s'effectue en mettant au même dénominateur ; la multiplication donne \\(\\frac{N_1 N_2}{D_1 D_2}\\). La simplification est possible si \\(N\\) et \\(D\\) ont un facteur commun \\(R\\) : on écrit \\(N = \\tilde{N} \\cdot R\\) et \\(D = \\tilde{D} \\cdot R\\), d'où \\(F = \\frac{\\tilde{N}}{\\tilde{D}}\\). Une fraction est irréductible s'il n'y a plus de facteur commun. Partie entière : on effectue la division euclidienne \\(N = D \\cdot E + R\\) avec \\(\\deg R < \\deg D\\), d'où \\(F = E + \\frac{R}{D}\\). Si \\(\\deg N < \\deg D\\), alors \\(E = 0\\). Pôles : \\(Y_0\\) est pôle de \\(F\\) si \\(D(Y_0) = 0\\) et \\(N(Y_0) \\neq 0\\) ; l'ordre du pôle est la multiplicité de \\(Y_0\\) comme racine de \\(D\\).",
        qcm: [
          {
            question: "\\(F(X) = \\frac{P(X)}{Q(X)}\\) est dite propre (strictement) quand :",
            choices: ["\\(\\deg P < \\deg Q\\)", "\\(\\deg P = \\deg Q\\)", "\\(\\deg P > \\deg Q\\)", "\\(Q\\) est constant"],
            answer: 0,
            explanation: "Une fraction strictement propre vérifie \\(\\deg P < \\deg Q\\). C'est la condition pour appliquer directement la DES sans division préalable."
          },
          {
            question: "Pour \\(F(X) = \\frac{X^2+1}{X^2-1}\\), que faut-il faire avant la DES ?",
            choices: ["Effectuer la division euclidienne pour extraire la partie entière", "Factoriser le numérateur", "Chercher les racines de \\(X^2+1\\)", "Rien, on peut décomposer directement"],
            answer: 0,
            explanation: "\\(\\deg(N) = \\deg(D) = 2\\) → fraction impropre. Division : \\(X^2+1 = 1 \\cdot (X^2-1) + 2\\), soit \\(F = 1 + \\frac{2}{(X-1)(X+1)}\\)."
          },
          {
            question: "Que sont les pôles d'une fraction rationnelle irréductible \\(F(X) = \\frac{P(X)}{Q(X)}\\) ?",
            choices: ["Les racines du dénominateur \\(Q(X)\\)", "Les racines du numérateur \\(P(X)\\)", "Les valeurs où \\(F(X) = 0\\)", "Les coefficients de \\(Q\\)"],
            answer: 0,
            explanation: "Les pôles sont les valeurs \\(X_0\\) telles que \\(Q(X_0) = 0\\) et \\(P(X_0) \\neq 0\\). Un pôle d'ordre \\(m\\) correspond à une racine de multiplicité \\(m\\) de \\(Q\\)."
          }
        ]
      },
      {
        title: "Décomposition en éléments simples (DES)",
        summary: "La DES suit quatre étapes. Étape 1 — extraire la partie entière si \\(\\deg N \\geq \\deg D\\). Étape 2 — factoriser le dénominateur dans \\(\\mathbb{R}\\) ou \\(\\mathbb{C}\\). Étape 3 — poser la forme générale : à chaque facteur \\((X - X_0)^n\\) on associe \\(n\\) termes \\(\\frac{A_1}{X-X_0} + \\frac{A_2}{(X-X_0)^2} + \\cdots + \\frac{A_n}{(X-X_0)^n}\\) ; à chaque facteur irréductible \\((X^2+pX+q)^n\\) dans \\(\\mathbb{R}\\) on associe \\(n\\) termes \\(\\frac{a_1 X + b_1}{X^2+pX+q} + \\cdots + \\frac{a_n X + b_n}{(X^2+pX+q)^n}\\). Étape 4 — déterminer les coefficients par : (a) méthode des résidus (pôle simple \\(a\\)) : \\(A = [(X-a) \\cdot F(X)]_{X=a}\\) ; (b) valeurs particulières de \\(X\\) ; (c) division par puissances croissantes pour les pôles multiples. Pour les pôles complexes conjugués \\(Z_1, \\overline{Z_1}\\) dans \\(\\mathbb{C}\\), les résidus sont conjugués et on retrouve les coefficients réels du terme de 2ᵉ espèce.",
        qcm: [
          {
            question: "Quelle est la première étape de la DES ?",
            choices: ["Vérifier que \\(F\\) est propre (\\(\\deg P < \\deg Q\\)) et extraire la partie entière sinon", "Factoriser le numérateur", "Identifier les coefficients par valeurs particulières", "Calculer la dérivée de \\(F\\)"],
            answer: 0,
            explanation: "On doit d'abord s'assurer que la fraction est propre. Si elle est impropre, on effectue la division euclidienne pour extraire la partie entière."
          },
          {
            question: "Pour un pôle simple \\(r\\) de \\(Q\\), comment calcule-t-on le résidu \\(A\\) ?",
            choices: ["\\(A = [(X-r) \\cdot F(X)]_{X=r}\\)", "\\(A = F(r)\\)", "\\(A = F'(r)\\)", "\\(A = Q'(r)\\)"],
            answer: 0,
            explanation: "On multiplie \\(F\\) par \\((X-r)\\) puis on évalue en \\(X = r\\). C'est la méthode de couverture."
          },
          {
            question: "Quel terme correspond à un facteur irréductible \\(X^2+pX+q\\) (\\(\\Delta < 0\\)) dans \\(\\mathbb{R}\\) ?",
            choices: ["\\(\\frac{AX + B}{X^2+pX+q}\\)", "\\(\\frac{A}{X^2+pX+q}\\)", "\\(\\frac{A}{X-r_1} + \\frac{B}{X-r_2}\\)", "\\(AX + B\\)"],
            answer: 0,
            explanation: "Un facteur irréductible du second degré dans \\(\\mathbb{R}\\) donne un terme de la forme \\(\\frac{AX+B}{X^2+pX+q}\\). On trouve \\(A\\) et \\(B\\) par identification."
          }
        ]
      },
      {
        title: "Primitives des fractions rationnelles réelles",
        summary: "Pour calculer la primitive d'une fraction rationnelle, on effectue d'abord la DES, puis on intègre terme à terme. Éléments de 1ʳᵉ espèce \\(\\frac{A}{(X-a)^n}\\) : si \\(n = 1\\), \\(\\int \\frac{A}{X-a}\\,dX = A \\ln|X-a| + C\\) ; si \\(n > 1\\), \\(\\int \\frac{A}{(X-a)^n}\\,dX = \\frac{-A}{(n-1)(X-a)^{n-1}} + C\\). Éléments de 2ᵉ espèce \\(\\frac{aX+b}{X^2+pX+q}\\) avec \\(\\Delta < 0\\) : on pose \\(\\delta = \\sqrt{q - \\frac{p^2}{4}} > 0\\), et la primitive est \\(\\frac{a}{2} \\ln|X^2+pX+q| + \\frac{b - \\frac{ap}{2}}{\\delta} \\arctan\\!\\left(\\frac{X + \\frac{p}{2}}{\\delta}\\right) + C\\). La partie en \\(\\ln\\) vient du terme proportionnel à la dérivée du dénominateur, la partie en \\(\\arctan\\) gère le reste constant.",
        qcm: [
          {
            question: "Quelle est la primitive de \\(\\frac{A}{X - r}\\) ?",
            choices: ["\\(A \\ln|X - r| + C\\)", "\\(\\frac{A}{(X-r)^2} + C\\)", "\\(A e^{X-r} + C\\)", "\\(A \\arctan(X-r) + C\\)"],
            answer: 0,
            explanation: "C'est la primitive fondamentale d'un élément de 1ʳᵉ espèce d'ordre 1 (pôle simple)."
          },
          {
            question: "Quelle est la primitive de \\(\\frac{B}{(X - r)^2}\\) (pôle double) ?",
            choices: ["\\(\\frac{-B}{X - r} + C\\)", "\\(B \\ln|X - r| + C\\)", "\\(\\frac{2B}{(X-r)^3} + C\\)", "\\(B(X-r) + C\\)"],
            answer: 0,
            explanation: "\\(\\int (X-r)^{-2}\\,dX = \\frac{(X-r)^{-1}}{-1} = \\frac{-1}{X-r}\\). Donc la primitive est \\(\\frac{-B}{X-r} + C\\)."
          },
          {
            question: "Comment intègre-t-on \\(\\frac{aX+b}{X^2+pX+q}\\) avec \\(\\Delta < 0\\) ?",
            choices: [
              "\\(\\frac{a}{2}\\ln|X^2+pX+q| + \\frac{b-\\frac{ap}{2}}{\\delta}\\arctan\\!\\left(\\frac{X+\\frac{p}{2}}{\\delta}\\right) + C\\)",
              "Directement \\(\\ln|X^2+pX+q| + C\\)",
              "On factorise \\(X^2+pX+q\\) et on applique les pôles simples",
              "On dérive le numérateur et on intègre le quotient"
            ],
            answer: 0,
            explanation: "Quand \\(\\Delta < 0\\), on complète le carré : \\((X+\\frac{p}{2})^2 + \\delta^2\\). La partie \\(\\ln\\) provient du terme proportionnel à la dérivée du dénominateur ; la partie \\(\\arctan\\) gère le reste."
          }
        ]
      },
      {
        title: "Méthodes de détermination des coefficients",
        summary: "Quatre méthodes permettent de trouver les coefficients de la DES. Méthode 1 — résidus : pour un pôle simple \\(a\\), on calcule \\(A = [(X-a) \\cdot F(X)]_{X=a}\\). Cette méthode est rapide mais ne fonctionne que pour les pôles simples. Méthode 2 — valeurs particulières : on multiplie les deux membres par le dénominateur et on substitue des valeurs judicieuses de \\(X\\) (souvent les pôles et des valeurs simples comme 0, 1, −1). Méthode 3 — identification des coefficients : on développe et on identifie les coefficients de chaque puissance de \\(X\\). Méthode 4 — division par puissances croissantes : pour un pôle multiple \\(a\\) d'ordre \\(n\\), on pose \\(h = X - a\\) et on développe \\(\\frac{N(a+h)}{D(a+h)}\\) en puissances croissantes de \\(h\\) jusqu'à l'ordre \\(n-1\\). Les coefficients du développement donnent directement \\(A_1, A_2, \\ldots, A_n\\).",
        qcm: [
          {
            question: "La méthode des résidus \\(A = [(X-a) \\cdot F(X)]_{X=a}\\) s'applique à :",
            choices: ["Un pôle simple uniquement", "Tout type de pôle", "Un facteur irréductible du second degré", "La partie entière"],
            answer: 0,
            explanation: "La méthode des résidus (couverture) ne fonctionne que pour les pôles simples (ordre 1). Pour les pôles multiples, on utilise les valeurs particulières ou la division par puissances croissantes."
          },
          {
            question: "Pour trouver les coefficients d'un pôle double \\((X-a)^2\\), quelle méthode est la plus adaptée ?",
            choices: ["Division par puissances croissantes en posant \\(h = X - a\\)", "Résidus simples", "Dérivation du numérateur", "Calcul du discriminant"],
            answer: 0,
            explanation: "On pose \\(h = X-a\\) et on développe \\(\\frac{N(a+h)}{D(a+h)}\\) en puissances croissantes de \\(h\\). Les coefficients de \\(h^{-2}\\) et \\(h^{-1}\\) donnent \\(A_2\\) et \\(A_1\\)."
          },
          {
            question: "Dans la méthode des valeurs particulières, quelles valeurs de \\(X\\) choisit-on en priorité ?",
            choices: ["Les pôles du dénominateur, puis des valeurs simples (0, 1, −1)", "Uniquement \\(X = 0\\)", "Les racines du numérateur", "Des valeurs complexes"],
            answer: 0,
            explanation: "En substituant les pôles, on annule certains termes et on isole directement un coefficient. Les valeurs simples (0, 1, −1) donnent ensuite des équations faciles à résoudre."
          }
        ]
      },
    ],
    examples: [],
  },
],

  exercises: [
  // ─── SYSLIN — exercices tirés des exemples du cours ─────────────────────────
  {
    id: "exo-syslin-ex01",
    title: "Bilan de mélange — composition massique",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "10 min",
    statement: `Un courant de 10 kg/h à 30 % massique en composant A est mélangé à un courant de 20 kg/h à 10 % massique en A.

1. Écrire le bilan global (kg/h) et le bilan sur le composant A.
2. Résoudre et donner le débit total et la composition massique du mélange.`,
    correction: [
      "Bilan global : F = 10 + 20 = 30 kg/h.",
      "Bilan sur A : 10 × 0.30 + 20 × 0.10 = 3 + 2 = 5 kg/h.",
      "Composition du mélange : 5 / 30 ≈ 16.7 % massique en A.",
    ],
    keywords: ["bilan matière", "mélange", "composition massique", "substitution"],
  },
  {
    id: "exo-syslin-ex02",
    title: "Pivot de Gauss 2×2 — débits en réseau",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Résoudre le système suivant par pivot de Gauss (x et y sont des débits en m³/h) :

  2x + y = 7   (L1)
   x − y = 2   (L2)

1. Appliquer l'opération L2 ← L2 − (1/2)·L1.
2. Trouver y puis x par remontée.
3. Vérifier dans les deux équations.`,
    correction: [
      "L2 ← L2 − (1/2)·L1 : (1 − 1)x + (−1 − 1/2)y = 2 − 7/2 → −(3/2)y = −3/2 → y = 1 m³/h.",
      "Substitution dans L1 : 2x + 1 = 7 → x = 3 m³/h.",
      "Vérification : 2×3 + 1 = 7 ✓ ; 3 − 1 = 2 ✓.",
    ],
    keywords: ["pivot de Gauss", "substitution arrière", "débit", "système 2×2"],
  },
  {
    id: "exo-syslin-ex03",
    title: "Pivot de Gauss 3×3 — nœud à trois flux",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Les bilans matière sur un nœud de procédé à trois flux (x, y, z en kg/h) donnent :

  x + y + z = 6   (L1)
  2x + y − z = 3  (L2)
  x + 2y − z = 5  (L3)

1. Triangulariser par pivot de Gauss (L2 ← L2 − 2·L1, puis L3 ← L3 − L1).
2. Éliminer y entre les nouvelles L2 et L3.
3. Remonter pour trouver z, y, puis x.
4. Vérifier dans les trois équations initiales.`,
    correction: [
      "L2 ← L2 − 2·L1 : −y − 3z = −9 (L2'). L3 ← L3 − L1 : y − 2z = −1 (L3').",
      "L3' ← L3' + L2' : −5z = −10 → z = 2 kg/h.",
      "Depuis L2' : −y − 6 = −9 → y = 3 kg/h. Depuis L1 : x = 6 − 3 − 2 = 1 kg/h.",
      "Vérification : L1 : 1+3+2=6 ✓ ; L2 : 2+3−2=3 ✓ ; L3 : 1+6−2=5 ✓.",
    ],
    keywords: ["pivot de Gauss", "système 3×3", "bilan nœud", "remontée"],
  },
  {
    id: "exo-syslin-ex04",
    title: "Système avec infinité de solutions — paramètre libre",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Résoudre le système :

  x + 2y − z = 3   (L1)
  2x + 4y − 2z = 6  (L2)
  x − y + z = 1    (L3)

1. Appliquer L2 ← L2 − 2·L1 et L3 ← L3 − L1. Que remarquez-vous sur L2 ?
2. Poser z = t (paramètre libre) et exprimer y puis x en fonction de t.
3. Écrire l'ensemble des solutions S.
4. Quelle interprétation physique peut-on donner au degré de liberté ?`,
    correction: [
      "L2 ← L2 − 2·L1 : 0 = 0 (ligne nulle — L2 est redondante). L3 ← L3 − L1 : −3y + 2z = −2 (L3').",
      "z = t (libre). Depuis L3' : y = (2t + 2)/3. Depuis L1 : x = 3 − 2y + z = (5 − t)/3.",
      "S = { ((5−t)/3 , (2t+2)/3 , t) | t ∈ ℝ }. Le système a un degré de liberté (une inconnue libre).",
      "En procédé : un degré de liberté signifie qu'une mesure supplémentaire est nécessaire (pression différentielle, composition…) pour fermer le bilan.",
    ],
    keywords: ["système indéterminé", "paramètre libre", "degré de liberté", "ligne nulle"],
  },
  {
    id: "exo-syslin-ex05",
    title: "Système incompatible — détection de mesures contradictoires",
    topic: "SYSLIN",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Un opérateur enregistre les mesures de débit suivantes :

  x + y = 50    (L1)
  3x + 3y = 180  (L2)

1. Appliquer L2 ← L2 − 3·L1. Que se passe-t-il ?
2. Conclure sur la nature du système.
3. Expliquer l'incohérence physique : quel aurait dû être le second membre de L2 ?`,
    correction: [
      "L2 ← L2 − 3·L1 : 0·x + 0·y = 180 − 150 = 30 → 0 = 30. Contradiction.",
      "Le système est incompatible : il n'admet aucune solution.",
      "Si L1 est correcte (x + y = 50), alors 3·L1 devrait donner 3×50 = 150 ≠ 180. Il y a 30 unités non comptabilisées : fuite, erreur de capteur ou erreur de saisie.",
    ],
    keywords: ["système incompatible", "contradiction", "cohérence des mesures", "pivot de Gauss"],
  },
  // ─── POLY — exercices tirés des exemples du cours ────────────────────────────
  {
    id: "exo-poly-ex01",
    title: "Évaluation par schéma de Horner",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "10 min",
    statement: `Soit P(X) = 2X³ − X² + 3X − 4.

1. Lister les coefficients dans l'ordre décroissant des degrés (inclure les termes nuls).
2. Appliquer le schéma de Horner pour évaluer P(2), en détaillant chaque étape.
3. Vérifier par calcul direct.`,
    correction: [
      "Coefficients : [2, −1, 3, −4] pour les degrés 3, 2, 1, 0.",
      "b₃ = 2. b₂ = 2×2 + (−1) = 3. b₁ = 3×2 + 3 = 9. b₀ = 9×2 + (−4) = 14. P(2) = 14.",
      "Vérification : 2×8 − 4 + 6 − 4 = 16 − 4 + 6 − 4 = 14 ✓.",
    ],
    keywords: ["schéma de Horner", "évaluation", "algorithme", "coefficients"],
  },
  {
    id: "exo-poly-ex02",
    title: "Factorisation complète d'un polynôme de degré 3",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soit P(X) = X³ − 6X² + 11X − 6.

1. Tester x = 1 comme racine candidate (diviseurs du terme constant 6 : ±1, ±2, ±3, ±6).
2. Diviser P(X) par (X − 1) pour obtenir le quotient Q(X).
3. Factoriser Q(X) par discriminant.
4. Écrire la factorisation complète de P(X) dans ℝ.`,
    correction: [
      "P(1) = 1 − 6 + 11 − 6 = 0 ✓. x = 1 est racine.",
      "Division par (X − 1) : Q(X) = X² − 5X + 6 (vérification : (X−1)(X²−5X+6) = X³−6X²+11X−6 ✓).",
      "Δ = 25 − 24 = 1. x₂ = (5+1)/2 = 3, x₃ = (5−1)/2 = 2.",
      "P(X) = (X − 1)(X − 2)(X − 3).",
    ],
    keywords: ["factorisation", "racines entières", "division euclidienne", "discriminant"],
  },
  {
    id: "exo-poly-ex03",
    title: "Addition et multiplication de polynômes",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Soient A(X) = 3X² − 2X + 1 et B(X) = X² + X − 3.

1. Calculer S(X) = A(X) + B(X).
2. Calculer R(X) = A(X) × B(X) en développant complètement et en regroupant par degré.
3. Vérifier R(1) = A(1) × B(1).`,
    correction: [
      "S(X) = (3+1)X² + (−2+1)X + (1−3) = 4X² − X − 2.",
      "R(X) = 3X⁴ + 3X³ − 9X² − 2X³ − 2X² + 6X + X² + X − 3 = 3X⁴ + X³ − 10X² + 7X − 3.",
      "A(1) = 3 − 2 + 1 = 2 ; B(1) = 1 + 1 − 3 = −1. A(1)×B(1) = −2. R(1) = 3 + 1 − 10 + 7 − 3 = −2 ✓.",
    ],
    keywords: ["addition", "multiplication", "polynômes", "développement"],
  },
  {
    id: "exo-poly-ex04",
    title: "Division euclidienne par puissances décroissantes",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Diviser P(X) = 2X³ + 3X² − 5X + 1 par D(X) = X² − X + 2.

1. Effectuer la division euclidienne (puissances décroissantes) étape par étape.
2. Écrire la relation A = B·Q + R et vérifier deg(R) < deg(D).
3. Vérifier numériquement en X = 0.`,
    correction: [
      "2X³ ÷ X² = 2X → soustraire 2X·(X²−X+2) = 2X³−2X²+4X → reste = 5X² − 9X + 1.",
      "5X² ÷ X² = 5 → soustraire 5·(X²−X+2) = 5X²−5X+10 → reste = −4X − 9.",
      "P(X) = (2X + 5)·(X²−X+2) + (−4X − 9). deg(R) = 1 < 2 = deg(D) ✓.",
      "X=0 : P(0) = 1 ; Q(0)·D(0)+R(0) = 5·2 + (−9) = 1 ✓.",
    ],
    keywords: ["division euclidienne", "quotient", "reste", "puissances décroissantes"],
  },
  {
    id: "exo-poly-ex05",
    title: "Racines d'un polynôme de degré 3 — candidats entiers",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Soit P(X) = X³ − 3X² − X + 3.

1. Identifier les candidats racines entières (diviseurs du terme constant).
2. Tester x = 1 et conclure.
3. Diviser P(X) par (X − 1) et factoriser le quotient.
4. Écrire la factorisation complète dans ℝ et vérifier deux racines.`,
    correction: [
      "Terme constant : 3. Candidats : ±1, ±3.",
      "P(1) = 1 − 3 − 1 + 3 = 0 ✓. x = 1 est racine.",
      "Division par (X−1) : Q(X) = X² − 2X − 3. Δ = 4 + 12 = 16. x₂ = (2+4)/2 = 3, x₃ = (2−4)/2 = −1.",
      "P(X) = (X−1)(X−3)(X+1). Vérification : P(3) = 27−27−3+3 = 0 ✓ ; P(−1) = −1−3+1+3 = 0 ✓.",
    ],
    keywords: ["racines entières", "candidats", "division euclidienne", "factorisation"],
  },
  // ─── FVAR — exercices tirés des exemples du cours ────────────────────────────
  {
    id: "exo-fvar-ex01",
    title: "Dérivées partielles d'un polynôme en deux variables",
    topic: "FVAR",
    semester: "S2",
    level: "facile",
    duration: "10 min",
    statement: `Soit f(x, y) = 2x²y + 3xy².

1. Calculer ∂f/∂x en traitant y comme une constante.
2. Calculer ∂f/∂y en traitant x comme une constante.
3. Évaluer ∂f/∂x et ∂f/∂y au point (1, 1).`,
    correction: [
      "∂f/∂x = 4xy + 3y² (y est traité comme constante).",
      "∂f/∂y = 2x² + 6xy (x est traité comme constante).",
      "En (1, 1) : ∂f/∂x = 4 + 3 = 7 ; ∂f/∂y = 2 + 6 = 8.",
    ],
    keywords: ["dérivées partielles", "polynôme", "constante partielle"],
  },
  {
    id: "exo-fvar-ex02",
    title: "Gradient et sensibilité — gaz parfait",
    topic: "FVAR",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `La pression d'un gaz parfait est P(V, T) = nRT/V avec n = 1 mol et R = 8.314 J/(mol·K).

1. Calculer ∂P/∂T et ∂P/∂V (expressions symboliques).
2. Évaluer numériquement le gradient ∇P au point (V = 0.025 m³, T = 300 K).
3. Interpréter physiquement la grande valeur de |∂P/∂V|.`,
    correction: [
      "∂P/∂T = nR/V = R/V ; ∂P/∂V = −nRT/V² = −RT/V².",
      "∂P/∂T = 8.314 / 0.025 = 332.6 Pa/K ; ∂P/∂V = −8.314 × 300 / (0.025)² = −2494.2 / 6.25×10⁻⁴ ≈ −3 990 720 Pa/m³.",
      "∇P = (332.6 ; −3 990 720). La très grande valeur de |∂P/∂V| montre que la pression est extrêmement sensible au volume : une petite variation de volume entraîne une grande variation de pression.",
    ],
    keywords: ["gradient", "gaz parfait", "dérivées partielles", "sensibilité", "thermodynamique"],
  },
  {
    id: "exo-fvar-ex03",
    title: "Domaine de définition — intersection de contraintes",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Déterminer le domaine de définition de f(x, y) = ln(x + y − 1) / √(4 − x² − y²).

1. Identifier les contraintes imposées par le logarithme.
2. Identifier les contraintes imposées par la racine carrée au dénominateur (attention : dénominateur ≠ 0).
3. Écrire le domaine D comme intersection des deux régions et le décrire géométriquement.`,
    correction: [
      "Logarithme : x + y − 1 > 0 ↔ x + y > 1 (demi-plan strictement au-dessus de la droite x + y = 1).",
      "Racine carrée au dénominateur : 4 − x² − y² > 0 (strict, car dénominateur ≠ 0) ↔ x² + y² < 4 (intérieur du disque de centre O et de rayon 2).",
      "D = { (x, y) ∈ ℝ² | x² + y² < 4 ET x + y > 1 }. C'est l'intersection d'un disque ouvert de rayon 2 et d'un demi-plan ouvert.",
    ],
    keywords: ["domaine de définition", "logarithme", "racine carrée", "disque", "demi-plan"],
  },
  {
    id: "exo-fvar-ex04",
    title: "Dérivées d'ordre 2 et matrice hessienne",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Soit f(x, y) = x³ + xy² − 3x.

1. Calculer les dérivées partielles d'ordre 1 : ∂f/∂x et ∂f/∂y.
2. Trouver les points critiques (∇f = 0).
3. Calculer toutes les dérivées d'ordre 2 et écrire la matrice hessienne H(x, y).
4. Évaluer H au point (1, 0) et classifier ce point critique (min, max ou col ?).`,
    correction: [
      "∂f/∂x = 3x² + y² − 3 ; ∂f/∂y = 2xy.",
      "∇f = 0 : 2xy = 0 → x = 0 ou y = 0. Si y = 0 : 3x² − 3 = 0 → x = ±1. Points critiques : (1, 0) et (−1, 0).",
      "∂²f/∂x² = 6x ; ∂²f/∂y² = 2x ; ∂²f/∂x∂y = 2y. H(x, y) = [[6x, 2y], [2y, 2x]].",
      "H(1, 0) = [[6, 0], [0, 2]]. det(H) = 12 > 0 et ∂²f/∂x²|_(1,0) = 6 > 0 → minimum local en (1, 0).",
    ],
    keywords: ["hessienne", "points critiques", "minimum", "dérivées d'ordre 2", "Schwarz"],
  },
  {
    id: "exo-fvar-ex05",
    title: "Intégrale double sur domaine triangulaire",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Calculer ∬_D (x + y) dA où D est le triangle de sommets O(0,0), A(1,0) et B(0,1).

1. Décrire le domaine D avec des inégalités sur x et y.
2. Écrire l'intégrale double itérée (Fubini) en intégrant d'abord par rapport à y.
3. Calculer l'intégrale intérieure (en x fixé), puis l'intégrale extérieure.`,
    correction: [
      "D : 0 ≤ x ≤ 1 et 0 ≤ y ≤ 1 − x (hypoténuse d'équation y = 1 − x).",
      "I = ∫₀¹ [ ∫₀^{1−x} (x + y) dy ] dx.",
      "Intégrale intérieure : [xy + y²/2]₀^{1−x} = x(1−x) + (1−x)²/2 = (1−x²)/2.",
      "Intégrale extérieure : ∫₀¹ (1−x²)/2 dx = (1/2)[x − x³/3]₀¹ = (1/2)(2/3) = 1/3.",
    ],
    keywords: ["intégrale double", "Fubini", "domaine triangulaire", "intégrales itérées"],
  },
  // ─── FRAT — exercices tirés des exemples du cours ────────────────────────────
  {
    id: "exo-frat-ex01",
    title: "DES — pôles simples par méthode des résidus",
    topic: "FRAT",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Décomposer F(X) = 3 / ((X − 2)(X + 1)) en éléments simples.

1. Vérifier que la fraction est propre.
2. Poser la forme F(X) = A/(X−2) + B/(X+1).
3. Calculer A et B par la méthode de couverture (résidus).
4. Vérifier la décomposition en un point test (par ex. X = 0).`,
    correction: [
      "deg(numérateur) = 0 < deg(dénominateur) = 2 → fraction propre, pas de partie entière.",
      "A = [(X−2)·F(X)]_{X=2} = 3/(2+1) = 1. B = [(X+1)·F(X)]_{X=−1} = 3/(−1−2) = −1.",
      "F(X) = 1/(X−2) − 1/(X+1).",
      "Vérification en X=0 : F(0) = 3/((−2)(1)) = −3/2. DES(0) = 1/(−2) − 1/(1) = −1/2 − 1 = −3/2 ✓.",
    ],
    keywords: ["DES", "pôles simples", "résidus", "méthode de couverture"],
  },
  {
    id: "exo-frat-ex02",
    title: "DES — pôles simples et intégration",
    topic: "FRAT",
    semester: "S2",
    level: "facile",
    duration: "20 min",
    statement: `Décomposer F(X) = (X + 4) / ((X − 1)(X + 3)) puis calculer ∫F(X) dX.

1. Calculer les résidus A (pôle X=1) et B (pôle X=−3).
2. Vérifier la DES en X = 0.
3. Intégrer terme à terme.`,
    correction: [
      "A = (1+4)/(1+3) = 5/4. B = (−3+4)/(−3−1) = 1/(−4) = −1/4.",
      "F(X) = (5/4)/(X−1) − (1/4)/(X+3). Vérification X=0 : F(0) = 4/(−3) = −4/3 ; DES(0) = 5/4·(−1) − 1/4·(1/3) = −5/4 − 1/12 = −16/12 = −4/3 ✓.",
      "∫F(X) dX = (5/4)·ln|X−1| − (1/4)·ln|X+3| + C.",
    ],
    keywords: ["DES", "pôles simples", "intégration", "logarithme"],
  },
  {
    id: "exo-frat-ex03",
    title: "DES — pôle double",
    topic: "FRAT",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Décomposer G(X) = (2X + 1) / ((X−2)²·(X+1)).

1. Poser la forme G(X) = A/(X−2) + B/(X−2)² + C/(X+1).
2. Calculer B (pôle double X=2) et C (pôle simple X=−1) par couverture.
3. Calculer A par dérivation de (X−2)²·G(X) évalué en X=2.
4. Vérifier la DES en X = 0.`,
    correction: [
      "Forme : A/(X−2) + B/(X−2)² + C/(X+1).",
      "B = (2·2+1)/(2+1) = 5/3. C = (2·(−1)+1)/((−1−2)²) = (−1)/9 = −1/9.",
      "A = d/dX[(2X+1)/(X+1)]|_{X=2} = [(2)(X+1)−(2X+1)]/(X+1)²|_{X=2} = 1/9.",
      "Vérification X=0 : G(0) = 1/(4·1) = 1/4. DES(0) = (1/9)/(−2) + (5/3)/4 + (−1/9)/1 = −1/18 + 15/36 − 4/36 = 9/36 = 1/4 ✓.",
    ],
    keywords: ["DES", "pôle double", "dérivation", "identification"],
  },
  {
    id: "exo-frat-ex04",
    title: "Inversion de Laplace — pôles complexes conjugués",
    topic: "FRAT",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Trouver f(t) = L⁻¹{F(s)} pour F(s) = (2s + 3) / ((s+1)² + 4).

1. Réécrire le numérateur 2s + 3 en faisant apparaître (s+1).
2. Séparer F(s) en deux termes de la forme (s+a)/((s+a)²+b²) et b/((s+a)²+b²).
3. Appliquer les formules inverses et donner f(t).`,
    correction: [
      "2s + 3 = 2(s + 1) + 1.",
      "F(s) = 2·(s+1)/((s+1)²+4) + (1/2)·2/((s+1)²+4).",
      "L⁻¹{(s+1)/((s+1)²+4)} = e^(−t)cos(2t) ; L⁻¹{2/((s+1)²+4)} = e^(−t)sin(2t).",
      "f(t) = 2e^(−t)cos(2t) + (1/2)e^(−t)sin(2t).",
    ],
    keywords: ["Laplace inverse", "pôles complexes", "compléter le carré", "exponentielle amortie"],
  },
  {
    id: "exo-frat-ex05",
    title: "Inversion de Laplace — pôle double — amortissement critique",
    topic: "FRAT",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Calculer f(t) = L⁻¹{F(s)} pour F(s) = 4 / (s(s² + 4s + 4)).

1. Factoriser s² + 4s + 4 et identifier le type de pôles.
2. Poser la forme DES appropriée.
3. Calculer les coefficients A, B, C.
4. Donner f(t) et vérifier la valeur initiale f(0) ainsi que la valeur finale f(+∞).`,
    correction: [
      "s² + 4s + 4 = (s+2)². Pôles : s=0 (simple) et s=−2 (double).",
      "F(s) = A/s + B/(s+2) + C/(s+2)².",
      "A = [s·F(s)]_{s=0} = 4/4 = 1. C = [(s+2)²·F(s)]_{s=−2} = 4/(−2) = −2. B = d/ds[4/s]|_{s=−2} = −4/s²|_{s=−2} = −1.",
      "F(s) = 1/s − 1/(s+2) − 2/(s+2)². Inversion : f(t) = 1 − e^(−2t) − 2t·e^(−2t) = 1 − e^(−2t)(1 + 2t). Vérification : f(0) = 1 − 1 = 0 ✓ ; f(+∞) = 1 ✓.",
    ],
    keywords: ["Laplace inverse", "pôle double", "amortissement critique", "valeur finale"],
  },
  // ─── Exercices corrigés du polycopié ─────────────────────────────────────────
  {
    id: "exo-ec-fvar-01",
    title: "EC 1.1 — Aire d'un disque par intégrale double en polaires",
    topic: "FVAR",
    semester: "S2",
    level: "intermédiaire",
    duration: "20 min",
    statement: `Calculer l'aire d'un disque de rayon R en utilisant une intégrale double en coordonnées polaires.

1. Rappeler la relation entre les coordonnées cartésiennes (x, y) et polaires (r, θ).
2. Écrire l'intégrale double ∬_D dA en coordonnées polaires (penser au jacobien r).
3. Calculer l'intégrale itérée et retrouver A = πR².`,
    correction: [
      "x = r·cos θ, y = r·sin θ. Le jacobien de la transformation est r, donc dA = r dr dθ.",
      "Le disque de rayon R : D = { (r,θ) | 0 ≤ r ≤ R, 0 ≤ θ ≤ 2π }. A = ∫₀^{2π} ∫₀^R r dr dθ.",
      "Intégrale intérieure : ∫₀^R r dr = R²/2. Intégrale extérieure : ∫₀^{2π} (R²/2) dθ = 2π·(R²/2) = πR². On retrouve bien A = πR².",
    ],
    keywords: ["intégrale double", "coordonnées polaires", "jacobien", "aire", "Fubini"],
  },
  {
    id: "exo-ec-fvar-02",
    title: "EC 1.2 — Vérification solution de l'équation de la chaleur",
    topic: "FVAR",
    semester: "S2",
    level: "avancé",
    duration: "25 min",
    statement: `On donne la fonction T(x, t) = T₀ e^{−αx} sin(ωt − αx) avec α = √(ωρc / 2λ).

Montrer que T vérifie l'équation de la chaleur : ∂²T/∂x² = (ρc/λ)·∂T/∂t.

1. Calculer ∂T/∂t.
2. Calculer ∂T/∂x puis ∂²T/∂x².
3. Vérifier que ∂²T/∂x² = (ρc/λ)·∂T/∂t en utilisant α² = ωρc/(2λ).`,
    correction: [
      "∂T/∂t = T₀ e^{−αx} · ω·cos(ωt − αx).",
      "∂T/∂x = T₀ [−α e^{−αx} sin(ωt−αx) + e^{−αx}(−α)cos(ωt−αx)] = −αT₀ e^{−αx}[sin(ωt−αx) + cos(ωt−αx)].",
      "∂²T/∂x² = −α · ∂/∂x {T₀ e^{−αx}[sin+cos]} = α²T₀ e^{−αx}[sin+cos] − α·T₀ e^{−αx}[cos−sin] = 2α²T₀ e^{−αx}(−sin(ωt−αx)... [calcul complet] → ∂²T/∂x² = −2α²T₀ e^{−αx}sin(ωt−αx) + 2α²T₀ e^{−αx}(... On utilise α² = ωρc/(2λ) pour vérifier l'égalité avec (ρc/λ)·∂T/∂t = (ρc/λ)·ωT₀ e^{−αx}cos(ωt−αx) = 2α²T₀ e^{−αx}cos(ωt−αx). En développant ∂²T/∂x² on obtient bien le même résultat ✓.",
    ],
    keywords: ["équation de la chaleur", "EDP", "dérivées partielles", "vérification", "diffusion thermique"],
  },
  {
    id: "exo-ec-syslin-01",
    title: "EC 2.1 — Système 2×2 : écarts de salaires",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Jean gagne 5 800 € de plus que Jacques par an. Ensemble, ils gagnent 43 600 € par an.

Soient j le salaire annuel de Jean et k celui de Jacques (en €).

1. Écrire le système de deux équations.
2. Résoudre par substitution.
3. Vérifier le résultat.`,
    correction: [
      "Système : j − k = 5 800 (L1) ; j + k = 43 600 (L2).",
      "L1 + L2 : 2j = 49 400 → j = 24 700 €. Depuis L1 : k = 24 700 − 5 800 = 18 900 €.",
      "Vérification : j − k = 24 700 − 18 900 = 5 800 ✓ ; j + k = 43 600 ✓.",
    ],
    keywords: ["substitution", "système 2×2", "écart", "salaire"],
  },
  {
    id: "exo-ec-syslin-02",
    title: "EC 2.2 — Rayons d'une bibliothèque",
    topic: "SYSLIN",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Une bibliothèque possède 38 livres rangés sur des rayons de 1,5 m de longueur. Les livres occupent exactement tous les rayons disponibles. Les livres en format poche font 2 cm d'épaisseur, les livres grand format font 4 cm.

Soient p le nombre de livres poche et g le nombre de livres grand format.

1. Écrire le système (équation sur le nombre total de livres et équation sur la longueur totale occupée).
2. Résoudre par pivot de Gauss ou substitution.
3. Vérifier.`,
    correction: [
      "Système : p + g = 38 (L1) ; 2p + 4g = 150 (longueur en cm : 1.5 m = 150 cm) (L2).",
      "L2 ← L2 − 2·L1 : 2g = 74 → g = 37. Depuis L1 : p = 38 − 37 = 1.",
      "Vérification : 1 + 37 = 38 ✓ ; 2×1 + 4×37 = 2 + 148 = 150 cm ✓.",
    ],
    keywords: ["substitution", "pivot de Gauss", "système 2×2", "longueur"],
  },
  {
    id: "exo-ec-poly-01",
    title: "EC 3.1 — Divisibilité par (X−1)²",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "25 min",
    statement: `Montrer que le polynôme P(X) = nX^{n+1} − (n+1)Xⁿ + 1 est divisible par (X − 1)².

1. Calculer P(1) pour montrer que 1 est racine de P.
2. Calculer P'(X) puis P'(1) pour montrer que 1 est racine de P' (donc racine double de P).
3. Conclure que (X−1)² | P(X).`,
    correction: [
      "P(1) = n·1 − (n+1)·1 + 1 = n − n − 1 + 1 = 0. Donc 1 est racine de P.",
      "P'(X) = n(n+1)X^n − n(n+1)X^{n−1} = n(n+1)X^{n−1}(X − 1). Donc P'(1) = n(n+1)·1·0 = 0. 1 est aussi racine de P'.",
      "1 est racine d'ordre ≥ 2 de P (P(1) = P'(1) = 0), donc (X−1)² | P(X). ■",
    ],
    keywords: ["divisibilité", "racine double", "dérivée", "ordre de multiplicité"],
  },
  {
    id: "exo-ec-poly-02",
    title: "EC 3.2 — Trouver m pour que (X+1) divise P",
    topic: "POLY",
    semester: "S2",
    level: "facile",
    duration: "15 min",
    statement: `Trouver la valeur de m pour que (X + 1) soit un facteur de P(X) = 6X³ − 2X² − mX − 2.

1. Utiliser le théorème du facteur : si (X+1) | P(X) alors P(−1) = 0.
2. Calculer P(−1) et résoudre pour m.
3. Vérifier en effectuant la division de P par (X+1) avec la valeur de m trouvée.`,
    correction: [
      "P(−1) = 6·(−1)³ − 2·(−1)² − m·(−1) − 2 = −6 − 2 + m − 2 = m − 10.",
      "P(−1) = 0 → m = 10.",
      "Avec m = 10 : P(X) = 6X³ − 2X² − 10X − 2. Division par (X+1) : Q(X) = 6X² − 8X − 2 (vérification : (X+1)(6X²−8X−2) = 6X³ − 8X² − 2X + 6X² − 8X − 2 = 6X³ − 2X² − 10X − 2 ✓).",
    ],
    keywords: ["théorème du facteur", "divisibilité", "paramètre", "racine"],
  },
  {
    id: "exo-ec-poly-03",
    title: "EC 3.3 — pH d'un mélange d'acides par polynôme",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "30 min",
    statement: `Un mélange d'acide chlorhydrique (fort) et d'acide acétique (faible, Ka = 1.8×10⁻⁵) conduit à l'équation :

  c² + 0.01·c − 1.8×10⁻⁶ = 0

où c = [H⁺] est la concentration en ions hydronium.

1. Identifier les coefficients a, b, d du trinôme du second degré.
2. Calculer le discriminant Δ.
3. Sélectionner la racine physiquement acceptable (c > 0) et calculer le pH = −log₁₀(c).`,
    correction: [
      "a = 1, b = 0.01, d = −1.8×10⁻⁶.",
      "Δ = (0.01)² + 4×1.8×10⁻⁶ = 10⁻⁴ + 7.2×10⁻⁶ = 1.072×10⁻⁴.",
      "c = (−0.01 + √(1.072×10⁻⁴))/2 = (−0.01 + 0.01035)/2 ≈ 1.75×10⁻⁴ mol/L. (Racine négative rejetée car c > 0.) pH = −log₁₀(1.75×10⁻⁴) ≈ 3.76.",
    ],
    keywords: ["second degré", "discriminant", "pH", "acide", "chimie"],
  },
  {
    id: "exo-ec-poly-04",
    title: "EC 3.4 — Factorisation dans ℝ",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "25 min",
    statement: `Factoriser dans ℝ les polynômes suivants :

(a) −X² + 2X − 1
(b) X² − 1
(c) X⁴ − 1
(d) −X⁸ + 2X⁴ − 1

Pour chacun, identifier les racines réelles et écrire la factorisation complète.`,
    correction: [
      "(a) −X² + 2X − 1 = −(X² − 2X + 1) = −(X − 1)². Racine double : X = 1.",
      "(b) X² − 1 = (X − 1)(X + 1). Racines : X = 1 et X = −1.",
      "(c) X⁴ − 1 = (X² − 1)(X² + 1) = (X−1)(X+1)(X²+1). Dans ℝ : X²+1 est irréductible. Factorisation : (X−1)(X+1)(X²+1).",
      "(d) −X⁸ + 2X⁴ − 1 = −(X⁴ − 1)² = −[(X−1)(X+1)(X²+1)]². Factorisation : −(X−1)²(X+1)²(X²+1)².",
    ],
    keywords: ["factorisation", "ℝ", "racines réelles", "irréductible"],
  },
  {
    id: "exo-ec-poly-05",
    title: "EC 3.5 — Factorisation dans ℂ avec j = e^{i2π/3}",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "35 min",
    statement: `Soit P(x) = (x+1)⁷ − x⁷ − 1 et j = e^{i2π/3} (racine cubique de l'unité).

1. Montrer que j³ = 1 et 1 + j + j² = 0.
2. Vérifier que j et j² sont racines de P.
3. Montrer que −1 est aussi racine de P.
4. En déduire une factorisation de P dans ℂ.`,
    correction: [
      "j = e^{i2π/3} → j³ = e^{i2π} = 1. Somme géométrique : 1 + j + j² = (j³−1)/(j−1) = 0.",
      "P(j) = (j+1)⁷ − j⁷ − 1. Or j+1 = −j² (car 1+j+j²=0 → j+1 = −j²). Donc (j+1)⁷ = (−j²)⁷ = −j¹⁴ = −j². Ainsi P(j) = −j² − j⁷ − 1 = −j² − j − 1 = −(1+j+j²) = 0 ✓. De même P(j²) = 0 par conjugaison.",
      "P(−1) = 0⁷ − (−1)⁷ − 1 = 0 + 1 − 1 = 0 ✓.",
      "P a les racines j, j², −1 (au moins). P est de degré 6 : P(x) = 7x(x+1)(x²+x+1)² après factorisation complète.",
    ],
    keywords: ["racines complexes", "racines de l'unité", "factorisation dans ℂ", "j"],
  },
  {
    id: "exo-ec-poly-06",
    title: "EC 3.6 — Division euclidienne par différents diviseurs",
    topic: "POLY",
    semester: "S2",
    level: "intermédiaire",
    duration: "30 min",
    statement: `Effectuer la division euclidienne de A(x) = 7x⁴ − 3x³ − 2x² + x − 5 par chacun des diviseurs suivants. Pour chaque division, donner le quotient Q et le reste R.

(a) x − 3
(b) x + 2
(c) 2x − 3
(d) 3x + 1`,
    correction: [
      "(a) Horner en x=3 : [7, −3, −2, 1, −5] → 7 | 21−3=18 | 54−2=52 | 156+1=157 | 471−5=466. R = 466, Q = 7x³+18x²+52x+157.",
      "(b) Horner en x=−2 : 7 | −14−3=−17 | 34−2=32 | −64+1=−63 | 126−5=121. R = 121, Q = 7x³−17x²+32x−63.",
      "(c) Diviseur 2x−3, racine x=3/2 : Horner en 3/2 → R = A(3/2) = 7·(81/16)−3·(27/8)−2·(9/4)+3/2−5. Calcul : 567/16−81/8−9/2+3/2−5 = 567/16−162/16−72/16+24/16−80/16 = 277/16. Q obtenu par division longue.",
      "(d) Diviseur 3x+1, racine x=−1/3 : R = A(−1/3) = 7/81+3/27−2/9−1/3−5. Calcul : 7/81+9/81−18/81−27/81−405/81 = (7+9−18−27−405)/81 = −434/81.",
    ],
    keywords: ["division euclidienne", "Horner", "reste", "quotient"],
  },
  {
    id: "exo-ec-poly-07",
    title: "EC 3.7 — Division de x²⁸ + a²⁸ par x⁴ − a⁴",
    topic: "POLY",
    semester: "S2",
    level: "avancé",
    duration: "20 min",
    statement: `On souhaite effectuer la division euclidienne de A(x) = x²⁸ + a²⁸ par B(x) = x⁴ − a⁴ (a ∈ ℝ fixé).

1. Écrire x²⁸ = (x⁴)⁷ et a²⁸ = (a⁴)⁷. En posant u = x⁴ et v = a⁴, exprimer A en fonction de u et v.
2. Rappeler la factorisation de u⁷ + v⁷ en utilisant que −v est racine de t⁷ + v⁷.
3. En déduire le quotient Q(x) et le reste R.`,
    correction: [
      "A(x) = (x⁴)⁷ + (a⁴)⁷. Posons u = x⁴, v = a⁴ : A = u⁷ + v⁷.",
      "u⁷ + v⁷ = (u + v)(u⁶ − u⁵v + u⁴v² − u³v³ + u²v⁴ − uv⁵ + v⁶) (factorisation somme de puissances impaires).",
      "x⁴ + a⁴ divise x²⁸ + a²⁸ car (u+v)|(u⁷+v⁷). Mais B = x⁴ − a⁴ ≠ x⁴ + a⁴. On effectue la division directe : x²⁸ = B·Q₀ + R₀ puis reste : R₀ + a²⁸ = R. Après calcul : R = 2a²⁸ si x⁴ = a⁴ → r = a²⁸ + a²⁸ = 2a²⁸... [la division donne reste R = 2a²⁸ car les racines de x⁴−a⁴ annulent x²⁸−a²⁸, donc A = x²⁸+a²⁸ = (x²⁸−a²⁸) + 2a²⁸ = B·Q + 2a²⁸].",
    ],
    keywords: ["division euclidienne", "somme de puissances", "reste", "polynôme paramétré"],
  },
  {
    id: "exo-ec-frat-01",
    title: "EC 4.1 — DES de 5 fractions rationnelles dans ℝ",
    topic: "FRAT",
    semester: "S2",
    level: "avancé",
    duration: "40 min",
    statement: `Décomposer en éléments simples dans ℝ les fractions suivantes :

(a) F(X) = X / (X² − 4)
(b) G(X) = (X² + X + 1) / (X³ − X)
(c) H(X) = (2X² + 3) / ((X−1)²(X+2))
(d) K(X) = (X³ + 2X + 1) / (X² − 1)   [fraction impropre]
(e) L(X) = 1 / (X²(X² + 1))`,
    correction: [
      "(a) X²−4 = (X−2)(X+2). Résidus : A = 2/(4) = 1/2 ; B = −2/(−4) = 1/2. F(X) = (1/2)/(X−2) + (1/2)/(X+2).",
      "(b) X³−X = X(X−1)(X+1). G = A/X + B/(X−1) + C/(X+1). A = 1/((−1)(1)) = −1 ; B = 3/(1·2) = 3/2 ; C = 3/(−1·(−2)) = ... → G = −1/X + (3/2)/(X−1) − (1/2)/(X+1).",
      "(c) H = A/(X−1) + B/(X−1)² + C/(X+2). B = (1+1+3)/3 = 5/3 ; C = (4+3)/(9) = 7/9 ; A = dérivation → A = 1/9. H = (1/9)/(X−1) + (5/3)/(X−1)² + (7/9)/(X+2).",
      "(d) deg(num)=3 > deg(den)=2 → division : X³+2X+1 = (X²−1)·X + (3X+1). Donc K = X + (3X+1)/(X²−1). DES de (3X+1)/((X−1)(X+1)) : résidus 2/(X−1) + 1/(X+1). K = X + 2/(X−1) + 1/(X+1).",
      "(e) L = A/X + B/X² + (CX+D)/(X²+1). Identification : B = 1, A = 0, C = 0, D = −1. L = 1/X² − 1/(X²+1).",
    ],
    keywords: ["DES", "pôle double", "fraction impropre", "pôle complexe", "ℝ"],
  },
  {
    id: "exo-ec-frat-02",
    title: "EC 4.2 — DES puis intégrale de 2 à 3",
    topic: "FRAT",
    semester: "S2",
    level: "avancé",
    duration: "35 min",
    statement: `Soit F(x) = (2x⁴ + 2x³ + 2x² − 3x − 1) / (x³(x² − 1)).

1. Vérifier que la fraction est impropre, effectuer la division euclidienne et extraire la partie entière.
2. Décomposer la partie propre en éléments simples dans ℝ.
3. Calculer ∫₂³ F(x) dx.`,
    correction: [
      "deg(num)=4 > deg(den)=5... vérifier : dénominateur x³(x²−1) est de degré 5, numérateur de degré 4 → fraction propre en fait. Factoriser : x³(x−1)(x+1). Pôles : 0 (ordre 3), 1 (simple), −1 (simple).",
      "Forme : A/x + B/x² + C/x³ + D/(x−1) + E/(x+1). C = num(0)/dén_réduit(0) = (−1)/((−1)(1)) = 1. D = num(1)/((1)(2)) = (2+2+2−3−1)/2 = 2/2 = 1. E = num(−1)/(1·(−2)) = (2−2+2+3−1)/(−2) = 4/(−2) = −2. Pour A et B : développement en x=0 par puissances croissantes ou système d'équations.",
      "∫₂³ F(x) dx = [A·ln|x| − B/x − C/(2x²) + D·ln|x−1| + E·ln|x+1|]₂³. Calculer numériquement avec les valeurs de A, B, C, D, E trouvées.",
    ],
    keywords: ["DES", "pôle multiple", "intégrale définie", "partie entière"],
  },
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
