import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cityService } from '../services/cityService'
import type { CityCreateInput, CityUpdateInput } from '../services/cityService'

// Les villes changent rarement (CRUD admin ponctuel) : staleTime plus long
// que le défaut global pour éviter des refetchs inutiles en navigant.
const CITIES_STALE_TIME = 5 * 60_000

export const cityKeys = {
  all: ['cities'] as const,
  list: () => [...cityKeys.all, 'list'] as const,
  active: () => [...cityKeys.all, 'active'] as const,
  availableForRegistration: () => [...cityKeys.all, 'available-for-registration'] as const,
}

export function useCities() {
  return useQuery({
    queryKey: cityKeys.list(),
    queryFn: cityService.getAll,
    staleTime: CITIES_STALE_TIME,
  })
}

export function useActiveCities() {
  return useQuery({
    queryKey: cityKeys.active(),
    queryFn: cityService.getActive,
    staleTime: CITIES_STALE_TIME,
  })
}

export function useAvailableCitiesForRegistration() {
  return useQuery({
    queryKey: cityKeys.availableForRegistration(),
    queryFn: cityService.getAvailableForRegistration,
    staleTime: CITIES_STALE_TIME,
  })
}

export function useCreateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CityCreateInput) => cityService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}

export function useUpdateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CityUpdateInput }) => cityService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}

export function useActivateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cityService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}

export function useDeactivateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cityService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}
