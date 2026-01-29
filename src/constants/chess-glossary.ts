// Enum for all base chess terms - provides type safety and autocomplete
export const ChessTerm = {
  // Checkmate patterns
  BACK_RANK_MATE: "back-rank mate",
  SMOTHERED_MATE: "smothered mate",
  BODENS_MATE: "Boden's mate",
  ARABIAN_MATE: "Arabian mate",

  // Tactical concepts
  PIN: "pin",
  FORK: "fork",
  SKEWER: "skewer",
  SACRIFICE: "sacrifice",
  DECOY: "decoy",
  DEFLECTION: "deflection",
  ATTRACTION: "attraction",
  DISCOVERED_ATTACK: "discovered attack",
  DISCOVERED_CHECK: "discovered check",
  DOUBLE_ATTACK: "double attack",
  CLEARANCE: "clearance",

  // Positional concepts
  OUTPOST: "outpost",
  BLOCKADE: "blockade",
  CONTROL: "control",
  SPACE: "space",
  WEAKNESS: "weakness",
  PASSED_PAWN: "passed pawn",
  ISOLATED_PAWN: "isolated pawn",
  BACKWARD_PAWN: "backward pawn",
  PAWN_CHAIN: "pawn chain",
  ADVANCED_PAWN: "advanced pawn",
  DOUBLED_PAWN: "doubled pawn",

  // Piece concepts
  BISHOP_PAIR: "bishop pair",
  BATTERY: "battery",
  ACTIVE: "active",
  PASSIVE: "passive",

  // Game phases
  OPENING: "opening",
  MIDDLEGAME: "middlegame",
  ENDGAME: "endgame",
  DEVELOPMENT: "development",
  TEMPO: "tempo",

  // Evaluation
  ADVANTAGE: "advantage",
  INITIATIVE: "initiative",
  COMPENSATION: "compensation",
  ZUGZWANG: "zugzwang",

  // Other important terms
  FIANCHETTO: "fianchetto",
  COMBINATION: "combination",
  COORDINATION: "coordination",
  CENTRALIZATION: "centralization",
  EN_PASSANT: "en passant",
  CASTLING: "castling",
  PROMOTION: "promotion",
  CHECK: "check",
  CHECKMATE: "checkmate",
  TACTICS: "tactics",
  STRATEGY: "strategy",
  MATERIAL: "material",
  POSITION: "position",
  MOBILITY: "mobility",
  FILE: "file",
  RANK: "rank",
  DIAGONAL: "diagonal",
  CENTER: "center",
  WING: "wing",
  KINGSIDE: "kingside",
  QUEENSIDE: "queenside",
  PIECE: "piece",
  MINOR_PIECE: "minor piece",
  MAJOR_PIECE: "major piece",
  ATTACK: "attack",
  DEFENSE: "defense",
  COUNTERATTACK: "counterattack",
  THREAT: "threat",
  CONTROL_OF_THE_CENTER: "control of the center",
  WEAK_SQUARE: "weak square",
  STRONG_SQUARE: "strong square",
  OVERLOADED_PIECE: "overloaded piece",

  // Board areas
  BACK_RANK: "back rank",
};

export type ChessTerm = (typeof ChessTerm)[keyof typeof ChessTerm];

