// Normalized item consumed by the generic EntitySelect component.
export interface EntitySelectItem {
  value: number
  label: string
  /** extra text to match against when searching (e.g. member names) */
  search?: string
  /** marks an item that should sort above the rest (e.g. your own team) */
  preferred?: boolean
  /** badge text shown for a preferred item */
  preferredLabel?: string
}
