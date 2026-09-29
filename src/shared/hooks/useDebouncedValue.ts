import { useEffect, useState } from 'react'

/**
 * Retarde la propagation d'une valeur qui change souvent (saisie utilisateur).
 *
 * Utilisé pour les champs de recherche : sans cela, chaque frappe déclencherait
 * une requête serveur, donc un aller-retour réseau par caractère saisi.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)

    // Nettoyage à chaque nouvelle frappe : annule le minuteur précédent pour
    // ne déclencher qu'une fois, après la dernière.
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