// Raw glossary with base terms only
export const CHESS_GLOSSARY_RAW: Record<ChessTerm, string> = {
  [ChessTerm.BACK_RANK_MATE]: "A checkmate delivered by a rook or queen along the back rank",
  [ChessTerm.SMOTHERED_MATE]: "A checkmate where the king is unable to move due to being surrounded by its own pieces",
  [ChessTerm.BODENS_MATE]: "Checkmate pattern where two bishops deliver crisscrossing checks",
  [ChessTerm.ARABIAN_MATE]: "Checkmate that occurs when knight and rook trap the king in a corner",

  [ChessTerm.PIN]: "A piece cannot legally move out of line of attack without exposing a more valuable piece",
  [ChessTerm.FORK]: "A knight attack that targets two or more pieces simultaneously",
  [ChessTerm.SKEWER]: "Similar to pin but attacks the more valuable piece first",
  [ChessTerm.SACRIFICE]: "Deliberately giving up material to gain other advantages",
  [ChessTerm.DECOY]: "Luring an enemy piece away from its defensive position",
  [ChessTerm.DEFLECTION]: "Luring an enemy piece away from a good square",
  [ChessTerm.ATTRACTION]: "Type of decoy involving sacrifice next to enemy king",
  [ChessTerm.DISCOVERED_ATTACK]: "Attack made when another piece moves out of its way",
  [ChessTerm.DISCOVERED_CHECK]: "Discovered attack to the king",
  [ChessTerm.DOUBLE_ATTACK]: "Two attacks made with one move",
  [ChessTerm.CLEARANCE]: "Removal of piece from a square so another may use it",

  [ChessTerm.OUTPOST]: "A square where a piece is hard to attack due to pawn structure",
  [ChessTerm.BLOCKADE]: "Obstructing enemy pawn advance with a piece",
  [ChessTerm.CONTROL]: "Guarding squares in a way that prevents opponent from using them",
  [ChessTerm.SPACE]: "Territory and mobility advantage",
  [ChessTerm.WEAKNESS]: "Vulnerability in one's position",
  [ChessTerm.PASSED_PAWN]: "Pawn with no opposing pawns to prevent its advance",
  [ChessTerm.ISOLATED_PAWN]: "Pawn without friendly pawns on adjacent files",
  [ChessTerm.BACKWARD_PAWN]: "Pawn behind friendly pawn on adjacent file, hard to advance",
  [ChessTerm.PAWN_CHAIN]: "Connected pawns supporting each other",
  [ChessTerm.ADVANCED_PAWN]: "Pawn on opponent's half of the board",
  [ChessTerm.DOUBLED_PAWN]: "Two pawns of same color on same file",

  [ChessTerm.BISHOP_PAIR]: "Having two bishops controlling both colors",
  [ChessTerm.BATTERY]: "Pieces aligned along a line of action",
  [ChessTerm.ACTIVE]: "Piece that threatens many squares or has good mobility",
  [ChessTerm.PASSIVE]: "Lacking mobility and threatening few squares",

  [ChessTerm.OPENING]: "Initial phase of the game focusing on development",
  [ChessTerm.MIDDLEGAME]: "Central phase of the game with tactical battles",
  [ChessTerm.ENDGAME]: "Final phase with few pieces remaining",
  [ChessTerm.DEVELOPMENT]: "Moving pieces from starting squares to active positions",
  [ChessTerm.TEMPO]: "Time advantage, right to move when important",

  [ChessTerm.ADVANTAGE]: "Better position with chance to win",
  [ChessTerm.INITIATIVE]: "Right to make threats and force opponent to react",
  [ChessTerm.COMPENSATION]: "What is gained for material loss",
  [ChessTerm.ZUGZWANG]: "Being forced to make a move that worsens position",

  [ChessTerm.FIANCHETTO]: "Developing bishop to b2/g2/b7/g7",
  [ChessTerm.COMBINATION]: "Sequence of moves involving sacrifices for advantage",
  [ChessTerm.COORDINATION]: "Multiple pieces working together",
  [ChessTerm.CENTRALIZATION]: "Moving pieces toward center of the board",
  [ChessTerm.EN_PASSANT]: "Special pawn capture rule when pawn advances two squares",
  [ChessTerm.CASTLING]: "Special king and rook move for safety and development",
  [ChessTerm.PROMOTION]: "Pawn reaching opposite side of the board becoming other piece",
  [ChessTerm.CHECK]: "Direct attack on the king",
  [ChessTerm.CHECKMATE]: "King in check with no legal moves",
  [ChessTerm.TACTICS]: "Short-term combinations and attacks",
  [ChessTerm.STRATEGY]: "Long-term planning and positional play",
  [ChessTerm.MATERIAL]: "Pieces and pawns captured",
  [ChessTerm.POSITION]: "Arrangement of pieces on the board",
  [ChessTerm.MOBILITY]: "Freedom of movement for pieces",
  [ChessTerm.FILE]: "Vertical column of squares on the board",
  [ChessTerm.RANK]: "Horizontal row of squares on the board",
  [ChessTerm.DIAGONAL]: "Line of squares of same color",
  [ChessTerm.CENTER]: "Central four squares of the board",
  [ChessTerm.WING]: "Side of the board (a, b, c files or f, g, h files)",
  [ChessTerm.KINGSIDE]: "Side of the board where king starts",
  [ChessTerm.QUEENSIDE]: "Side of the board where queen starts",
  [ChessTerm.PIECE]: "Chessman excluding pawns",
  [ChessTerm.MINOR_PIECE]: "Knight or bishop",
  [ChessTerm.MAJOR_PIECE]: "Rook or queen",
  [ChessTerm.ATTACK]: "Threatening to capture an enemy piece",
  [ChessTerm.DEFENSE]: "Protecting against opponent's threats",
  [ChessTerm.COUNTERATTACK]: "Attack in response to opponent's attack",
  [ChessTerm.THREAT]: "Potential capture or danger",
  [ChessTerm.CONTROL_OF_THE_CENTER]: "Having one or more pieces that attack center squares",
  [ChessTerm.WEAK_SQUARE]: "Hard to defend square",
  [ChessTerm.STRONG_SQUARE]: "Well-controlled square",
  [ChessTerm.OVERLOADED_PIECE]: "Piece with too many defensive responsibilities",
  [ChessTerm.BACK_RANK]: "The first or eighth rank where pieces start and where back-rank mates occur",
};

