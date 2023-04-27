import {Button} from '@mantine/core'
import {PaymentStatus, Role} from '@prisma/client'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Form,
	NavLink,
	Outlet,
	useLoaderData,
	useLocation,
} from '@remix-run/react'
import siteConfig from 'site.config'
import {getAllMedia} from '~/lib/media.server'
import {getPaymentsByUserId} from '~/lib/payment.server'
import {requireUser} from '~/lib/session.server'
import {getAllTransaction} from '~/lib/transaction.server'
import {useOptionalUser} from '~/utils/hooks'
import {cx} from '~/utils/string'

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
	const location = useLocation()
	const {user} = useOptionalUser()
	const {isAdmin} = useLoaderData<typeof loader>()

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

					<div className="hidden lg:relative lg:z-10 lg:ml-4 lg:flex lg:items-center">
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
		</>
	)
}
