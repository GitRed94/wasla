import {
  Wrench, Zap, Snowflake, Refrigerator, Construction, Grid3x3, Home,
  Paintbrush, PaintBucket, Hammer, DoorOpen, KeyRound, SquareStack,
  Camera, ShieldAlert, Plug, Sun, Laptop, Smartphone,
} from 'lucide-react'

export const CATEGORIES = [
  { key: 'plombier',             emoji: '🔧', icon: Wrench,        cluster: 'plomberie' },
  { key: 'electricien',          emoji: '⚡', icon: Zap,           cluster: 'electricite' },
  { key: 'climaticien',          emoji: '❄️', icon: Snowflake,     cluster: 'froid' },
  { key: 'frigoriste',           emoji: '🧊', icon: Refrigerator,  cluster: 'froid' },
  { key: 'macon',                emoji: '🧱', icon: Construction,  cluster: 'gros_oeuvre' },
  { key: 'carreleur',            emoji: '🪨', icon: Grid3x3,       cluster: 'gros_oeuvre' },
  { key: 'etancheur',            emoji: '🏚️', icon: Home,         cluster: 'gros_oeuvre' },
  { key: 'peintre',              emoji: '🖌️', icon: Paintbrush,   cluster: 'finitions' },
  { key: 'platrier',             emoji: '🏗️', icon: PaintBucket,  cluster: 'finitions' },
  { key: 'menuisier',            emoji: '🪵', icon: Hammer,        cluster: 'finitions' },
  { key: 'menuisier_alu',        emoji: '🪟', icon: DoorOpen,      cluster: 'finitions' },
  { key: 'serrurier',            emoji: '🔑', icon: KeyRound,      cluster: 'finitions' },
  { key: 'vitrier',              emoji: '🔲', icon: SquareStack,   cluster: 'finitions' },
  { key: 'cameras',              emoji: '📷', icon: Camera,        cluster: 'securite' },
  { key: 'alarmes',              emoji: '🚨', icon: ShieldAlert,   cluster: 'securite' },
  { key: 'electromenager',       emoji: '🔌', icon: Plug,          cluster: 'equipements' },
  { key: 'panneaux_solaires',    emoji: '☀️', icon: Sun,          cluster: 'equipements' },
  { key: 'informaticien',        emoji: '💻', icon: Laptop,        cluster: 'informatique' },
  { key: 'reparation_telephone', emoji: '📱', icon: Smartphone,    cluster: 'informatique' },
]

export const CATEGORY_CLUSTERS = [
  { key: 'plomberie',    label: 'Plomberie' },
  { key: 'electricite',  label: 'Électricité' },
  { key: 'froid',        label: 'Climatisation & Froid' },
  { key: 'gros_oeuvre',  label: 'Gros œuvre' },
  { key: 'finitions',    label: 'Finitions' },
  { key: 'securite',     label: 'Sécurité électronique' },
  { key: 'equipements',  label: 'Équipements' },
  { key: 'informatique', label: 'Informatique' },
]

// Pairs that trigger a warning (no blocking) — "these skills are very different"
export const INCOMPATIBLE_PAIRS = [
  ['informaticien',        'plombier'],
  ['informaticien',        'macon'],
  ['informaticien',        'carreleur'],
  ['informaticien',        'peintre'],
  ['informaticien',        'platrier'],
  ['informaticien',        'menuisier'],
  ['informaticien',        'menuisier_alu'],
  ['informaticien',        'serrurier'],
  ['informaticien',        'vitrier'],
  ['informaticien',        'etancheur'],
  ['informaticien',        'electromenager'],
  ['reparation_telephone', 'plombier'],
  ['reparation_telephone', 'macon'],
  ['reparation_telephone', 'carreleur'],
  ['reparation_telephone', 'peintre'],
  ['reparation_telephone', 'platrier'],
  ['reparation_telephone', 'menuisier'],
  ['reparation_telephone', 'menuisier_alu'],
  ['reparation_telephone', 'serrurier'],
  ['reparation_telephone', 'vitrier'],
  ['reparation_telephone', 'etancheur'],
  ['reparation_telephone', 'electromenager'],
]
