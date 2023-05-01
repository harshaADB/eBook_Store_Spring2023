import {Button, Drawer, Input, Modal, NumberInput, Select} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {PaymentMethod, PaymentStatus, Role} from '@prisma/client'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Form,
	NavLink,
	Outlet,
	useFetcher,
	useLoaderData,
	useLocation,
} from '@remix-run/react'
import siteConfig from 'site.config'
import {getAllMedia} from '~/lib/media.server'
import {getPaymentsByUserId} from '~/lib/payment.server'
import {requireUser} from '~/lib/session.server'
import {clearDues, getAllTransaction} from '~/lib/transaction.server'
import {useCart} from '~/utils/CartContext'
import {useOptionalUser, useUser} from '~/utils/hooks'
import {formatCurrency} from '~/utils/misc'
import {cx, titleCase} from '~/utils/string'
import * as React from 'react'
import {DatePicker} from '@mantine/dates'
import ReactInputMask from 'react-input-mask'
import {TrashIcon} from '@heroicons/react/24/solid'

export type DashboardLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	const allMedia = await getAllMedia()

	const allTransaction = await getAllTransaction(user.id)

	const rentedMedia = allTransaction.filter(
		transaction => !transaction.returnedAt
	)
	const returnedMedia = allTransaction.filter(transaction =>
		Boolean(transaction.returnedAt)
	)
	const previousPayments = await getPaymentsByUserId(user.id)
	const totalAmount = returnedMedia.reduce((total, transaction) => {
		const payment = transaction.amount ?? 0
		return total + payment
	}, 0)

	const totalAmountDue = returnedMedia.reduce((total, transaction) => {
		const isDue = transaction.paymentStatus === PaymentStatus.UNPAID
		const amountDue = isDue ? transaction.amount - transaction.paid : 0
		return total + amountDue
	}, 0)

	return json({
		user,
		allMedia,
		rentedMedia,
		returnedMedia,
		previousPayments,
		totalAmountDue,
		totalAmount,
		isAdmin: user.role === Role.ADMIN,
	})
}

