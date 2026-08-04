import {
  Wrench, Zap, Snowflake, Refrigerator, Construction, Grid3x3, Home,
  Paintbrush, PaintBucket, Hammer, DoorOpen, KeyRound, SquareStack,
  Camera, ShieldAlert, Plug, Sun, Laptop, Smartphone,
} from 'lucide-react'

export const CATEGORIES = [
  { key: 'plombier',             icon: Wrench,        cluster: 'plomberie' },
  { key: 'electricien',          icon: Zap,           cluster: 'electricite' },
  { key: 'climaticien',          icon: Snowflake,     cluster: 'froid' },
  { key: 'frigoriste',           icon: Refrigerator,  cluster: 'froid' },
  { key: 'macon',                icon: Construction,  cluster: 'gros_oeuvre' },
  { key: 'carreleur',            icon: Grid3x3,       cluster: 'gros_oeuvre' },
  { key: 'etancheur',            icon: Home,          cluster: 'gros_oeuvre' },
  { key: 'peintre',              icon: Paintbrush,    cluster: 'finitions' },
  { key: 'platrier',             icon: PaintBucket,   cluster: 'finitions' },
  { key: 'menuisier',            icon: Hammer,        cluster: 'finitions' },
  { key: 'menuisier_alu',        icon: DoorOpen,      cluster: 'finitions' },
  { key: 'serrurier',            icon: KeyRound,      cluster: 'finitions' },
  { key: 'vitrier',              icon: SquareStack,   cluster: 'finitions' },
  { key: 'cameras',              icon: Camera,        cluster: 'securite' },
  { key: 'alarmes',              icon: ShieldAlert,   cluster: 'securite' },
  { key: 'electromenager',       icon: Plug,          cluster: 'equipements' },
  { key: 'panneaux_solaires',    icon: Sun,           cluster: 'equipements' },
  { key: 'informaticien',        icon: Laptop,        cluster: 'informatique' },
  { key: 'reparation_telephone', icon: Smartphone,    cluster: 'informatique' },
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