// Helper function to generate variations
function generateVariations(baseTerm: ChessTerm, definition: string): Record<string, string> {
  const baseTermStr = baseTerm as string;
  const variations: Record<string, string> = {};
  variations[baseTermStr] = definition;

  // Handle compound terms with hyphens
  if (baseTermStr.includes("-")) {
    variations[baseTermStr.replace(/-/g, " ")] = definition;
  }

  // Define irregular forms manually for precision
  const irregularMap: Partial<Record<ChessTerm, string[]>> = {
    [ChessTerm.PIN]: ["pins", "pinned", "pinning"],
    [ChessTerm.FORK]: ["forks", "forked", "forking"],
    [ChessTerm.SKEWER]: ["skewers", "skewered", "skewering"],
    [ChessTerm.SACRIFICE]: ["sacrifices", "sacrificed", "sacrificing"],
    [ChessTerm.DECOY]: ["decoys", "decoyed", "decoying"],
    [ChessTerm.DEFLECTION]: ["deflections", "deflected", "deflecting"],
    [ChessTerm.BLOCKADE]: ["blockades", "blockaded", "blockading"],
    [ChessTerm.CONTROL]: ["controls", "controlled", "controlling"],
    [ChessTerm.ATTACK]: ["attacks", "attacked", "attacking"],
    [ChessTerm.DEFENSE]: ["defenses", "defended", "defending"],
    [ChessTerm.COUNTERATTACK]: ["counterattacks", "counterattacked", "counterattacking"],
    [ChessTerm.THREAT]: ["threats", "threatened", "threatening"],
    [ChessTerm.CHECK]: ["checks", "checked", "checking"],
    [ChessTerm.CASTLING]: ["castle", "castles", "castled"],
    [ChessTerm.PROMOTION]: ["promotions", "promote", "promotes", "promoted", "promoting"],
    [ChessTerm.COMBINATION]: ["combinations", "combine", "combined", "combining"],
    [ChessTerm.STRATEGY]: ["strategies", "strategic"],
    [ChessTerm.TACTICS]: ["tactic", "tactical"],
    [ChessTerm.POSITION]: ["positions", "positioned", "positioning"],
    [ChessTerm.FILE]: ["files"],
    [ChessTerm.RANK]: ["ranks"],
    [ChessTerm.DIAGONAL]: ["diagonals"],
    [ChessTerm.WING]: ["wings"],
    [ChessTerm.PIECE]: ["pieces"],
    [ChessTerm.BATTERY]: ["batteries"],
    [ChessTerm.OUTPOST]: ["outposts"],
    [ChessTerm.WEAKNESS]: ["weaknesses"],
    [ChessTerm.ADVANTAGE]: ["advantages"],
    [ChessTerm.OPENING]: ["openings"],
    [ChessTerm.MIDDLEGAME]: ["middlegames"],
    [ChessTerm.ENDGAME]: ["endgames"],
    [ChessTerm.FIANCHETTO]: ["fianchettos", "fianchettoed"],
    [ChessTerm.CENTRALIZATION]: ["centralizations", "centralize", "centralizes", "centralized", "centralizing"],
    [ChessTerm.COORDINATION]: ["coordinate", "coordinates", "coordinated", "coordinating"],
    [ChessTerm.DEVELOPMENT]: ["develop", "develops", "developed", "developing"],
    [ChessTerm.PASSED_PAWN]: ["passed pawns"],
    [ChessTerm.ISOLATED_PAWN]: ["isolated pawns"],
    [ChessTerm.BACKWARD_PAWN]: ["backward pawns"],
    [ChessTerm.PAWN_CHAIN]: ["pawn chains"],
    [ChessTerm.ADVANCED_PAWN]: ["advanced pawns"],
    [ChessTerm.DOUBLED_PAWN]: ["doubled pawns"],
    [ChessTerm.MINOR_PIECE]: ["minor pieces"],
    [ChessTerm.MAJOR_PIECE]: ["major pieces"],
    [ChessTerm.WEAK_SQUARE]: ["weak squares"],
    [ChessTerm.STRONG_SQUARE]: ["strong squares"],
    [ChessTerm.BACK_RANK]: ["back ranks"],
  };

  if (irregularMap[baseTerm]) {
    irregularMap[baseTerm]!.forEach((variation) => {
      variations[variation] = definition;
    });
  }

  return variations;
}

// Generate the final glossary with all variations
function buildChessGlossary(): {
  glossary: Record<string, string>;
  variationToBaseTerm: Record<string, ChessTerm>;
} {
  const glossary: Record<string, string> = {};
  const variationToBaseTerm: Record<string, ChessTerm> = {};

  Object.entries(CHESS_GLOSSARY_RAW).forEach(([baseTerm, definition]) => {
    const variations = generateVariations(baseTerm as ChessTerm, definition);
    Object.assign(glossary, variations);

    // Map all variations back to the base term enum
    Object.keys(variations).forEach((variation) => {
      variationToBaseTerm[variation.toLowerCase()] = baseTerm as ChessTerm;
    });
  });

  return { glossary, variationToBaseTerm };
}

const { glossary, variationToBaseTerm } = buildChessGlossary();

export const CHESS_GLOSSARY = glossary;
export const VARIATION_TO_BASE_TERM = variationToBaseTerm;
