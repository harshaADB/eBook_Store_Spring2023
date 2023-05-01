import {CheckCircleIcon, MinusCircleIcon} from '@heroicons/react/24/solid'
import {cleanNotifications, showNotification} from '@mantine/notifications'
import {Media} from '@prisma/client'
import * as React from 'react'
import {useLocalStorageState} from '~/utils/hooks'
import {DateToString} from '~/utils/misc'

const LocalStorageKey = 'ebook-store-application'

export type CartItem = DateToString<Media>

interface ICartContext {
	itemsInCart: Array<CartItem>
	addItemToCart: (item: CartItem) => void
	removeItemFromCart: (itemId: CartItem['id']) => void
	clearCart: () => void
	totalRent: number
}

const CartContext = React.createContext<ICartContext | undefined>(undefined)

export function CartProvider({children}: {children: React.ReactNode}) {
	const [items, setItems] = useLocalStorageState<CartItem[]>({
		key: LocalStorageKey,
		defaultValue: [],
	})

	const totalRent = items.reduce((acc, item) => acc + item.rentPerDay, 0)

	const clearCart = React.useCallback(() => {
		cleanNotifications()
		setItems([])
		showNotification({
			title: 'Successfully cleared',
			message: 'All items in the cart are cleared',
			icon: <CheckCircleIcon className="h-7 w-7" />,
			color: 'green',
		})
	}, [setItems])

	const addItemToCart = React.useCallback(
		(item: CartItem) => {
			const isAlreadyInCart = items.some(i => i.id === item.id)

			cleanNotifications()

			if (!isAlreadyInCart) {
				setItems(prev => [
					...prev,
					{
						...item,
					},
				])

				return showNotification({
					title: 'Successfully added',
					message: `Added ${item.title} to cart`,
					color: 'green',
					icon: <CheckCircleIcon className="h-9 w-9" />,
				})
			}

			showNotification({
				title: 'Item already present in cart',
				message: `Please remove the item from cart to add again`,
				icon: <CheckCircleIcon className="h-7 w-7" />,
				color: 'green',
			})
		},
		[items, setItems]
	)

	const removeItemFromCart = (itemId: CartItem['id']) => {
		setItems(prev => prev.filter(item => item.id !== itemId))

		showNotification({
			title: 'Successfully removed',
			message: 'Item removed from cart',
			icon: <MinusCircleIcon className="h-7 w-7" />,
			color: 'red',
		})
	}

	return (
		<CartContext.Provider
			value={{
				itemsInCart: items,
				totalRent,
				addItemToCart,
				removeItemFromCart,
				clearCart,
			}}
		>
			{children}
		</CartContext.Provider>
	)
}

export function useCart() {
	const context = React.useContext(CartContext)
	if (!context) {
		throw new Error('`useCart()` must be used within a <CartProvider />')
	}

	return context
}
