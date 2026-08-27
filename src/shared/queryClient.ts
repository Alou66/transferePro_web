import { QueryClient } from '@tanstack/react-query'

// Défaut à 1 minute : raisonnable pour la plupart des écrans (agents, tableaux
// de bord). Les données quasi statiques (villes) et les données très
// mouvantes (transferts, encaissements) surchargent ce défaut par requête.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
