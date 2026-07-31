import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { API_ROUTES } from '../config/apiRoutes'

export interface CurrencyOption {
  code: string
  name: string
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['catalogs', 'currencies'],
    queryFn: async () => (
      await apiClient.get<CurrencyOption[]>(API_ROUTES.catalogs.currencies)
    ).data,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function toCurrencySelectOptions(currencies: CurrencyOption[] = []) {
  return currencies.map((currency) => ({
    label: `${currency.code} — ${currency.name}`,
    value: currency.code,
  }))
}
