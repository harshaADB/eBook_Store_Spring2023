import {useMatches} from '@remix-run/react'
import * as React from 'react'
import type {RootLoaderData} from '~/root'
import type {DashboardLoaderData} from '~/routes/__dashboard'
import type {AdminLoaderData} from '~/routes/__dashboard/admin'
/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} routeId The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
	routeId: string
): Record<string, unknown> | undefined {
	const matchingRoutes = useMatches()

	const route = React.useMemo(
		() => matchingRoutes.find(route => route.id === routeId),
		[matchingRoutes, routeId]
	)
	return route?.data
}

export function useDashboardData() {
	return useMatchesData('routes/__dashboard') as DashboardLoaderData
}

export function useAdminData() {
	return useMatchesData('routes/__dashboard/admin') as AdminLoaderData
}

export function useOptionalUser() {
	return useMatchesData('root') as RootLoaderData
}

export function useUser() {
	const {user} = useOptionalUser()

	if (!user) {
		throw new Error('User is not logged in')
	}

	return {user}
}

type ReturnType<T> = [T, React.Dispatch<React.SetStateAction<T>>]
export function useLocalStorageState<T>({
	key,
	defaultValue,
}: {
	key: string
	defaultValue: T
}): ReturnType<T> {
	const [value, setValue] = React.useState<T>(defaultValue)

	React.useEffect(() => {
		const localStorageValue = window.localStorage.getItem(key)

		if (!localStorageValue) {
			setValue(defaultValue)
			return
		}

		setValue(JSON.parse(localStorageValue))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	React.useEffect(() => {
		window.localStorage.setItem(key, JSON.stringify(value))
	}, [key, value])

	return [value, setValue]
}