export default function DashboardLayout() {
	const id = React.useId()
	const {user} = useUser()
	const {isAdmin} = useLoaderData<typeof loader>()

	const paymentFetcher = useFetcher()
	const isSubmittingPayment = paymentFetcher.state !== 'idle'
	const [isCartDrawerOpen, handleCartDrawer] = useDisclosure(false)
	const [isPaymentModalOpen, handlePaymentModal] = useDisclosure(false)
	const {itemsInCart, clearCart, totalRent, removeItemFromCart} = useCart()

	const rentMedias = (e: React.FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget)

		formData.append('media[]', JSON.stringify(itemsInCart))

		paymentFetcher.submit(formData, {
			method: 'POST',
			action: '/api/transaction',
			replace: true,
		})
		e.preventDefault()
	}

	React.useEffect(() => {
		if (paymentFetcher.type !== 'done') {
			return
		}

		if (!paymentFetcher.data?.success) {
			return
		}

		handleCartDrawer.close()
		handlePaymentModal.close()
		clearCart()
	}, [paymentFetcher.data, paymentFetcher.type])

	return (
		<>
			<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:divide-y lg:divide-gray-200 lg:px-8">
				<div className="relative h-16 flex justify-between">
					<div className="relative z-10 px-2 flex lg:px-0">
						<div className="flex-shrink-0 flex items-center">
							<img
								className="block h-8 w-auto"
								src="https://upload.wikimedia.org/wikipedia/commons/0/05/Estore_Corporation_logo.png?20191218081608"
								alt="Workflow"
							/>
						</div>
					</div>

					<div className="hidden lg:relative lg:z-10 lg:ml-4 lg:flex lg:items-center lg:gap-4">
						<Button
							variant="gradient"
							compact
							className="block w-full px-4 py-2 text-left text-sm text-gray-700 uppercase"
							onClick={() => handleCartDrawer.open()}
						>
							Cart
						</Button>

						<Form replace action="/auth/logout" method="post">
							<Button
								variant="subtle"
								type="submit"
								className="block w-full px-4 py-2 text-left text-sm text-gray-700 uppercase"
							>
								Logout
							</Button>
						</Form>
					</div>
				</div>

				<nav
					className="py-2 flex items-center justify-center "
					aria-label="Global"
				>
					{isAdmin ? (
						siteConfig.adminLinks.map(link => (
							<NavLink
								key={link.name}
								to={link.href}
								prefetch="intent"
								end={link.href === '/admin'}
								className={({isActive}) =>
									cx(
										isActive
											? 'bg-gray-100 text-gray-900'
											: 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
										'rounded-md py-2 px-3 inline-flex items-center text-sm font-medium'
									)
								}
							>
								{link.name}
							</NavLink>
						))
					) : (
						<div>
							{siteConfig.publicLinks.map(link => (
								<NavLink
									key={link.name}
									to={link.href}
									prefetch="intent"
									end={link.href === '/'}
									className={({isActive}) =>
										cx(
											isActive
												? 'bg-blue-100 text-gray-900'
												: 'text-gray-900 hover:bg-blue-50 hover:text-gray-900',
											'rounded-md py-2 px-3 inline-flex items-center uppercase font-bold text-xs'
										)
									}
								>
									{link.name}
								</NavLink>
							))}

							{user &&
								siteConfig.navigationLinks.map(link => (
									<NavLink
										key={link.name}
										to={link.href}
										prefetch="intent"
										end={link.href === '/'}
										className={({isActive}) =>
											cx(
												isActive
													? 'bg-blue-100 text-gray-900'
													: 'text-gray-900 hover:bg-blue-50 hover:text-gray-900',
												'rounded-md py-2 px-3 inline-flex items-center uppercase font-bold text-xs'
											)
										}
									>
										{link.name}
									</NavLink>
								))}
						</div>
					)}
				</nav>
			</div>

			<main className="min-h-full">
				<div className="max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>

			<Drawer
				opened={isCartDrawerOpen}
				onClose={() => handleCartDrawer.close()}
				title={<p className="p-4 font-bold">View Cart</p>}
				position="right"
				overlayBlur={1}
				overlayOpacity={0.7}
			>
				<div className="p-4">
					{itemsInCart.length > 0 ? (
						<div className="flex flex-col gap-4">
							<ul className="flex flex-col gap-2 pb-4 border-b">
								{itemsInCart.map(item => (
									<li
										key={item.id}
										className="flex items-center justify-between"
									>
										<p>{item.title}</p>
										<p>{formatCurrency(item.rentPerDay)}</p>
										<Button
											compact
											variant="subtle"
											color="red"
											onClick={() => removeItemFromCart(item.id)}
										>
											<TrashIcon className="w-4 h-4" />
										</Button>
									</li>
								))}
							</ul>

							<div className="flex items-center justify-between pt-4 text-gray-500">
								<p>Total: </p>
								<p>
									{formatCurrency(
										itemsInCart.reduce(
											(total, item) => total + item.rentPerDay,
											0
										)
									)}
								</p>
							</div>

							<div className="flex items-center gap-4 mt-8">
								<Button
									variant="outline"
									color="red"
									fullWidth
									onClick={handleCartDrawer.close}
								>
									Cancel
								</Button>

								<Button
									fullWidth
									variant="filled"
									onClick={() => handlePaymentModal.open()}
								>
									Rent
								</Button>
							</div>
						</div>
					) : (
						<div className="text-center">No items in cart</div>
					)}
				</div>
			</Drawer>

			<Modal
				opened={isPaymentModalOpen}
				onClose={handlePaymentModal.close}
				title="Complete your payment"
			>
				<paymentFetcher.Form
					method="post"
					className="flex flex-col gap-4"
					onSubmit={e => rentMedias(e)}
				>
					<input hidden name="userId" defaultValue={user.id} />
					<NumberInput
						label="Amount to pay"
						name="amount"
						icon="$"
						defaultValue={totalRent}
						readOnly
						required
					/>

					<Select
						name="paymentMethod"
						label="Payment method"
						clearable={false}
						data={Object.values(PaymentMethod).map(method => ({
							label: titleCase(method.replace(/_/g, ' ')),
							value: method,
						}))}
					/>

					<Input.Wrapper id={id} label="Credit card number" required>
						<Input
							id={id}
							component={ReactInputMask}
							mask="9999 9999 9999 9999"
							placeholder="XXXX XXXX XXXX XXXX"
							alwaysShowMask={false}
						/>
					</Input.Wrapper>

					<div className="flex items-center gap-4">
						<Input.Wrapper id={id + 'cvv'} label="CVV" required>
							<Input
								id={id + 'cvv'}
								name="cvv"
								component={ReactInputMask}
								mask="999"
								placeholder="XXX"
								alwaysShowMask={false}
							/>
						</Input.Wrapper>

						<DatePicker
							name="expiryDate"
							label="Expiry"
							inputFormat="MM/YYYY"
							clearable={false}
							placeholder="MM/YYYY"
							labelFormat="MM/YYYY"
							required
							minDate={new Date()}
							initialLevel="year"
							hideOutsideDates
						/>
					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<Button
							variant="light"
							color="red"
							onClick={handlePaymentModal.close}
							disabled={isSubmittingPayment}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							loading={isSubmittingPayment}
							loaderPosition="right"
						>
							Pay now
						</Button>
					</div>
				</paymentFetcher.Form>
			</Modal>
		</>
	)
}
